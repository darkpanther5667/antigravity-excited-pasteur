import apiClient from './apiClient';
import type { APIResponse } from '../types';

export interface PlanConfig {
  id: 'PRO' | 'ELITE';
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
}

export interface OrderData {
  id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export const paymentsApi = {
  getPlans: async () => {
    const res = await apiClient.get<APIResponse<PlanConfig[]>>('/payments/plans');
    return res.data;
  },
  createOrder: async (planId: 'PRO' | 'ELITE') => {
    const res = await apiClient.post<APIResponse<OrderData>>('/payments/create-order', { plan_id: planId });
    return res.data;
  },
  verifyPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const res = await apiClient.post<APIResponse<{ success: boolean; message: string }>>('/payments/verify', payload);
    return res.data;
  },
  getOrders: async () => {
    const res = await apiClient.get<APIResponse<OrderData[]>>('/payments/orders');
    return res.data;
  }
};
