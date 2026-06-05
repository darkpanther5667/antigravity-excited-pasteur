import { sendSuccess, sendError } from '../utils/response.js';
import * as analyticsService from '../services/analyticsService.js';

const getTargetUserId = (req) => {
  if (req.query.userId && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
    return req.query.userId;
  }
  return req.user.id;
};

const handleServiceCall = async (serviceFn, req, res, next, ...extraArgs) => {
  try {
    const userId = getTargetUserId(req);
    const result = await serviceFn(userId, ...extraArgs);
    return sendSuccess(res, result);
  } catch (error) {
    if (error.message === 'No submitted attempts found for this user') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

export const getMyOverview = async (req, res, next) => {
  return handleServiceCall(analyticsService.getOverview, req, res, next);
};

export const getMySubjectBreakdown = async (req, res, next) => {
  try {
    const subject = req.params.subject;
    if (!subject || !['PHYSICS', 'CHEMISTRY', 'MATHS'].includes(subject.toUpperCase())) {
      return sendError(res, 'Invalid subject. Must be PHYSICS, CHEMISTRY or MATHS', 400);
    }
    return handleServiceCall(analyticsService.getSubjectBreakdown, req, res, next, subject);
  } catch (error) {
    next(error);
  }
};

export const getMyChapterHeatmap = async (req, res, next) => {
  return handleServiceCall(analyticsService.getChapterHeatmap, req, res, next);
};

export const getMyTimeAnalysis = async (req, res, next) => {
  return handleServiceCall(analyticsService.getTimeAnalysis, req, res, next);
};

export const getMyProgress = async (req, res, next) => {
  return handleServiceCall(analyticsService.getProgress, req, res, next);
};

export const getTestComparisonData = async (req, res, next) => {
  try {
    const { testId, attemptId } = req.params;
    const userId = getTargetUserId(req);
    const result = await analyticsService.getTestComparison(userId, testId, attemptId);
    return sendSuccess(res, result);
  } catch (error) {
    if (error.message === 'No submitted attempts found for this user') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

export const getTestTopperData = async (req, res, next) => {
  try {
    const { testId } = req.params;
    // To satisfy requirement of throwing error on no attempts
    const userId = getTargetUserId(req);
    // This call verifies the user has attempts, throwing 404 if not.
    await analyticsService.getOverview(userId);
    
    const result = await analyticsService.getTopperForTest(testId);
    if (!result) {
      return sendError(res, 'No topper found for this test', 404);
    }
    return sendSuccess(res, result);
  } catch (error) {
    if (error.message === 'No submitted attempts found for this user') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

export const getMySwotReport = async (req, res, next) => {
  return handleServiceCall(analyticsService.getSwotReport, req, res, next);
};

export const getLeaderboard = async (req, res, next) => {
  try {
    return sendSuccess(res, { message: "Get leaderboard stub" });
  } catch (error) {
    next(error);
  }
};
