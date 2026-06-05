"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/adminApi';
import TestForm from '@/components/admin/TestForm';
import { Spinner } from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';

interface EditTestPageProps {
  params: {
    id: string;
  };
}

export default function EditTestPage({ params }: EditTestPageProps) {
  const { id } = params;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminTestDetails', id],
    queryFn: () => adminApi.getTest(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Fetching mock test details...</p>
      </div>
    );
  }

  if (isError || !data?.success || !data.data) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <ErrorState
          title="Failed to Load Test"
          message={error instanceof Error ? error.message : (data?.error || 'Test not found.')}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8">
      <TestForm initialData={data.data} isEdit={true} />
    </main>
  );
}
