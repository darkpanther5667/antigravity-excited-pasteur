import express from 'express';
import { 
  getTestLeaderboardController, 
  getTestRankGapsController, 
  getGlobalLeaderboardController 
} from '../controllers/leaderboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication on all leaderboard routes
router.use(auth);

router.get('/global', getGlobalLeaderboardController);
router.get('/test/:testId', getTestLeaderboardController);
router.get('/test/:testId/my-rank/:attemptId', getTestRankGapsController);

export default router;
