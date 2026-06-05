"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../components/providers/AuthContext';
import { useToast } from '../../../components/providers/ToastContext';
import apiClient from '../../../lib/api/apiClient';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';

function VerifyOtpContent() {
  const { verifyOtp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please provide a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(phone, otp);
      toast('Verification successful. Welcome!', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { error?: string };
      setError(errorObj.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError('A valid phone number is required to resend the code.');
      return;
    }

    setError(null);
    setIsResending(true);
    try {
      const res = await apiClient.post('/auth/send-otp', { phone });
      if (res.data && res.data.success) {
        toast('A new verification code has been sent.', 'success');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="flex flex-col gap-2 text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Verify Phone Number</h1>
        <p className="text-sm text-slate-500">Enter the 6-digit code sent to your phone</p>
      </div>

      {error && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Mobile Number"
          type="tel"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!!searchParams.get('phone')}
        />
        <Input
          label="Verification Code (OTP)"
          type="text"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Verify OTP
        </Button>

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-slate-500 hover:text-slate-900 hover:underline select-none disabled:opacity-50"
          >
            {isResending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Suspense fallback={
        <Card className="w-full max-w-md flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900 border-r-2" />
        </Card>
      }>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
