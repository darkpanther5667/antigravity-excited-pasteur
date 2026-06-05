import express from 'express';
import multer from 'multer';
import { 
  getQuestions, 
  getQuestionById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  bulkUpload, 
  getChapters, 
  getTopics 
} from '../controllers/questionController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public endpoints
router.get('/', getQuestions);
router.get('/meta/chapters', getChapters);
router.get('/meta/topics', getTopics);
router.get('/:id', getQuestionById);

// Protected endpoints
router.post('/', auth, requireRole(['TEACHER', 'ADMIN']), createQuestion);
router.put('/:id', auth, requireRole(['TEACHER', 'ADMIN']), updateQuestion);
router.delete('/:id', auth, requireRole(['ADMIN']), deleteQuestion);
router.post('/bulk-upload', auth, requireRole(['TEACHER', 'ADMIN']), upload.single('file'), bulkUpload);

export default router;
