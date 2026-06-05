import express from 'express';
import { 
  createOrder, 
  verifyPayment, 
  getPlans, 
  getOrders 
} from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public route to retrieve plans
router.get('/plans', getPlans);

// Auth-protected routes for order generation, verification, and list retrieval
router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/orders', auth, getOrders);

export default router;
