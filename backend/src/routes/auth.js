import express from 'express';
import { 
  register, 
  sendOtp, 
  verifyOtp, 
  login, 
  refresh, 
  logout, 
  forgotPassword, 
  resetPassword, 
  getMe, 
  devToken 
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/dev-token', devToken);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

export default router;
