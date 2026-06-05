import express from 'express';
import { 
  getTests, 
  getTestById, 
  createTest, 
  updateTest,
  addQuestions, 
  setQuestions,
  deleteTest, 
  publishTest, 
  startTest, 
  saveResponse, 
  submitTest, 
  getTestResult, 
  createNtaMainsTestController 
} from '../controllers/testController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Public endpoints
router.get('/', getTests);
router.get('/:id', getTestById);

// Protected endpoints for Content Managers / Teachers / Admins
router.post('/', auth, requireRole(['TEACHER', 'ADMIN']), createTest);
router.put('/:id', auth, requireRole(['TEACHER', 'ADMIN']), updateTest);
router.post('/:id/questions', auth, requireRole(['TEACHER', 'ADMIN']), addQuestions);
router.put('/:id/questions', auth, requireRole(['TEACHER', 'ADMIN']), setQuestions);
router.patch('/:id/publish', auth, requireRole(['ADMIN']), publishTest);
router.delete('/:id', auth, requireRole(['ADMIN']), deleteTest);
router.post('/create-nta-mains', auth, requireRole(['ADMIN']), createNtaMainsTestController);

// Protected endpoints for Students
router.post('/:id/start', auth, requireRole(['STUDENT']), startTest);
router.post('/:id/save-response', auth, requireRole(['STUDENT']), saveResponse);
router.post('/:id/submit', auth, requireRole(['STUDENT']), submitTest);
router.get('/:id/result/:attempt_id', auth, getTestResult);

export default router;
