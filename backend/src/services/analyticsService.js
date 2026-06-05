import db from '../models/db.js';

/**
 * Helper to ensure the user has at least one submitted attempt.
 * Throws an error if none are found.
 */
const checkSubmittedAttemptsExist = async (userId) => {
  const count = await db.attempt.count({
    where: {
      userId,
      submittedAt: { not: null }
    }
  });
  if (count === 0) {
    throw new Error('No submitted attempts found for this user');
  }
};

/**
 * GET /api/v1/analytics/me/overview
 */
export const getOverview = async (userId) => {
  await checkSubmittedAttemptsExist(userId);

  const attempts = await db.attempt.findMany({
    where: {
      userId,
      submittedAt: { not: null }
    },
    include: {
      test: true,
      responses: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  const total_tests_taken = attempts.length;

  let totalScoreSum = 0;
  let percentileSum = 0;
  let bestRank = null;
  let bestScore = -Infinity;
  let bestTestAttempt = null;

  attempts.forEach(att => {
    const score = att.totalScore || 0;
    const pct = att.percentile || 0;
    const rank = att.rank;

    totalScoreSum += score;
    percentileSum += pct;

    if (rank !== null) {
      if (bestRank === null || rank < bestRank) {
        bestRank = rank;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTestAttempt = att;
    }
  });

  const average_score = total_tests_taken > 0 ? parseFloat((totalScoreSum / total_tests_taken).toFixed(2)) : 0;
  const average_percentile = total_tests_taken > 0 ? parseFloat((percentileSum / total_tests_taken).toFixed(2)) : 0;

  const best_rank = bestRank !== null ? bestRank : 1;
  const best_score = bestScore !== -Infinity ? bestScore : 0;

  const best_test = bestTestAttempt ? {
    id: bestTestAttempt.test.id,
    title: bestTestAttempt.test.title,
    score: bestTestAttempt.totalScore || 0,
    percentile: bestTestAttempt.percentile || 0,
    date: bestTestAttempt.submittedAt
  } : null;

  // recent_trend
  let recent_trend = "stable";
  if (attempts.length >= 6) {
    const last3Avg = (attempts[0].totalScore + attempts[1].totalScore + attempts[2].totalScore) / 3;
    const prev3Avg = (attempts[3].totalScore + attempts[4].totalScore + attempts[5].totalScore) / 3;
    const diff = last3Avg - prev3Avg;
    if (diff > 5) {
      recent_trend = "improving";
    } else if (diff < -5) {
      recent_trend = "declining";
    } else {
      recent_trend = "stable";
    }
  }

  // Subject averages & accuracy
  const subjectStats = {
    PHYSICS: { scoreSum: 0, correct: 0, attempted: 0 },
    CHEMISTRY: { scoreSum: 0, correct: 0, attempted: 0 },
    MATHS: { scoreSum: 0, correct: 0, attempted: 0 }
  };

  let totalTimeSeconds = 0;

  attempts.forEach(att => {
    subjectStats.PHYSICS.scoreSum += att.physicsScore || 0;
    subjectStats.CHEMISTRY.scoreSum += att.chemistryScore || 0;
    subjectStats.MATHS.scoreSum += att.mathsScore || 0;

    att.responses.forEach(resp => {
      const sub = resp.question.subject; // PHYSICS | CHEMISTRY | MATHS
      totalTimeSeconds += resp.timeSpentSeconds || 0;

      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      if (isAttempted) {
        subjectStats[sub].attempted++;
        if (resp.isCorrect === true) {
          subjectStats[sub].correct++;
        }
      }
    });
  });

  const subject_averages = {
    physics: {
      avg_score: total_tests_taken > 0 ? parseFloat((subjectStats.PHYSICS.scoreSum / total_tests_taken).toFixed(2)) : 0,
      avg_accuracy: subjectStats.PHYSICS.attempted > 0 ? parseFloat(((subjectStats.PHYSICS.correct / subjectStats.PHYSICS.attempted) * 100).toFixed(2)) : 0
    },
    chemistry: {
      avg_score: total_tests_taken > 0 ? parseFloat((subjectStats.CHEMISTRY.scoreSum / total_tests_taken).toFixed(2)) : 0,
      avg_accuracy: subjectStats.CHEMISTRY.attempted > 0 ? parseFloat(((subjectStats.CHEMISTRY.correct / subjectStats.CHEMISTRY.attempted) * 100).toFixed(2)) : 0
    },
    maths: {
      avg_score: total_tests_taken > 0 ? parseFloat((subjectStats.MATHS.scoreSum / total_tests_taken).toFixed(2)) : 0,
      avg_accuracy: subjectStats.MATHS.attempted > 0 ? parseFloat(((subjectStats.MATHS.correct / subjectStats.MATHS.attempted) * 100).toFixed(2)) : 0
    }
  };

  const total_time_spent_hours = parseFloat((totalTimeSeconds / 3600).toFixed(2));

  // Strongest/weakest subject based on avg_accuracy per subject
  const accuracies = [
    { subject: "PHYSICS", accuracy: subject_averages.physics.avg_accuracy },
    { subject: "CHEMISTRY", accuracy: subject_averages.chemistry.avg_accuracy },
    { subject: "MATHS", accuracy: subject_averages.maths.avg_accuracy }
  ];

  accuracies.sort((a, b) => b.accuracy - a.accuracy);
  const strongest_subject = accuracies[0].subject;
  const weakest_subject = accuracies[2].subject;

  return {
    total_tests_taken,
    average_score,
    average_percentile,
    best_rank,
    best_score,
    best_test,
    recent_trend,
    subject_averages,
    total_time_spent_hours,
    strongest_subject,
    weakest_subject
  };
};

/**
 * GET /api/v1/analytics/me/subject/:subject
 */
export const getSubjectBreakdown = async (userId, subject) => {
  await checkSubmittedAttemptsExist(userId);
  const normalizedSubject = subject.toUpperCase();
  if (!['PHYSICS', 'CHEMISTRY', 'MATHS'].includes(normalizedSubject)) {
    throw new Error('Invalid subject. Must be PHYSICS, CHEMISTRY or MATHS');
  }

  const attempts = await db.attempt.findMany({
    where: {
      userId,
      submittedAt: { not: null }
    },
    include: {
      responses: {
        where: {
          question: {
            subject: normalizedSubject
          }
        },
        include: {
          question: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  let total_questions_attempted = 0;
  let total_correct = 0;
  let total_score_sum = 0;

  attempts.forEach(att => {
    if (normalizedSubject === 'PHYSICS') total_score_sum += att.physicsScore || 0;
    if (normalizedSubject === 'CHEMISTRY') total_score_sum += att.chemistryScore || 0;
    if (normalizedSubject === 'MATHS') total_score_sum += att.mathsScore || 0;

    att.responses.forEach(resp => {
      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      if (isAttempted) {
        total_questions_attempted++;
        if (resp.isCorrect === true) {
          total_correct++;
        }
      }
    });
  });

  const overall_accuracy = total_questions_attempted > 0 ? parseFloat(((total_correct / total_questions_attempted) * 100).toFixed(2)) : 0;
  const avg_score_per_test = attempts.length > 0 ? parseFloat((total_score_sum / attempts.length).toFixed(2)) : 0;

  const chapterDataMap = new Map();
  const topicDataMap = new Map();

  attempts.forEach(att => {
    const attemptId = att.id;
    att.responses.forEach(resp => {
      const question = resp.question;
      const ch = question.chapter;
      const tp = question.topic;
      const diff = question.difficulty.toLowerCase();

      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      const isCorrect = resp.isCorrect === true;
      const isUnanswered = resp.status === 'UNANSWERED' || resp.selectedAnswer === null;
      const timeSpent = resp.timeSpentSeconds || 0;

      if (!chapterDataMap.has(ch)) {
        chapterDataMap.set(ch, {
          chapter: ch,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          timeSum: 0,
          timeCount: 0,
          difficulty: {
            easy: { attempted: 0, correct: 0 },
            medium: { attempted: 0, correct: 0 },
            hard: { attempted: 0, correct: 0 }
          },
          attemptsMap: new Map()
        });
      }
      const chObj = chapterDataMap.get(ch);
      if (!chObj.attemptsMap.has(attemptId)) {
        chObj.attemptsMap.set(attemptId, { correct: 0, attempted: 0 });
      }
      const chAttemptObj = chObj.attemptsMap.get(attemptId);

      if (isAttempted) {
        chObj.attempted++;
        chAttemptObj.attempted++;
        if (isCorrect) {
          chObj.correct++;
          chAttemptObj.correct++;
        } else {
          chObj.incorrect++;
        }

        if (chObj.difficulty[diff]) {
          chObj.difficulty[diff].attempted++;
          if (isCorrect) {
            chObj.difficulty[diff].correct++;
          }
        }
      } else if (isUnanswered) {
        chObj.unanswered++;
      }

      if (timeSpent > 0) {
        chObj.timeSum += timeSpent;
        chObj.timeCount++;
      }

      if (!topicDataMap.has(tp)) {
        topicDataMap.set(tp, {
          topic: tp,
          chapter: ch,
          attempted: 0,
          correct: 0,
          timeSum: 0,
          timeCount: 0
        });
      }
      const tpObj = topicDataMap.get(tp);
      if (isAttempted) {
        tpObj.attempted++;
        if (isCorrect) {
          tpObj.correct++;
        }
      }
      if (timeSpent > 0) {
        tpObj.timeSum += timeSpent;
        tpObj.timeCount++;
      }
    });
  });

  const chapter_breakdown = Array.from(chapterDataMap.values()).map(ch => {
    const attempted = ch.attempted;
    const correct = ch.correct;
    const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(2)) : 0;
    const avg_time_seconds = ch.timeCount > 0 ? Math.round(ch.timeSum / ch.timeCount) : 0;

    const difficulty_breakdown = {};
    for (const d of ['easy', 'medium', 'hard']) {
      const dAtt = ch.difficulty[d].attempted;
      const dCorr = ch.difficulty[d].correct;
      difficulty_breakdown[d] = {
        attempted: dAtt,
        correct: dCorr,
        accuracy: dAtt > 0 ? parseFloat(((dCorr / dAtt) * 100).toFixed(2)) : 0
      };
    }

    const attemptIdsInChapter = Array.from(ch.attemptsMap.keys());
    const sortedAttemptsForTrend = attempts
      .filter(att => attemptIdsInChapter.includes(att.id))
      .map(att => ({
        id: att.id,
        ...ch.attemptsMap.get(att.id)
      }));

    let trend = "stable";
    if (sortedAttemptsForTrend.length >= 4) {
      const last2 = sortedAttemptsForTrend.slice(0, 2);
      const prev2 = sortedAttemptsForTrend.slice(2, 4);

      const last2Corr = last2.reduce((acc, curr) => acc + curr.correct, 0);
      const last2Att = last2.reduce((acc, curr) => acc + curr.attempted, 0);
      const prev2Corr = prev2.reduce((acc, curr) => acc + curr.correct, 0);
      const prev2Att = prev2.reduce((acc, curr) => acc + curr.attempted, 0);

      const accLast2 = last2Att > 0 ? (last2Corr / last2Att) * 100 : 0;
      const accPrev2 = prev2Att > 0 ? (prev2Corr / prev2Att) * 100 : 0;
      const diff = accLast2 - accPrev2;
      if (diff > 5) {
        trend = "improving";
      } else if (diff < -5) {
        trend = "declining";
      } else {
        trend = "stable";
      }
    }

    return {
      chapter: ch.chapter,
      attempted,
      correct,
      incorrect: ch.incorrect,
      unanswered: ch.unanswered,
      accuracy,
      avg_time_seconds,
      trend,
      difficulty_breakdown
    };
  });

  const topic_breakdown = Array.from(topicDataMap.values()).map(tp => {
    const accuracy = tp.attempted > 0 ? parseFloat(((tp.correct / tp.attempted) * 100).toFixed(2)) : 0;
    const avg_time_seconds = tp.timeCount > 0 ? Math.round(tp.timeSum / tp.timeCount) : 0;
    return {
      topic: tp.topic,
      chapter: tp.chapter,
      attempted: tp.attempted,
      correct: tp.correct,
      accuracy,
      avg_time_seconds
    };
  });

  const weak_chapters = chapter_breakdown
    .filter(ch => ch.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy);

  const strong_chapters = chapter_breakdown
    .filter(ch => ch.accuracy > 75)
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    subject: normalizedSubject,
    total_questions_attempted,
    overall_accuracy,
    avg_score_per_test,
    chapter_breakdown,
    topic_breakdown,
    weak_chapters,
    strong_chapters
  };
};

/**
 * GET /api/v1/analytics/me/chapter-heatmap
 */
export const getChapterHeatmap = async (userId) => {
  await checkSubmittedAttemptsExist(userId);

  const responses = await db.response.findMany({
    where: {
      attempt: {
        userId,
        submittedAt: { not: null }
      }
    },
    include: {
      question: true
    }
  });

  const chaptersMap = new Map();
  responses.forEach(resp => {
    const question = resp.question;
    const sub = question.subject;
    const ch = question.chapter;
    const key = `${sub}::${ch}`;

    if (!chaptersMap.has(key)) {
      chaptersMap.set(key, {
        subject: sub,
        chapter: ch,
        correct: 0,
        attempted: 0
      });
    }
    const chObj = chaptersMap.get(key);

    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    if (isAttempted) {
      chObj.attempted++;
      if (resp.isCorrect === true) {
        chObj.correct++;
      }
    }
  });

  const heatmap = Array.from(chaptersMap.values()).map(ch => {
    const attempted = ch.attempted;
    const accuracy = attempted > 0 ? (ch.correct / attempted) * 100 : 0.0;

    let heat_level = 1;
    if (accuracy <= 20) heat_level = 1;
    else if (accuracy <= 40) heat_level = 2;
    else if (accuracy <= 60) heat_level = 3;
    else if (accuracy <= 80) heat_level = 4;
    else heat_level = 5;

    const entry = {
      subject: ch.subject,
      chapter: ch.chapter,
      accuracy: parseFloat(accuracy.toFixed(1)),
      attempted,
      heat_level
    };

    if (attempted < 5) {
      entry.insufficient_data = true;
    }

    return entry;
  });

  heatmap.sort((a, b) => {
    if (a.subject !== b.subject) {
      return a.subject.localeCompare(b.subject);
    }
    return a.chapter.localeCompare(b.chapter);
  });

  return { heatmap };
};

/**
 * GET /api/v1/analytics/me/time-analysis
 */
export const getTimeAnalysis = async (userId) => {
  await checkSubmittedAttemptsExist(userId);

  const responses = await db.response.findMany({
    where: {
      attempt: {
        userId,
        submittedAt: { not: null }
      },
      timeSpentSeconds: { gt: 0 }
    },
    include: {
      question: true
    }
  });

  if (responses.length === 0) {
    return {
      avg_time_per_question_seconds: 0,
      by_subject: {
        physics:   { avg_time: 0,  fastest_chapter: null, slowest_chapter: null },
        chemistry: { avg_time: 0,  fastest_chapter: null, slowest_chapter: null },
        maths:     { avg_time: 0,  fastest_chapter: null, slowest_chapter: null }
      },
      by_difficulty: {
        easy:   { avg_time: 0 },
        medium: { avg_time: 0 },
        hard:   { avg_time: 0 }
      },
      time_distribution: [
        { bucket: "0-30s",   count: 0 },
        { bucket: "31-60s",  count: 0 },
        { bucket: "61-120s", count: 0 },
        { bucket: "121-180s",count: 0 },
        { bucket: "180s+",   count: 0 }
      ],
      slow_chapters: [],
      fast_chapters: []
    };
  }

  let total_time_sum = 0;
  const subStats = {
    PHYSICS: { timeSum: 0, timeCount: 0, chapters: {} },
    CHEMISTRY: { timeSum: 0, timeCount: 0, chapters: {} },
    MATHS: { timeSum: 0, timeCount: 0, chapters: {} }
  };
  const diffStats = {
    EASY: { timeSum: 0, timeCount: 0 },
    MEDIUM: { timeSum: 0, timeCount: 0 },
    HARD: { timeSum: 0, timeCount: 0 }
  };
  const chapterOverall = {};

  const time_distribution_counts = {
    "0-30s": 0,
    "31-60s": 0,
    "61-120s": 0,
    "121-180s": 0,
    "180s+": 0
  };

  responses.forEach(resp => {
    const t = resp.timeSpentSeconds;
    const question = resp.question;
    const sub = question.subject;
    const ch = question.chapter;
    const diff = question.difficulty;

    total_time_sum += t;

    subStats[sub].timeSum += t;
    subStats[sub].timeCount++;
    if (!subStats[sub].chapters[ch]) {
      subStats[sub].chapters[ch] = { timeSum: 0, count: 0 };
    }
    subStats[sub].chapters[ch].timeSum += t;
    subStats[sub].chapters[ch].count++;

    if (diffStats[diff]) {
      diffStats[diff].timeSum += t;
      diffStats[diff].timeCount++;
    }

    if (!chapterOverall[ch]) {
      chapterOverall[ch] = { chapter: ch, subject: sub, timeSum: 0, count: 0, attempted: 0 };
    }
    chapterOverall[ch].timeSum += t;
    chapterOverall[ch].count++;

    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    if (isAttempted) {
      chapterOverall[ch].attempted++;
    }

    if (t <= 30) time_distribution_counts["0-30s"]++;
    else if (t <= 60) time_distribution_counts["31-60s"]++;
    else if (t <= 120) time_distribution_counts["61-120s"]++;
    else if (t <= 180) time_distribution_counts["121-180s"]++;
    else time_distribution_counts["180s+"]++;
  });

  const avg_time_per_question_seconds = Math.round(total_time_sum / responses.length);

  const getFastestSlowest = (chMap) => {
    let fastCh = null, slowCh = null;
    let minAvg = Infinity, maxAvg = -Infinity;
    for (const chName in chMap) {
      const avg = chMap[chName].timeSum / chMap[chName].count;
      if (avg < minAvg) {
        minAvg = avg;
        fastCh = chName;
      }
      if (avg > maxAvg) {
        maxAvg = avg;
        slowCh = chName;
      }
    }
    return { fastest: fastCh, slowest: slowCh };
  };

  const phyFS = getFastestSlowest(subStats.PHYSICS.chapters);
  const chemFS = getFastestSlowest(subStats.CHEMISTRY.chapters);
  const mathFS = getFastestSlowest(subStats.MATHS.chapters);

  const by_subject = {
    physics: {
      avg_time: subStats.PHYSICS.timeCount > 0 ? Math.round(subStats.PHYSICS.timeSum / subStats.PHYSICS.timeCount) : 0,
      fastest_chapter: phyFS.fastest,
      slowest_chapter: phyFS.slowest
    },
    chemistry: {
      avg_time: subStats.CHEMISTRY.timeCount > 0 ? Math.round(subStats.CHEMISTRY.timeSum / subStats.CHEMISTRY.timeCount) : 0,
      fastest_chapter: chemFS.fastest,
      slowest_chapter: chemFS.slowest
    },
    maths: {
      avg_time: subStats.MATHS.timeCount > 0 ? Math.round(subStats.MATHS.timeSum / subStats.MATHS.timeCount) : 0,
      fastest_chapter: mathFS.fastest,
      slowest_chapter: mathFS.slowest
    }
  };

  const by_difficulty = {
    easy: { avg_time: diffStats.EASY.timeCount > 0 ? Math.round(diffStats.EASY.timeSum / diffStats.EASY.timeCount) : 0 },
    medium: { avg_time: diffStats.MEDIUM.timeCount > 0 ? Math.round(diffStats.MEDIUM.timeSum / diffStats.MEDIUM.timeCount) : 0 },
    hard: { avg_time: diffStats.HARD.timeCount > 0 ? Math.round(diffStats.HARD.timeSum / diffStats.HARD.timeCount) : 0 }
  };

  const time_distribution = Object.entries(time_distribution_counts).map(([bucket, count]) => ({ bucket, count }));

  const allChapters = Object.values(chapterOverall).map(ch => ({
    chapter: ch.chapter,
    avg_time: Math.round(ch.timeSum / ch.count),
    attempted: ch.attempted
  }));

  const slow_chapters = [...allChapters]
    .sort((a, b) => b.avg_time - a.avg_time)
    .slice(0, 5)
    .map(c => c.chapter);

  const fast_chapters = allChapters
    .filter(c => c.attempted >= 10)
    .sort((a, b) => a.avg_time - b.avg_time)
    .slice(0, 5)
    .map(c => c.chapter);

  return {
    avg_time_per_question_seconds,
    by_subject,
    by_difficulty,
    time_distribution,
    slow_chapters,
    fast_chapters
  };
};

/**
 * GET /api/v1/analytics/me/progress
 */
export const getProgress = async (userId) => {
  await checkSubmittedAttemptsExist(userId);

  const attempts = await db.attempt.findMany({
    where: {
      userId,
      submittedAt: { not: null }
    },
    include: {
      test: true,
      responses: true
    },
    orderBy: {
      submittedAt: 'asc'
    }
  });

  const tests = attempts.map(att => {
    let correct = 0;
    let attempted = 0;

    att.responses.forEach(resp => {
      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      if (isAttempted) {
        attempted++;
        if (resp.isCorrect === true) {
          correct++;
        }
      }
    });

    const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(2)) : 0.0;

    return {
      attempt_id: att.id,
      test_id: att.testId,
      test_title: att.test.title,
      test_type: att.test.type,
      submitted_at: att.submittedAt,
      total_score: att.totalScore || 0,
      max_possible: att.test.totalMarks,
      percentile: att.percentile || 0,
      rank: att.rank || 1,
      physics_score: att.physicsScore || 0,
      chemistry_score: att.chemistryScore || 0,
      maths_score: att.mathsScore || 0,
      accuracy
    };
  });

  const score_trend = tests.map(t => ({
    date: new Date(t.submitted_at).toISOString().split('T')[0],
    score: t.total_score
  }));

  const percentile_trend = tests.map(t => ({
    date: new Date(t.submitted_at).toISOString().split('T')[0],
    percentile: t.percentile
  }));

  return {
    tests,
    score_trend,
    percentile_trend
  };
};

/**
 * GET /api/v1/analytics/test/:testId/compare/:attemptId
 */
export const getTestComparison = async (userId, testId, attemptId) => {
  await checkSubmittedAttemptsExist(userId);

  const studentAttempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      user: true,
      test: true,
      responses: {
        include: {
          question: true
        }
      }
    }
  });

  if (!studentAttempt || studentAttempt.submittedAt === null) {
    throw new Error('No submitted attempts found for this user');
  }

  const allAttempts = await db.attempt.findMany({
    where: {
      testId,
      submittedAt: { not: null }
    },
    include: {
      responses: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      totalScore: 'desc'
    }
  });

  if (allAttempts.length === 0) {
    throw new Error('No submitted attempts found for this user');
  }

  let topperAttempt = allAttempts[0];
  if (topperAttempt.id === studentAttempt.id && allAttempts.length > 1) {
    topperAttempt = allAttempts[1];
  }

  const buildStats = (attempt) => {
    let totalCorrect = 0;
    let totalAttempted = 0;
    let totalTime = 0;

    const section_stats = {
      physics: { score: attempt.physicsScore || 0, correct: 0, attempted: 0, time_spent_seconds: 0 },
      chemistry: { score: attempt.chemistryScore || 0, correct: 0, attempted: 0, time_spent_seconds: 0 },
      maths: { score: attempt.mathsScore || 0, correct: 0, attempted: 0, time_spent_seconds: 0 }
    };

    attempt.responses.forEach(resp => {
      const sub = resp.question.subject.toLowerCase();
      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      const isCorrect = resp.isCorrect === true;
      const timeSpent = resp.timeSpentSeconds || 0;

      totalTime += timeSpent;
      section_stats[sub].time_spent_seconds += timeSpent;

      if (isAttempted) {
        totalAttempted++;
        section_stats[sub].attempted++;
        if (isCorrect) {
          totalCorrect++;
          section_stats[sub].correct++;
        }
      }
    });

    const accuracy = totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(2)) : 0.0;

    const clean_section_stats = {};
    for (const key in section_stats) {
      const s = section_stats[key];
      clean_section_stats[key] = {
        score: s.score,
        accuracy: s.attempted > 0 ? parseFloat(((s.correct / s.attempted) * 100).toFixed(2)) : 0.0,
        time_spent_seconds: s.time_spent_seconds
      };
    }

    return {
      total_score: attempt.totalScore || 0,
      percentile: attempt.percentile || 0,
      physics_score: attempt.physicsScore || 0,
      chemistry_score: attempt.chemistryScore || 0,
      maths_score: attempt.mathsScore || 0,
      accuracy,
      time_taken_seconds: totalTime,
      section_stats: clean_section_stats
    };
  };

  const studentStats = buildStats(studentAttempt);
  studentStats.name = studentAttempt.user.name;
  studentStats.rank = studentAttempt.rank || 1;

  const topperStats = buildStats(topperAttempt);

  const score_gap = parseFloat((topperStats.total_score - studentStats.total_score).toFixed(2));
  const physics_gap = parseFloat((topperStats.physics_score - studentStats.physics_score).toFixed(2));
  const chemistry_gap = parseFloat((topperStats.chemistry_score - studentStats.chemistry_score).toFixed(2));
  const maths_gap = parseFloat((topperStats.maths_score - studentStats.maths_score).toFixed(2));
  const time_gap_seconds = studentStats.time_taken_seconds - topperStats.time_taken_seconds;

  const studentChapterStats = {};
  const topperChapterStats = {};

  studentAttempt.responses.forEach(resp => {
    const ch = resp.question.chapter;
    if (!studentChapterStats[ch]) {
      studentChapterStats[ch] = { correct: 0, attempted: 0 };
    }
    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    if (isAttempted) {
      studentChapterStats[ch].attempted++;
      if (resp.isCorrect === true) {
        studentChapterStats[ch].correct++;
      }
    }
  });

  topperAttempt.responses.forEach(resp => {
    const ch = resp.question.chapter;
    if (!topperChapterStats[ch]) {
      topperChapterStats[ch] = { correct: 0, attempted: 0 };
    }
    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    if (isAttempted) {
      topperChapterStats[ch].attempted++;
      if (resp.isCorrect === true) {
        topperChapterStats[ch].correct++;
      }
    }
  });

  const weak_vs_topper = [];
  const allChapters = new Set([...Object.keys(studentChapterStats), ...Object.keys(topperChapterStats)]);

  allChapters.forEach(ch => {
    const sCh = studentChapterStats[ch] || { correct: 0, attempted: 0 };
    const tCh = topperChapterStats[ch] || { correct: 0, attempted: 0 };

    const sAcc = sCh.attempted > 0 ? (sCh.correct / sCh.attempted) * 100 : 0.0;
    const tAcc = tCh.attempted > 0 ? (tCh.correct / tCh.attempted) * 100 : 0.0;

    if (sAcc < tAcc) {
      weak_vs_topper.push({
        chapter: ch,
        student_accuracy: parseFloat(sAcc.toFixed(2)),
        topper_accuracy: parseFloat(tAcc.toFixed(2)),
        gap: parseFloat((tAcc - sAcc).toFixed(2))
      });
    }
  });

  weak_vs_topper.sort((a, b) => b.gap - a.gap);

  const gap_analysis = {
    score_gap,
    physics_gap,
    chemistry_gap,
    maths_gap,
    time_gap_seconds,
    weak_vs_topper: weak_vs_topper.slice(0, 5)
  };

  return {
    student: studentStats,
    topper: topperStats,
    gap_analysis
  };
};

/**
 * Helper to fetch topper attempt details without exposing name or user ID
 */
export const getTopperForTest = async (testId) => {
  const allAttempts = await db.attempt.findMany({
    where: {
      testId,
      submittedAt: { not: null }
    },
    include: {
      responses: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      totalScore: 'desc'
    }
  });

  if (allAttempts.length === 0) {
    return null;
  }

  const topper = allAttempts[0];
  let totalCorrect = 0;
  let totalAttempted = 0;
  let totalTime = 0;

  topper.responses.forEach(resp => {
    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    const timeSpent = resp.timeSpentSeconds || 0;
    totalTime += timeSpent;
    if (isAttempted) {
      totalAttempted++;
      if (resp.isCorrect === true) {
        totalCorrect++;
      }
    }
  });

  return {
    total_score: topper.totalScore || 0,
    percentile: topper.percentile || 0,
    physics_score: topper.physicsScore || 0,
    chemistry_score: topper.chemistryScore || 0,
    maths_score: topper.mathsScore || 0,
    accuracy: totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(2)) : 0.0,
    time_taken_seconds: totalTime
  };
};

/**
 * GET /api/v1/analytics/me/swot
 */
export const getSwotReport = async (userId) => {
  await checkSubmittedAttemptsExist(userId);

  const responses = await db.response.findMany({
    where: {
      attempt: {
        userId,
        submittedAt: { not: null }
      }
    },
    include: {
      question: true
    }
  });

  const chaptersMap = new Map();
  responses.forEach(resp => {
    const question = resp.question;
    const ch = question.chapter;
    const sub = question.subject;
    const ntaWeightage = question.ntaWeightage;

    if (!chaptersMap.has(ch)) {
      chaptersMap.set(ch, {
        chapter: ch,
        subject: sub,
        correct: 0,
        attempted: 0,
        unanswered: 0,
        ntaWeightage: 0,
        weightCount: 0
      });
    }
    const cObj = chaptersMap.get(ch);

    const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
    if (isAttempted) {
      cObj.attempted++;
      if (resp.isCorrect === true) {
        cObj.correct++;
      }
    } else {
      cObj.unanswered++;
    }

    cObj.ntaWeightage += ntaWeightage;
    cObj.weightCount++;
  });

  const chapters = Array.from(chaptersMap.values()).map(c => {
    const accuracy = c.attempted > 0 ? (c.correct / c.attempted) * 100 : 0.0;
    const avgNtaWeightage = c.weightCount > 0 ? c.ntaWeightage / c.weightCount : 0;
    return {
      chapter: c.chapter,
      subject: c.subject,
      attempted: c.attempted,
      accuracy,
      nta_weightage: avgNtaWeightage
    };
  });

  const strengths = chapters
    .filter(c => c.accuracy >= 75 && c.attempted >= 10)
    .sort((a, b) => b.accuracy - a.accuracy)
    .map(c => ({
      type: 'chapter',
      label: c.chapter,
      subject: c.subject,
      accuracy: parseFloat(c.accuracy.toFixed(1)),
      insight: 'Consistently strong — attempt all questions here first'
    }));

  const weaknesses = chapters
    .filter(c => c.accuracy < 50 && c.attempted >= 10)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map(c => ({
      type: 'chapter',
      label: c.chapter,
      subject: c.subject,
      accuracy: parseFloat(c.accuracy.toFixed(1)),
      insight: `Below 50% accuracy — revise before next test`
    }));

  const opportunities = chapters
    .filter(c => c.accuracy >= 50 && c.accuracy <= 74 && c.nta_weightage >= 7)
    .sort((a, b) => b.nta_weightage - a.nta_weightage || b.accuracy - a.accuracy)
    .map(c => ({
      type: 'chapter',
      label: c.chapter,
      subject: c.subject,
      accuracy: parseFloat(c.accuracy.toFixed(1)),
      attempted: c.attempted,
      insight: 'Mid-range accuracy with high NTA weightage — high ROI to improve'
    }));

  const threats = [];

  const attempts = await db.attempt.findMany({
    where: {
      userId,
      submittedAt: { not: null }
    },
    orderBy: {
      submittedAt: 'desc'
    },
    take: 3
  });

  if (attempts.length === 3) {
    const physicsTrend = attempts[0].physicsScore < attempts[1].physicsScore && attempts[1].physicsScore < attempts[2].physicsScore;
    const chemistryTrend = attempts[0].chemistryScore < attempts[1].chemistryScore && attempts[1].chemistryScore < attempts[2].chemistryScore;
    const mathsTrend = attempts[0].mathsScore < attempts[1].mathsScore && attempts[1].mathsScore < attempts[2].mathsScore;

    if (physicsTrend) {
      threats.push({
        type: 'pattern',
        label: 'Declining Physics',
        insight: 'Physics score dropped in 3 consecutive tests'
      });
    }
    if (chemistryTrend) {
      threats.push({
        type: 'pattern',
        label: 'Declining Chemistry',
        insight: 'Chemistry score dropped in 3 consecutive tests'
      });
    }
    if (mathsTrend) {
      threats.push({
        type: 'pattern',
        label: 'Declining Maths',
        insight: 'Maths score dropped in 3 consecutive tests'
      });
    }
  }

  if (attempts.length > 0) {
    const latestAttempt = attempts[0];
    const latestResponses = await db.response.findMany({
      where: {
        attemptId: latestAttempt.id,
        timeSpentSeconds: { gt: 0 }
      },
      include: {
        question: true
      }
    });

    const mathResponses = latestResponses.filter(r => r.question.subject === 'MATHS');
    if (mathResponses.length > 0) {
      const avgMathTime = mathResponses.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / mathResponses.length;
      if (avgMathTime < 35) {
        threats.push({
          type: 'pattern',
          label: 'Time pressure',
          insight: 'Last 10 questions in Maths section answered in under 30s avg — likely rushed'
        });
      }
    }
  }

  const chapterAttemptAccuracies = {};
  const allSubmittedAttempts = await db.attempt.findMany({
    where: {
      userId,
      submittedAt: { not: null }
    },
    include: {
      responses: {
        include: {
          question: true
        }
      }
    }
  });

  allSubmittedAttempts.forEach(att => {
    const cStats = {};
    att.responses.forEach(resp => {
      const ch = resp.question.chapter;
      if (!cStats[ch]) {
        cStats[ch] = { correct: 0, attempted: 0 };
      }
      const isAttempted = (resp.status === 'ANSWERED' || resp.status === 'MARKED_REVIEW') && resp.selectedAnswer !== null;
      if (isAttempted) {
        cStats[ch].attempted++;
        if (resp.isCorrect === true) {
          cStats[ch].correct++;
        }
      }
    });

    for (const ch in cStats) {
      if (cStats[ch].attempted > 0) {
        if (!chapterAttemptAccuracies[ch]) {
          chapterAttemptAccuracies[ch] = [];
        }
        chapterAttemptAccuracies[ch].push((cStats[ch].correct / cStats[ch].attempted) * 100);
      }
    }
  });

  for (const ch in chapterAttemptAccuracies) {
    const list = chapterAttemptAccuracies[ch];
    if (list.length >= 5) {
      const avg = list.reduce((acc, curr) => acc + curr, 0) / list.length;
      const variance = list.reduce((acc, curr) => acc + Math.pow(curr - avg, 2), 0) / list.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 30) {
        threats.push({
          type: 'pattern',
          label: 'Inconsistent',
          insight: `Inconsistent performance in ${ch} — accuracy variance is high across tests`
        });
      }
    }
  }

  let priority_action = "No action required.";
  if (chapters.length > 0) {
    const weakChaptersForPriority = chapters.filter(c => c.accuracy < 100);
    if (weakChaptersForPriority.length > 0) {
      weakChaptersForPriority.sort((a, b) => {
        if (b.nta_weightage !== a.nta_weightage) {
          return b.nta_weightage - a.nta_weightage;
        }
        return a.accuracy - b.accuracy;
      });

      const priorityCh = weakChaptersForPriority[0];
      const totalTests = allSubmittedAttempts.length || 1;
      const avgQPerTest = priorityCh.attempted / totalTests;

      const current_accuracy = priorityCh.accuracy;
      const N = (10 - current_accuracy / 10) * (avgQPerTest || 1) * 4;
      const roundedN = Math.round(N);

      priority_action = `Focus on ${priorityCh.chapter} — fixing this alone could add ~${roundedN} marks`;
    }
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    priority_action
  };
};
