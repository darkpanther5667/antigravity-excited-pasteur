import express from 'express';
import { sendSuccess } from '../utils/response.js';

const router = express.Router();

router.get('/health', (req, res) => {
  return sendSuccess(res, { status: "ok" });
});

// Also support base endpoint under this route
router.get('/', (req, res) => {
  return sendSuccess(res, { status: "ok" });
});

export default router;
