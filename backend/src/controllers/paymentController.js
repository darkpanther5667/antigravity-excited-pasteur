import Razorpay from 'razorpay';
import crypto from 'crypto';
import db from '../models/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { PLANS } from '../config/plans.js';
import { z } from 'zod';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret'
});

const createOrderSchema = z.object({
  plan_id: z.enum(['PRO', 'ELITE'])
});

export const createOrder = async (req, res, next) => {
  try {
    const validation = createOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { plan_id } = validation.data;
    const plan = PLANS[plan_id];

    const options = {
      amount: plan.price, // amount in paise
      currency: plan.currency || 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    let rzpOrder;
    try {
      if (process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id' || process.env.NODE_ENV === 'development') {
        rzpOrder = {
          id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
          amount: plan.price,
          currency: plan.currency || 'INR',
          status: 'created'
        };
      } else {
        rzpOrder = await razorpay.orders.create(options);
      }
    } catch (rzpErr) {
      return sendError(res, `Razorpay order creation failed: ${rzpErr.message}`, 400);
    }

    const order = await db.order.create({
      data: {
        userId: req.user.id,
        plan: plan_id,
        amount: plan.price,
        currency: plan.currency || 'INR',
        razorpayOrderId: rzpOrder.id,
        status: 'PENDING'
      }
    });

    return sendSuccess(res, {
      id: order.id,
      razorpay_order_id: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', 400);
    }

    const order = await db.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret';
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      await db.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' }
      });
      return sendError(res, 'Signature verification failed', 400);
    }

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      }
    });

    // Update user plan details (1 year expiry)
    const planExpiry = new Date();
    planExpiry.setDate(planExpiry.getDate() + 365);

    await db.user.update({
      where: { id: order.userId },
      data: {
        plan: order.plan,
        planExpiry
      }
    });

    return sendSuccess(res, {
      success: true,
      message: 'Payment verified successfully and plan activated'
    });
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req, res, next) => {
  try {
    const formattedPlans = Object.values(PLANS).map(p => ({
      ...p,
      price: p.price / 100
    }));
    return sendSuccess(res, formattedPlans);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await db.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Map to remove razorpaySignature
    const sanitizedOrders = orders.map(({ razorpaySignature, ...o }) => o);

    return sendSuccess(res, sanitizedOrders);
  } catch (error) {
    next(error);
  }
};
