/**
 * Sanitizes question objects to prevent answers/solutions leaking before submission.
 */

export const sanitizeForAttempt = (question) => {
  if (!question) return null;
  // Clone object to avoid mutating original
  const clean = { ...question };
  delete clean.correctAnswer;
  delete clean.correct_answer;
  delete clean.solution;
  return clean;
};

export const sanitizeForResult = (question) => {
  if (!question) return null;
  return { ...question };
};
