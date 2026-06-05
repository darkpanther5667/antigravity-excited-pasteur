import React, { useState } from 'react';
import apiClient from '../../lib/api/apiClient';
import type { APIResponse } from '../../lib/types';
import { Button } from '../ui/Button';
import { useAuth } from '../providers/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Native Web Crypto API helper to sign the signature for mock verification
async function generateHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    key,
    messageData
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'ELITE'>('PRO');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  if (!isOpen) return null;

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Create order
      const orderRes = await apiClient.post<APIResponse<{ id: string; razorpay_order_id: string; amount: number }>>(
        '/payments/create-order',
        { plan_id: selectedPlan }
      );

      if (!orderRes.data.success || !orderRes.data.data) {
        throw new Error(orderRes.data.error || 'Failed to create payment order');
      }

      const { razorpay_order_id, amount } = orderRes.data.data;

      // 2. Load Razorpay script
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway script. Try simulation mode.');
      }

      // 3. Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        amount: amount,
        currency: 'INR',
        name: 'JEE Mock Test Platform',
        description: `${selectedPlan} Tier Subscription`,
        order_id: razorpay_order_id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setLoading(true);
            const verifyRes = await apiClient.post<APIResponse<unknown>>('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await refreshUser();
              onSuccess();
            } else {
              setErrorMsg(verifyRes.data.error || 'Payment verification failed');
            }
          } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'An error occurred during verification');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'JEE Student',
          email: 'student@example.com',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const RazorpayConstructor = (window as unknown as {
        Razorpay: new (opts: unknown) => {
          open: () => void;
          on: (event: string, callback: (resp: { error: { description: string } }) => void) => void;
        };
      }).Razorpay;

      const rzp = new RazorpayConstructor(options);
      rzp.on('payment.failed', function (resp: { error: { description: string } }) {
        setErrorMsg(`Payment failed: ${resp.error.description || 'Unknown error'}`);
      });
      rzp.open();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to launch payment gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Create order
      const orderRes = await apiClient.post<APIResponse<{ id: string; razorpay_order_id: string; amount: number }>>(
        '/payments/create-order',
        { plan_id: selectedPlan }
      );

      if (!orderRes.data.success || !orderRes.data.data) {
        throw new Error(orderRes.data.error || 'Failed to create payment order');
      }

      const { razorpay_order_id } = orderRes.data.data;

      // 2. Simulate Razorpay verification variables
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
      let signature = '';
      if (process.env.NODE_ENV === 'development') {
        const secret = process.env.NEXT_PUBLIC_RAZORPAY_DEV_SECRET || 'your_razorpay_secret';
        signature = await generateHmacSha256(`${razorpay_order_id}|${mockPaymentId}`, secret);
      } else {
        throw new Error('Simulation is disabled in production environments.');
      }

      // 3. Verify simulated payment
      const verifyRes = await apiClient.post<APIResponse<unknown>>('/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: signature,
      });

      if (verifyRes.data.success) {
        await refreshUser();
        onSuccess();
      } else {
        setErrorMsg(verifyRes.data.error || 'Simulated verification failed on backend');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Choose Subscription Plan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Unlock professional SWOT profiling, topper comparison, and unlimited mocks.
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Selector Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* PRO */}
            <div
              onClick={() => setSelectedPlan('PRO')}
              className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                selectedPlan === 'PRO'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {selectedPlan === 'PRO' && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  ✓
                </span>
              )}
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">PRO PLAN</h4>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                ₹999<span className="text-xs font-medium text-slate-400">/year</span>
              </div>
              <ul className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <li>• Unlimited Mock Tests</li>
                <li>• SWOT Matrix Insight</li>
                <li>• Complete PYQ Bank</li>
              </ul>
            </div>

            {/* ELITE */}
            <div
              onClick={() => setSelectedPlan('ELITE')}
              className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                selectedPlan === 'ELITE'
                  ? 'border-purple-600 bg-purple-50/20 dark:border-purple-500 dark:bg-purple-950/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {selectedPlan === 'ELITE' && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold">
                  ✓
                </span>
              )}
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">ELITE PLAN</h4>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                ₹1799<span className="text-xs font-medium text-slate-400">/year</span>
              </div>
              <ul className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <li>• Everything in PRO</li>
                <li>• Topper Comparison</li>
                <li>• Coaching Dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRazorpayPayment}
            disabled={loading}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold"
          >
            {loading ? 'Processing...' : 'Pay via Razorpay'}
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={handleSimulatePayment}
              disabled={loading}
              variant="outline"
              className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
            >
              {loading ? 'Simulating...' : 'Simulate Success (Dev)'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
