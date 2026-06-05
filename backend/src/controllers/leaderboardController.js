import { sendSuccess, sendError } from '../utils/response.js';
import * as leaderboardService from '../services/leaderboardService.js';

export const getTestLeaderboardController = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await leaderboardService.getTestLeaderboard(testId, page, limit, req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    if (error.message === 'Test not found') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

export const getTestRankGapsController = async (req, res, next) => {
  try {
    const { testId, attemptId } = req.params;
    const result = await leaderboardService.getTestRankGaps(testId, req.user.id, attemptId);
    return sendSuccess(res, result);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    next(error);
  }
};

export const getGlobalLeaderboardController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await leaderboardService.getGlobalLeaderboard(page, limit);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
