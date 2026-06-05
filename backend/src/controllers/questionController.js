import db from '../models/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { questionSchema } from '../validators/questionValidator.js';
import Papa from 'papaparse';

// Map snake_case req.body fields to Prisma camelCase fields
const mapToPrismaFields = (body, creatorId) => {
  const mapped = {};
  if (body.subject) mapped.subject = body.subject;
  if (body.chapter) mapped.chapter = body.chapter;
  if (body.topic) mapped.topic = body.topic;
  if (body.difficulty) mapped.difficulty = body.difficulty;
  if (body.type) mapped.type = body.type;
  if (body.question_text !== undefined) mapped.questionText = body.question_text;
  if (body.option_a !== undefined) mapped.optionA = body.option_a;
  if (body.option_b !== undefined) mapped.optionB = body.option_b;
  if (body.option_c !== undefined) mapped.optionC = body.option_c;
  if (body.option_d !== undefined) mapped.optionD = body.option_d;
  if (body.correct_answer !== undefined) mapped.correctAnswer = body.correct_answer;
  if (body.solution !== undefined) mapped.solution = body.solution;
  if (body.year !== undefined) mapped.year = body.year;
  if (body.exam_type) mapped.examType = body.exam_type;
  if (body.nta_weightage !== undefined) mapped.ntaWeightage = body.nta_weightage;
  if (creatorId) mapped.createdBy = creatorId;
  return mapped;
};

// Map Prisma camelCase fields back to snake_case for response compatibility
const mapToResponseFields = (q) => {
  if (!q) return null;
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
    correct_answer: q.correctAnswer,
    solution: q.solution,
    year: q.year,
    exam_type: q.examType,
    nta_weightage: q.ntaWeightage,
    created_by: q.createdBy,
    created_at: q.createdAt,
    deleted_at: q.deletedAt
  };
};

export const getQuestions = async (req, res, next) => {
  try {
    const { subject, chapter, topic, difficulty, type, exam_type, year, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      deletedAt: null
    };

    if (subject) where.subject = subject;
    if (chapter) where.chapter = chapter;
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;
    if (exam_type) where.examType = exam_type;
    if (year) where.year = parseInt(year);

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      db.question.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, {
      questions: questions.map(mapToResponseFields),
      total,
      page: pageNum,
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await db.question.findUnique({
      where: { id }
    });

    if (!question || question.deletedAt !== null) {
      return sendError(res, 'Question not found', 404);
    }

    return sendSuccess(res, mapToResponseFields(question));
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const validation = await questionSchema.safeParseAsync(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation error',
        details: errors
      });
    }

    // Map creator from authenticated user context
    const data = mapToPrismaFields(validation.data, req.user.id);
    
    // Ensure creator user exists in database or create default dev user to prevent foreign key issues
    const creatorExists = await db.user.findUnique({ where: { id: req.user.id } });
    if (!creatorExists) {
      await db.user.create({
        data: {
          id: req.user.id,
          name: req.user.name || "Default User",
          email: `${req.user.id}@test.com`,
          phone: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash: "dummyhash",
          role: req.user.role || "TEACHER",
          plan: "FREE"
        }
      });
    }

    const newQuestion = await db.question.create({
      data
    });

    return res.status(201).json({
      success: true,
      data: mapToResponseFields(newQuestion),
      error: null
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if exists and not soft deleted
    const question = await db.question.findUnique({ where: { id } });
    if (!question || question.deletedAt !== null) {
      return sendError(res, 'Question not found', 404);
    }

    // Partial schema validation
    const partialSchema = questionSchema.partial();
    const validation = await partialSchema.safeParseAsync(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation error',
        details: errors
      });
    }

    // Map input to prisma fields, omitting system columns
    const cleanData = mapToPrismaFields(validation.data);
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.createdBy;
    delete cleanData.deletedAt;

    const updated = await db.question.update({
      where: { id },
      data: cleanData
    });

    return sendSuccess(res, mapToResponseFields(updated));
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await db.question.findUnique({ where: { id } });
    if (!question) {
      return sendError(res, 'Question not found', 404);
    }
    if (question.deletedAt !== null) {
      return sendError(res, 'Question already deleted', 400);
    }

    await db.question.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No CSV file provided', 400);
    }

    const csvData = req.file.buffer.toString('utf8');
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    if (parseResult.errors.length > 0) {
      return sendError(res, `CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`, 400);
    }

    const rows = parseResult.data;
    const details = [];

    // Ensure creator user exists
    const creatorExists = await db.user.findUnique({ where: { id: req.user.id } });
    if (!creatorExists) {
      await db.user.create({
        data: {
          id: req.user.id,
          name: req.user.name || "Default User",
          email: `${req.user.id}@test.com`,
          phone: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash: "dummyhash",
          role: req.user.role || "TEACHER",
          plan: "FREE"
        }
      });
    }

    // Row-by-row validation (CSV rows are 1-indexed, header is row 1, so data starts at row 2)
    const validatedRows = [];
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const validation = questionSchema.safeParse(rows[i]);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        details.push({
          row: rowNum,
          errors: errorMessages
        });
      } else {
        validatedRows.push(validation.data);
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Validation failed on ${details.length} rows`,
        details
      });
    }

    // If all valid, execute batch insert in transaction
    try {
      const prismaRows = validatedRows.map(row => mapToPrismaFields(row, req.user.id));
      await db.$transaction(async (tx) => {
        // Prisma createMany is fast but we execute inside a transaction context for completeness
        await tx.question.createMany({
          data: prismaRows
        });
      });

      return sendSuccess(res, { inserted: rows.length, errors: [] });
    } catch (dbError) {
      console.error(dbError);
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Bulk insert failed — no records saved',
        details: []
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getChapters = async (req, res, next) => {
  try {
    const { subject } = req.query;
    if (!subject) {
      return sendError(res, 'Subject query param is required', 400);
    }

    const distinctChapters = await db.question.findMany({
      where: {
        subject: subject,
        deletedAt: null
      },
      select: {
        chapter: true
      },
      distinct: ['chapter']
    });

    const chapters = distinctChapters.map(c => c.chapter).sort((a, b) => a.localeCompare(b));

    return sendSuccess(res, {
      subject,
      chapters
    });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const { subject, chapter } = req.query;
    if (!subject || !chapter) {
      return sendError(res, 'Subject and chapter query params are required', 400);
    }

    const distinctTopics = await db.question.findMany({
      where: {
        subject: subject,
        chapter: chapter,
        deletedAt: null
      },
      select: {
        topic: true
      },
      distinct: ['topic']
    });

    const topics = distinctTopics.map(t => t.topic).sort((a, b) => a.localeCompare(b));

    return sendSuccess(res, {
      subject,
      chapter,
      topics
    });
  } catch (error) {
    next(error);
  }
};
