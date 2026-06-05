import express from 'express';
import { 
  getMyOverview,
  getMySubjectBreakdown,
  getMyChapterHeatmap,
  getMyTimeAnalysis,
  getMyProgress,
  getTestComparisonData,
  getTestTopperData,
  getMySwotReport
} from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';
import { requirePlan } from '../middleware/requirePlan.js';

const router = express.Router();

// Apply authentication middleware to all analytics routes
router.use(auth);

router.get('/me/overview', getMyOverview);
router.get('/me/subject/:subject', getMySubjectBreakdown);
router.get('/me/chapter-heatmap', getMyChapterHeatmap);
router.get('/me/time-analysis', getMyTimeAnalysis);
router.get('/me/progress', getMyProgress);
router.get('/me/swot', requirePlan('PRO'), getMySwotReport);
router.get('/test/:testId/compare/:attemptId', getTestComparisonData);
router.get('/test/:testId/topper', getTestTopperData);

export default router;
