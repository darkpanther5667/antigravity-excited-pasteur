import db from '../models/db.js';
import { getCache, setCache } from '../utils/redis.js';

function truncateName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export const getTestLeaderboard = async (testId, page = 1, limit = 20) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const cacheKey = `leaderboard:test:${testId}:${pageNum}:${limitNum}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn('Redis read failed, falling back to database:', err.message);
  }

  const test = await db.test.findUnique({
    where: { id: testId, deletedAt: null }
  });

  if (!test) {
    throw new Error('Test not found');
  }

  const attempts = await db.attempt.findMany({
    where: {
      testId,
      submittedAt: { not: null }
    },
    include: {
      user: {
        include: {
          institute: true
        }
      }
    },
    orderBy: [
      { totalScore: 'desc' },
      { timeTakenSeconds: 'asc' }
    ]
  });

  let currentRank = 1;
  const rankedAttempts = attempts.map((att, index) => {
    if (index > 0) {
      const prev = attempts[index - 1];
      if (att.totalScore !== prev.totalScore || att.timeTakenSeconds !== prev.timeTakenSeconds) {
        currentRank = index + 1;
      }
    }
    return {
      rank: currentRank,
      name: truncateName(att.user.name),
      institute: att.user.institute ? att.user.institute.name : null,
      score: att.totalScore,
      percentile: att.percentile,
      physicsScore: att.physicsScore,
      chemistryScore: att.chemistryScore,
      mathsScore: att.mathsScore,
      userId: att.userId,
      attemptId: att.id
    };
  });

  const skip = (pageNum - 1) * limitNum;
  const paginatedList = rankedAttempts.slice(skip, skip + limitNum).map(({ userId, attemptId, ...rest }) => rest);
  const total = rankedAttempts.length;
  const totalPages = Math.ceil(total / limitNum);

  const result = {
    test: {
      id: test.id,
      title: test.title,
      total_marks: test.totalMarks
    },
    leaderboard: paginatedList,
    total,
    page: pageNum,
    totalPages
  };

  try {
    await setCache(cacheKey, result, 60);
  } catch (err) {
    console.warn('Redis write failed:', err.message);
  }

  return result;
};

export const getTestRankGaps = async (testId, userId, attemptId) => {
  const userAttempt = await db.attempt.findFirst({
    where: {
      id: attemptId,
      testId,
      userId,
      submittedAt: { not: null }
    }
  });

  if (!userAttempt) {
    const err = new Error('Attempt not found or not submitted');
    err.status = 404;
    throw err;
  }

  const attempts = await db.attempt.findMany({
    where: {
      testId,
      submittedAt: { not: null }
    },
    include: {
      user: {
        include: {
          institute: true
        }
      }
    },
    orderBy: [
      { totalScore: 'desc' },
      { timeTakenSeconds: 'asc' }
    ]
  });

  let currentRank = 1;
  const rankedAttempts = attempts.map((att, index) => {
    if (index > 0) {
      const prev = attempts[index - 1];
      if (att.totalScore !== prev.totalScore || att.timeTakenSeconds !== prev.timeTakenSeconds) {
        currentRank = index + 1;
      }
    }
    return {
      rank: currentRank,
      name: truncateName(att.user.name),
      institute: att.user.institute ? att.user.institute.name : null,
      score: att.totalScore,
      percentile: att.percentile,
      physicsScore: att.physicsScore,
      chemistryScore: att.chemistryScore,
      mathsScore: att.mathsScore,
      userId: att.userId,
      attemptId: att.id
    };
  });

  const idx = rankedAttempts.findIndex(att => att.attemptId === attemptId);
  if (idx === -1) {
    const err = new Error('Attempt not found in rankings');
    err.status = 404;
    throw err;
  }

  const above = rankedAttempts.slice(Math.max(0, idx - 2), idx);
  const self = rankedAttempts[idx];
  const below = rankedAttempts.slice(idx + 1, idx + 3);

  return [...above, self, ...below].map(({ userId, attemptId, ...rest }) => rest);
};

export const getGlobalLeaderboard = async (page = 1, limit = 20) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  const students = await db.user.findMany({
    where: {
      role: 'STUDENT',
      isActive: true
    },
    include: {
      institute: true,
      attempts: {
        where: {
          submittedAt: { not: null }
        }
      }
    }
  });

  const studentList = students.map(student => {
    const submittedAttempts = student.attempts || [];
    if (submittedAttempts.length === 0) return null;

    const sumPercentile = submittedAttempts.reduce((sum, att) => sum + (att.percentile || 0), 0);
    const avgPercentile = sumPercentile / submittedAttempts.length;

    return {
      name: truncateName(student.name),
      institute: student.institute ? student.institute.name : null,
      avgPercentile: Math.round(avgPercentile * 100) / 100,
      testsTaken: submittedAttempts.length
    };
  }).filter(Boolean);

  studentList.sort((a, b) => b.avgPercentile - a.avgPercentile);

  let currentRank = 1;
  const rankedStudents = studentList.map((st, index) => {
    if (index > 0) {
      const prev = studentList[index - 1];
      if (st.avgPercentile !== prev.avgPercentile) {
        currentRank = index + 1;
      }
    }
    return {
      rank: currentRank,
      ...st
    };
  });

  const skip = (pageNum - 1) * limitNum;
  const paginatedList = rankedStudents.slice(skip, skip + limitNum);
  const total = rankedStudents.length;
  const totalPages = Math.ceil(total / limitNum);

  return {
    leaderboard: paginatedList,
    total,
    page: pageNum,
    totalPages
  };
};
