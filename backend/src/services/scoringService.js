import db from '../models/db.js';

export const calculateScore = async (attemptId) => {
  try {
    // Step 1: Fetch attempt and test details
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { test: true }
    });

    if (!attempt) {
      throw new Error(`Attempt with id ${attemptId} not found`);
    }

    const testId = attempt.testId;

    // Step 2: Fetch all responses for the attempt
    const responses = await db.response.findMany({
      where: { attemptId }
    });

    // Step 3: Fetch all test_questions for this test
    const testQuestions = await db.testQuestion.findMany({
      where: { testId },
      include: { question: true }
    });

    // Maps for fast lookups
    const tqMap = new Map();
    testQuestions.forEach(tq => {
      tqMap.set(tq.questionId, tq);
    });

    let totalScore = 0;
    let physicsScore = 0;
    let chemistryScore = 0;
    let mathsScore = 0;

    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const scoredResponses = [];

    // Step 4: For each test question, calculate its score based on student response
    for (const tq of testQuestions) {
      const qId = tq.questionId;
      const question = tq.question;
      const resp = responses.find(r => r.questionId === qId);

      const section = tq.section; // PHYSICS, CHEMISTRY, MATHS
      const marksCorrect = tq.marksCorrect;
      const marksIncorrect = parseFloat(tq.marksIncorrect.toString()); // Convert Decimal to float

      let selectedAnswer = null;
      let status = 'UNANSWERED';
      let timeSpentSeconds = 0;
      let marksAwarded = 0;
      let isCorrect = null;

      if (resp) {
        selectedAnswer = resp.selectedAnswer;
        status = resp.status;
        timeSpentSeconds = resp.timeSpentSeconds;
      }

      if (status === 'ANSWERED' && selectedAnswer && selectedAnswer.trim() !== '') {
        attemptedCount++;
        const type = question.type; // SINGLE, MULTI, INTEGER, MATRIX
        const correctAnswer = question.correctAnswer.trim().toLowerCase();
        const selected = selectedAnswer.trim().toLowerCase();

        if (type === 'SINGLE' || type === 'MATRIX') {
          if (selected === correctAnswer) {
            marksAwarded = marksCorrect;
            isCorrect = true;
            correctCount++;
          } else {
            marksAwarded = marksIncorrect; // usually -1
            isCorrect = false;
            incorrectCount++;
          }
        } else if (type === 'MULTI') {
          // Parse keys
          const correctArr = correctAnswer.split(',').map(x => x.trim()).filter(Boolean);
          const selectedArr = selected.split(',').map(x => x.trim()).filter(Boolean);

          const isExactMatch = 
            correctArr.length === selectedArr.length && 
            selectedArr.every(item => correctArr.includes(item));

          if (isExactMatch) {
            marksAwarded = marksCorrect;
            isCorrect = true;
            correctCount++;
          } else {
            // Check if any selected option is NOT in the correct options
            const hasWrongOption = selectedArr.some(item => !correctArr.includes(item));
            if (hasWrongOption) {
              marksAwarded = marksIncorrect; // usually -2
              isCorrect = false;
              incorrectCount++;
            } else {
              // Partial correct: subset of correct, no wrong ones selected.
              // +1 per correct option selected, capped at marks_correct - 1.
              marksAwarded = Math.min(selectedArr.length, marksCorrect - 1);
              isCorrect = true; // partial correct is still considered correct or positive points
              correctCount++;
            }
          }
        } else if (type === 'INTEGER') {
          const selectedNum = parseFloat(selected);
          const correctNum = parseFloat(correctAnswer);
          
          if (!isNaN(selectedNum) && !isNaN(correctNum) && Math.abs(selectedNum - correctNum) <= 0.01) {
            marksAwarded = marksCorrect;
            isCorrect = true;
            correctCount++;
          } else {
            marksAwarded = 0; // No negative marking for integer type
            isCorrect = false;
            incorrectCount++;
          }
        }
      } else {
        unansweredCount++;
        marksAwarded = 0;
        isCorrect = null;
      }

      // Add to running totals per section
      if (section === 'PHYSICS') physicsScore += marksAwarded;
      if (section === 'CHEMISTRY') chemistryScore += marksAwarded;
      if (section === 'MATHS') mathsScore += marksAwarded;
      totalScore += marksAwarded;

      scoredResponses.push({
        responseId: resp ? resp.id : null,
        questionId: qId,
        selectedAnswer,
        isCorrect,
        marksAwarded,
        timeSpentSeconds,
        status
      });
    }

    // Step 5: Calculate Percentile & Rank
    // Find all OTHER submitted attempts for this test
    const otherSubmittedAttempts = await db.attempt.findMany({
      where: {
        testId: testId,
        submittedAt: { not: null },
        id: { not: attemptId }
      },
      select: {
        totalScore: true
      }
    });

    const totalSubmitted = otherSubmittedAttempts.length + 1; // Count of all submitted attempts including current one
    let percentile = 100.00;
    let rank = 1;

    if (totalSubmitted > 1) {
      // percentile = (count of other attempts with score < this score) / (totalSubmitted - 1) * 100
      const strictlyLowerCount = otherSubmittedAttempts.filter(att => {
        const otherScore = parseFloat(att.totalScore.toString());
        return otherScore < totalScore;
      }).length;

      percentile = (strictlyLowerCount / (totalSubmitted - 1)) * 100;
      percentile = Math.round(percentile * 100) / 100; // Round to 2 decimal places

      // rank = count of other attempts with score > this score + 1
      const higherCount = otherSubmittedAttempts.filter(att => {
        const otherScore = parseFloat(att.totalScore.toString());
        return otherScore > totalScore;
      }).length;

      rank = higherCount + 1;
    }

    // Round scores to 2 decimal places
    physicsScore = Math.round(physicsScore * 100) / 100;
    chemistryScore = Math.round(chemistryScore * 100) / 100;
    mathsScore = Math.round(mathsScore * 100) / 100;
    totalScore = Math.round(totalScore * 100) / 100;

    // Compute time taken from sum of all response times
    const timeTakenSeconds = scoredResponses.reduce((sum, r) => sum + (r.timeSpentSeconds || 0), 0);

    // Step 8: Update attempt record and scored responses inside transaction
    await db.$transaction(async (tx) => {
      // 1. Update attempt scores and metrics
      await tx.attempt.update({
        where: { id: attemptId },
        data: {
          totalScore,
          physicsScore,
          chemistryScore,
          mathsScore,
          percentile,
          rank,
          timeTakenSeconds
        }
      });

      // 2. Update each response item with score/correct status
      for (const sr of scoredResponses) {
        if (sr.responseId) {
          await tx.response.update({
            where: { id: sr.responseId },
            data: {
              isCorrect: sr.isCorrect,
              marksAwarded: sr.marksAwarded
            }
          });
        } else {
          // If response record didn't exist (unanswered), create a default unanswered response record
          await tx.response.create({
            data: {
              attemptId,
              questionId: sr.questionId,
              selectedAnswer: null,
              isCorrect: null,
              marksAwarded: 0,
              timeSpentSeconds: 0,
              status: 'UNANSWERED'
            }
          });
        }
      }
    });

    // Bust cache for this test leaderboard
    try {
      import('../utils/redis.js').then(({ delCachePattern }) => {
        delCachePattern(`leaderboard:test:${testId}:*`);
      }).catch(err => console.warn('Cache bust import failed:', err.message));
    } catch (cacheErr) {
      console.warn('Cache bust failed:', cacheErr.message);
    }

    // Fetch the updated attempt
    const updatedAttempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        responses: {
          include: {
            question: true
          }
        }
      }
    });

    return updatedAttempt;

  } catch (error) {
    throw new Error(`Scoring failed: ${error.message}`);
  }
};
