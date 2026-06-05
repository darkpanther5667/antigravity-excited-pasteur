"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../components/providers/AuthContext';
import { useToast } from '../../../components/providers/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';

function ResetPasswordContent() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      newErrors.phone = 'Valid 10-digit Indian phone number is required';
    }

    if (!resetToken.trim()) {
      newErrors.resetToken = 'Reset token is required';
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/;
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (!passwordRegex.test(newPassword)) {
      newErrors.newPassword = 'Must be at least 8 characters with 1 uppercase, 1 number, and 1 special symbol';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = (await resetPassword({
        phone,
        reset_token: resetToken,
        new_password: newPassword
      })) as { success: boolean };
      if (res.success) {
        toast('Password reset successful. Please log in.', 'success');
        router.push('/login');
      }
    } catch (err: unknown) {
      const errorObj = err as { error?: string };
      setGlobalError(errorObj.error || 'Failed to reset password. Verify your token or request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="flex flex-col gap-2 text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Define New Password</h1>
        <p className="text-sm text-slate-500">Provide the code and choose a secure password</p>
      </div>

      {globalError && (
        <Alert type="error" message={globalError} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Mobile Number"
          type="tel"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          disabled={!!searchParams.get('phone')}
        />
        <Input
          label="Reset Token / Code"
          type="text"
          placeholder="Enter the reset code sent to your phone"
          value={resetToken}
          onChange={(e) => setResetToken(e.target.value)}
          error={errors.resetToken}
        />
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-500">
        Remembered your password?{' '}
        <Link href="/login" className="text-slate-900 font-semibold hover:underline">
          Log In
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Suspense fallback={
        <Card className="w-full max-w-md flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900 border-r-2" />
        </Card>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
