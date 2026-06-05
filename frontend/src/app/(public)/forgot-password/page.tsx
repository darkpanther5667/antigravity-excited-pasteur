"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/providers/AuthContext';
import { useToast } from '../../../components/providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(phone);
      toast('Reset instructions sent to your phone.', 'success');
      router.push(`/reset-password?phone=${phone}`);
    } catch (err: unknown) {
      const errorObj = err as { error?: string };
      setError(errorObj.error || 'Request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-2 text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-sm text-slate-500">Enter your phone number to receive a reset code</p>
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
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Send Reset Code
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="text-slate-900 font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </Card>
    </div>
  );
}
