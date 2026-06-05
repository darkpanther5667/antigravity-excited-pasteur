"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/providers/AuthContext';
import { Spinner } from '../../components/ui/Spinner';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authInitialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authInitialized, router]);

  if (isLoading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
