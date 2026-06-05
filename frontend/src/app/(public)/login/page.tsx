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

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Email address or Phone number is required';
    } else if (identifier.includes('@')) {
      if (!/\S+@\S+\.\S+/.test(identifier)) {
        newErrors.identifier = 'Please enter a valid email address';
      }
    } else {
      if (!/^\d{10}$/.test(identifier)) {
        newErrors.identifier = 'Please enter a valid 10-digit phone number or email';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
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
      await login(identifier, password);
      toast('Login successful', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { status?: number; error?: string };
      if (errorObj.status === 403 && errorObj.error === 'Please verify your phone number first') {
        toast('Verification required. Sending you to OTP page.', 'info');
        const phoneParam = /^\d{10}$/.test(identifier) ? `?phone=${identifier}` : '';
        router.push(`/verify-otp${phoneParam}`);
      } else {
        setGlobalError(errorObj.error || 'Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-2 text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to continue your test prep</p>
        </div>

        {globalError && (
          <Alert type="error" message={globalError} className="mb-4" />
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email or Mobile Number"
            type="text"
            placeholder="john@example.com or 9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={errors.identifier}
          />
          <div className="flex flex-col gap-1.5 w-full">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-900 hover:underline select-none"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Log In
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-slate-900 font-semibold hover:underline">
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
}
