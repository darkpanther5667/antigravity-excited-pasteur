import db from '../models/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { testSchema } from '../validators/testValidator.js';
import { testQuestionsSchema } from '../validators/testQuestionValidator.js';
import { sanitizeForAttempt, sanitizeForResult } from '../utils/sanitizeQuestion.js';
import { calculateScore } from '../services/scoringService.js';
import { createNtaMainsTest } from '../services/ntaTestFactory.js';

const ensureUserExists = async (userId, role, name) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    await db.user.create({
      data: {
        id: userId,
        name: name || `Dev ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}`,
        email: `${userId}@test.com`,
        phone: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        passwordHash: 'dummyhash',
        role: role,
        plan: 'FREE'
      }
    });
  }
};

export const getTests = async (req, res, next) => {
  try {
    const { type, exam_type, is_published, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      deletedAt: null
    };

    if (type) where.type = type;
    if (exam_type) where.examType = exam_type;
    if (is_published !== undefined) where.isPublished = is_published === 'true';

    const [tests, total] = await Promise.all([
      db.test.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      db.test.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, {
      tests,
      total,
      page: pageNum,
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await db.test.findUnique({
      where: { id },
      include: {
        testQuestions: {
          include: {
            question: true
          },
          orderBy: {
            questionOrder: 'asc'
          }
        }
      }
    });

    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    // Question count per section
    let physicsCount = 0;
    let chemistryCount = 0;
    let mathsCount = 0;

    const sanitizedQuestions = test.testQuestions.map(tq => {
      const q = tq.question;
      if (tq.section === 'PHYSICS') physicsCount++;
      if (tq.section === 'CHEMISTRY') chemistryCount++;
      if (tq.section === 'MATHS') mathsCount++;

      return {
        id: q.id,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        question_text: q.questionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        year: q.year,
        exam_type: q.examType,
        nta_weightage: q.ntaWeightage,
        question_order: tq.questionOrder,
        marks_correct: tq.marksCorrect,
        marks_incorrect: tq.marksIncorrect
      };
    });

    return sendSuccess(res, {
      id: test.id,
      title: test.title,
      type: test.type,
      exam_type: test.examType,
      duration_minutes: test.durationMinutes,
      total_marks: test.totalMarks,
      instructions: test.instructions,
      scheduled_at: test.scheduledAt,
      is_published: test.isPublished,
      created_by: test.createdBy,
      created_at: test.createdAt,
      sections: {
        physics: physicsCount,
        chemistry: chemistryCount,
        maths: mathsCount
      },
      questions: sanitizedQuestions
    });
  } catch (error) {
    next(error);
  }
};

export const createTest = async (req, res, next) => {
  try {
    const validation = testSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    await ensureUserExists(req.user.id, req.user.role, req.user.name);

    // Enforce is_published: false by default
    const testData = {
      title: validation.data.title,
      type: validation.data.type,
      examType: validation.data.exam_type,
      durationMinutes: validation.data.duration_minutes,
      totalMarks: validation.data.total_marks,
      instructions: validation.data.instructions || '',
      scheduledAt: validation.data.scheduled_at ? new Date(validation.data.scheduled_at) : null,
      isPublished: false,
      createdBy: req.user.id
    };

    const newTest = await db.test.create({
      data: testData
    });

    return res.status(201).json({
      success: true,
      data: newTest,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

export const addQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await db.test.findUnique({ where: { id } });
    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    const validation = testQuestionsSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const questionsToAdd = validation.data.questions;

    // Validate: no duplicate question_id in input or already in test
    const inputQuestionIds = questionsToAdd.map(q => q.question_id);
    const uniqueInputQuestionIds = new Set(inputQuestionIds);
    if (uniqueInputQuestionIds.size !== inputQuestionIds.length) {
      return sendError(res, 'Duplicate question_id in input list', 400);
    }

    // Check if questions are already in test
    const existingTestQuestions = await db.testQuestion.findMany({
      where: { testId: id }
    });

    const existingIds = new Set(existingTestQuestions.map(tq => tq.questionId));
    for (const qId of inputQuestionIds) {
      if (existingIds.has(qId)) {
        return sendError(res, 'Question already in test', 400);
      }
    }

    // Validate: question must exist and not be soft-deleted
    for (const qId of inputQuestionIds) {
      const dbQ = await db.question.findUnique({ where: { id: qId } });
      if (!dbQ || dbQ.deletedAt !== null) {
        return sendError(res, `Question with id ${qId} does not exist or is deleted`, 400);
      }
    }

    // Validate unique question_order (within input and against existing)
    const existingOrders = new Set(existingTestQuestions.map(tq => tq.questionOrder));
    const inputOrders = questionsToAdd.map(q => q.question_order);
    const uniqueInputOrders = new Set(inputOrders);
    if (uniqueInputOrders.size !== inputOrders.length) {
      return sendError(res, 'Duplicate question_order in input list', 400);
    }

    for (const order of inputOrders) {
      if (existingOrders.has(order)) {
        return sendError(res, `Question order N already used in this test`, 400);
      }
    }

    // Map input snake_case keys to camelCase for createMany insertion
    const insertData = questionsToAdd.map(q => ({
      testId: id,
      questionId: q.question_id,
      section: q.section,
      questionOrder: q.question_order,
      marksCorrect: q.marks_correct,
      marksIncorrect: q.marks_incorrect
    }));

    await db.testQuestion.createMany({
      data: insertData
    });

    const count = await db.testQuestion.count({
      where: { testId: id }
    });

    return sendSuccess(res, { question_count: count });

  } catch (error) {
    next(error);
  }
};

export const deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await db.test.findUnique({ where: { id } });
    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    await db.test.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

export const publishTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    if (is_published === undefined) {
      return sendError(res, 'is_published boolean field is required', 400);
    }

    const test = await db.test.findUnique({ where: { id } });
    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    const updated = await db.test.update({
      where: { id },
      data: { isPublished: is_published === true || is_published === 'true' }
    });

    return sendSuccess(res, { is_published: updated.isPublished });
  } catch (error) {
    next(error);
  }
};

export const startTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await ensureUserExists(req.user.id, req.user.role, req.user.name);

    const test = await db.test.findUnique({
      where: { id },
      include: {
        testQuestions: {
          include: { question: true },
          orderBy: { questionOrder: 'asc' }
        }
      }
    });

    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    // Check test is published
    if (!test.isPublished) {
      return sendError(res, 'Test is not available', 400);
    }

    // Enforce Pro plan or above for adaptive tests
    if (test.type === 'ADAPTIVE') {
      const user = await db.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      if (user.plan !== 'FREE' && user.planExpiry) {
        const now = new Date();
        if (now > new Date(user.planExpiry)) {
          return sendError(res, 'Your plan has expired. Please renew.', 403);
        }
      }
      const planHierarchy = { FREE: 0, PRO: 1, ELITE: 2 };
      if ((planHierarchy[user.plan] || 0) < 1) {
        return sendError(res, 'This feature requires Pro plan or above', 403);
      }
    }

    // Check if attempt already exists for user_id + test_id
    const existingAttempt = await db.attempt.findFirst({
      where: {
        userId: req.user.id,
        testId: id
      }
    });

    // Determine count of questions per section
    let physicsCount = 0;
    let chemistryCount = 0;
    let mathsCount = 0;

    const attemptQuestions = test.testQuestions.map(tq => {
      const q = tq.question;
      if (tq.section === 'PHYSICS') physicsCount++;
      if (tq.section === 'CHEMISTRY') chemistryCount++;
      if (tq.section === 'MATHS') mathsCount++;

      return sanitizeForAttempt({
        id: q.id,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        question_text: q.questionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        year: q.year,
        exam_type: q.examType,
        nta_weightage: q.ntaWeightage,
        question_order: tq.questionOrder
      });
    });

    if (existingAttempt) {
      // If already submitted, return 400
      if (existingAttempt.submittedAt !== null) {
        return sendError(res, 'Test already submitted', 400);
      }

      // Resume: return existing attempt with responses
      const responses = await db.response.findMany({
        where: { attemptId: existingAttempt.id }
      });

      return sendSuccess(res, {
        attempt_id: existingAttempt.id,
        test: {
          id: test.id,
          title: test.title,
          duration_minutes: test.durationMinutes,
          total_marks: test.totalMarks,
          instructions: test.instructions
        },
        questions: attemptQuestions,
        sections: {
          physics: physicsCount,
          chemistry: chemistryCount,
          maths: mathsCount
        },
        time_remaining_seconds: existingAttempt.timeRemaining,
        responses: responses.map(r => ({
          question_id: r.questionId,
          selected_answer: r.selectedAnswer,
          status: r.status,
          time_spent_seconds: r.timeSpentSeconds
        }))
      });
    }

    // Create new attempt
    const timeRemaining = test.durationMinutes * 60;
    const newAttempt = await db.attempt.create({
      data: {
        userId: req.user.id,
        testId: id,
        startedAt: new Date(),
        timeRemaining
      }
    });

    // Return starter body
    return sendSuccess(res, {
      attempt_id: newAttempt.id,
      test: {
        id: test.id,
        title: test.title,
        duration_minutes: test.durationMinutes,
        total_marks: test.totalMarks,
        instructions: test.instructions
      },
      questions: attemptQuestions,
      sections: {
        physics: physicsCount,
        chemistry: chemistryCount,
        maths: mathsCount
      },
      time_remaining_seconds: timeRemaining
    });

  } catch (error) {
    next(error);
  }
};

export const saveResponse = async (req, res, next) => {
  try {
    const { attempt_id, question_id, selected_answer, status, time_spent_seconds, time_remaining } = req.body;

    if (!attempt_id || !question_id || !status) {
      return sendError(res, 'attempt_id, question_id, and status fields are required', 400);
    }

    // Check if attempt exists and matches current user
    const attempt = await db.attempt.findUnique({ where: { id: attempt_id } });
    if (!attempt || attempt.userId !== req.user.id) {
      return sendError(res, 'Attempt not found or unauthorized', 404);
    }

    if (attempt.submittedAt !== null) {
      return sendError(res, 'Test already submitted', 400);
    }

    // Upsert response
    const existingResponse = await db.response.findFirst({
      where: {
        attemptId: attempt_id,
        questionId: question_id
      }
    });

    if (existingResponse) {
      await db.response.update({
        where: { id: existingResponse.id },
        data: {
          selectedAnswer: selected_answer,
          status,
          timeSpentSeconds: time_spent_seconds || 0
        }
      });
    } else {
      await db.response.create({
        data: {
          attemptId: attempt_id,
          questionId: question_id,
          selectedAnswer: selected_answer,
          status,
          timeSpentSeconds: time_spent_seconds || 0
        }
      });
    }

    // Update timeRemaining in attempt if provided
    if (time_remaining !== undefined) {
      await db.attempt.update({
        where: { id: attempt_id },
        data: { timeRemaining: parseInt(time_remaining.toString()) }
      });
    }

    return sendSuccess(res, { saved: true });

  } catch (error) {
    next(error);
  }
};

export const submitTest = async (req, res, next) => {
  try {
    const { attempt_id } = req.body;
    if (!attempt_id) {
      return sendError(res, 'attempt_id is required', 400);
    }

    const attempt = await db.attempt.findUnique({
      where: { id: attempt_id },
      include: { test: true }
    });

    if (!attempt || attempt.userId !== req.user.id) {
      return sendError(res, 'Attempt not found or unauthorized', 404);
    }

    if (attempt.submittedAt !== null) {
      return sendError(res, 'Test already submitted', 400);
    }

    // Set submitted_at
    await db.attempt.update({
      where: { id: attempt_id },
      data: { submittedAt: new Date() }
    });

    // Score attempt
    const scored = await calculateScore(attempt_id);

    // Get formatted result
    const result = await formatResult(scored);
    return sendSuccess(res, result);

  } catch (error) {
    next(error);
  }
};

export const getTestResult = async (req, res, next) => {
  try {
    const { attempt_id } = req.params;
    const attempt = await db.attempt.findUnique({
      where: { id: attempt_id },
      include: {
        test: true,
        responses: {
          include: { question: true }
        }
      }
    });

    if (!attempt) {
      return sendError(res, 'Attempt not found', 404);
    }

    // Restrict student access to own attempts only
    if (req.user.role === 'STUDENT' && attempt.userId !== req.user.id) {
      return sendError(res, 'Forbidden', 403);
    }

    if (attempt.submittedAt === null) {
      return sendError(res, 'Result not available — test not yet submitted', 400);
    }

    const result = await formatResult(attempt);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createNtaMainsTestController = async (req, res, next) => {
  try {
    const { title, scheduled_at } = req.body;
    if (!title) {
      return sendError(res, 'title is required', 400);
    }

    try {
      const test = await createNtaMainsTest(title, scheduled_at, req.user.id);
      return res.status(201).json({
        success: true,
        data: test,
        error: null
      });
    } catch (err) {
      if (err.shortfall) {
        return res.status(400).json({
          success: false,
          data: null,
          error: err.message,
          shortfall: err.shortfall
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Result compilation formatter helper
const formatResult = async (attempt) => {
  const test = attempt.test;
  const responses = attempt.responses || [];

  let attempted = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let timeTaken = 0;

  const sectionBreakdown = {
    PHYSICS: { attempted: 0, correct: 0, incorrect: 0, score: 0 },
    CHEMISTRY: { attempted: 0, correct: 0, incorrect: 0, score: 0 },
    MATHS: { attempted: 0, correct: 0, incorrect: 0, score: 0 }
  };

  const formattedResponses = responses.map(r => {
    const q = r.question;
    const isCorrect = r.isCorrect;
    const marksAwarded = parseFloat(r.marksAwarded.toString());
    timeTaken += r.timeSpentSeconds;

    const section = q.subject; // PHYSICS, CHEMISTRY, MATHS

    if (r.status === 'ANSWERED' && r.selectedAnswer) {
      attempted++;
      sectionBreakdown[section].attempted++;
      if (isCorrect) {
        correct++;
        sectionBreakdown[section].correct++;
      } else {
        incorrect++;
        sectionBreakdown[section].incorrect++;
      }
    } else {
      unanswered++;
    }

    sectionBreakdown[section].score += marksAwarded;

    return {
      question_id: q.id,
      question_text: q.questionText,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      type: q.type,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctAnswer, // safe to expose after test submitted
      solution: q.solution,
      selected_answer: r.selectedAnswer,
      is_correct: isCorrect,
      marks_awarded: marksAwarded,
      time_spent_seconds: r.timeSpentSeconds,
      status: r.status
    };
  });

  // Calculate totals
  const totalScore = parseFloat(attempt.totalScore.toString());
  const physicsScore = parseFloat(attempt.physicsScore.toString());
  const chemistryScore = parseFloat(attempt.chemistryScore.toString());
  const mathsScore = parseFloat(attempt.mathsScore.toString());

  // Round scores in breakdown
  Object.keys(sectionBreakdown).forEach(sec => {
    sectionBreakdown[sec].score = Math.round(sectionBreakdown[sec].score * 100) / 100;
  });

  return {
    attempt_id: attempt.id,
    test: {
      id: test.id,
      title: test.title,
      type: test.type,
      exam_type: test.examType,
      duration_minutes: test.durationMinutes,
      total_marks: test.totalMarks
    },
    scores: {
      total: totalScore,
      physics: physicsScore,
      chemistry: chemistryScore,
      maths: mathsScore,
      max_possible: test.totalMarks
    },
    stats: {
      attempted,
      correct,
      incorrect,
      unanswered,
      time_taken_seconds: timeTaken,
      percentile: attempt.percentile,
      rank: attempt.rank
    },
    section_breakdown: {
      physics: sectionBreakdown.PHYSICS,
      chemistry: sectionBreakdown.CHEMISTRY,
      maths: sectionBreakdown.MATHS
    },
    responses: formattedResponses
  };
};

export const updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await db.test.findUnique({ where: { id } });
    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    const validation = testSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return sendError(res, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const testData = {};
    if (validation.data.title !== undefined) testData.title = validation.data.title;
    if (validation.data.type !== undefined) testData.type = validation.data.type;
    if (validation.data.exam_type !== undefined) testData.examType = validation.data.exam_type;
    if (validation.data.duration_minutes !== undefined) testData.durationMinutes = validation.data.duration_minutes;
    if (validation.data.total_marks !== undefined) testData.totalMarks = validation.data.total_marks;
    if (validation.data.instructions !== undefined) testData.instructions = validation.data.instructions;
    if (validation.data.scheduled_at !== undefined) {
      testData.scheduledAt = validation.data.scheduled_at ? new Date(validation.data.scheduled_at) : null;
    }

    const updated = await db.test.update({
      where: { id },
      data: testData
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const setQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await db.test.findUnique({ where: { id } });
    if (!test || test.deletedAt !== null) {
      return sendError(res, 'Test not found', 404);
    }

    const validation = testQuestionsSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const questionsToSet = validation.data.questions;

    // Validate: no duplicate question_id in input
    const inputQuestionIds = questionsToSet.map(q => q.question_id);
    const uniqueInputQuestionIds = new Set(inputQuestionIds);
    if (uniqueInputQuestionIds.size !== inputQuestionIds.length) {
      return sendError(res, 'Duplicate question_id in input list', 400);
    }

    // Validate: questions must exist and not be soft-deleted
    for (const qId of inputQuestionIds) {
      const dbQ = await db.question.findUnique({ where: { id: qId } });
      if (!dbQ || dbQ.deletedAt !== null) {
        return sendError(res, `Question with id ${qId} does not exist or is deleted`, 400);
      }
    }

    // Validate unique question_order
    const inputOrders = questionsToSet.map(q => q.question_order);
    const uniqueInputOrders = new Set(inputOrders);
    if (uniqueInputOrders.size !== inputOrders.length) {
      return sendError(res, 'Duplicate question_order in input list', 400);
    }

    const insertData = questionsToSet.map(q => ({
      testId: id,
      questionId: q.question_id,
      section: q.section,
      questionOrder: q.question_order,
      marksCorrect: q.marks_correct,
      marksIncorrect: q.marks_incorrect
    }));

    // Perform inside a transaction: delete old, create new
    await db.$transaction(async (tx) => {
      await tx.testQuestion.deleteMany({
        where: { testId: id }
      });
      await tx.testQuestion.createMany({
        data: insertData
      });
    });

    const count = await db.testQuestion.count({
      where: { testId: id }
    });

    return sendSuccess(res, { question_count: count });
  } catch (error) {
    next(error);
  }
};

