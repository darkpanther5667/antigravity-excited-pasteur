import db from '../models/db.js';

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const createNtaMainsTest = async (title, scheduledAt, adminId) => {
  const requirements = [
    { subject: 'PHYSICS', type: 'SINGLE', needed: 20 },
    { subject: 'PHYSICS', type: 'INTEGER', needed: 5 },
    { subject: 'CHEMISTRY', type: 'SINGLE', needed: 20 },
    { subject: 'CHEMISTRY', type: 'INTEGER', needed: 5 },
    { subject: 'MATHS', type: 'SINGLE', needed: 20 },
    { subject: 'MATHS', type: 'INTEGER', needed: 5 }
  ];

  const shortfall = [];
  const selectedQuestions = [];

  // 1. Check counts and fetch questions for each combination
  for (const req of requirements) {
    const questions = await db.question.findMany({
      where: {
        subject: req.subject,
        type: req.type,
        deletedAt: null
      }
    });

    if (questions.length < req.needed) {
      shortfall.push({
        subject: req.subject,
        type: req.type,
        needed: req.needed,
        available: questions.length
      });
    } else {
      // Shuffle in memory to guarantee random selection
      const shuffled = shuffle([...questions]);
      const sliced = shuffled.slice(0, req.needed);
      
      // Keep track of section mapping and order within the factory
      sliced.forEach((q, idx) => {
        selectedQuestions.push({
          questionId: q.id,
          section: req.subject,
          marksCorrect: 4,
          marksIncorrect: req.type === 'INTEGER' ? 0.00 : -1.00,
          // Let question order be indexed across the whole test (1 to 75)
          questionOrder: selectedQuestions.length + 1
        });
      });
    }
  }

  // 2. If any combination is short, throw the specific error format
  if (shortfall.length > 0) {
    const err = new Error('Insufficient questions for NTA Mains test');
    err.shortfall = shortfall;
    throw err;
  }

  // 3. Create NTA Mains test record and associate questions in a transaction
  const test = await db.$transaction(async (tx) => {
    // Check if creator user exists
    const creatorExists = await tx.user.findUnique({ where: { id: adminId } });
    if (!creatorExists) {
      await tx.user.create({
        data: {
          id: adminId,
          name: "Default Admin",
          email: `${adminId}@test.com`,
          phone: "8888888888",
          passwordHash: "dummyhash",
          role: "ADMIN",
          plan: "FREE"
        }
      });
    }

    const newTest = await tx.test.create({
      data: {
        title,
        type: 'FULL_MOCK',
        examType: 'MAINS',
        durationMinutes: 180,
        totalMarks: 300,
        instructions: 'Standard JEE Mains Mock Exam. Please read instructions carefully before starting.',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isPublished: false,
        createdBy: adminId
      }
    });

    // Bulk attach selected questions to the test questions relational table
    const testQuestionsData = selectedQuestions.map(sq => ({
      testId: newTest.id,
      questionId: sq.questionId,
      section: sq.section,
      questionOrder: sq.questionOrder,
      marksCorrect: sq.marksCorrect,
      marksIncorrect: sq.marksIncorrect
    }));

    await tx.testQuestion.createMany({
      data: testQuestionsData
    });

    return newTest;
  });

  return test;
};
