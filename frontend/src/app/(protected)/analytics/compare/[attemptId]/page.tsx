'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthContext';
import { canAccess } from '@/lib/planUtils';
import { fetchCompareData } from '@/lib/analyticsApi';
import type { CompareData } from '@/lib/types/analytics';

// UI components
import PlanGateCard from '@/components/ui/PlanGateCard';
import TopperComparePanel from '@/components/analytics/TopperComparePanel';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const attemptId = params?.attemptId as string;
  const testId = searchParams?.get('testId') as string;

  const hasAccess = canAccess(user?.plan, 'ELITE');

  // Fetch comparison telemetry
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CompareData | null>({
    queryKey: ['analytics-compare', testId, attemptId],
    queryFn: async () => {
      try {
        return await fetchCompareData(testId, attemptId);
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: hasAccess && Boolean(testId && attemptId),
    staleTime: 30 * 1000,
    retry: false,
  });

  if (!testId || !attemptId) {
    return (
      <EmptyState
        title="Invalid Request Params"
        description="Missing test identifier or attempt ID parameters required to build the topper comparative telemetry."
        actionText="Back to Dashboard"
        onAction={() => router.push('/dashboard')}
      />
    );
  }

  // Gated UI for FREE/PRO users
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Topper Comparison Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Analyze your score and time distribution gaps relative to top achievers
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Go Back
          </Button>
        </div>
        <PlanGateCard
          requiredPlan="ELITE"
          featureName="Elite Topper Gap Analysis"
          description="Compare your sectional marks, pacing speed, and individual chapter accuracies against the exam toppers. Unlock key guidelines to bridge your rank gaps."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[250px] w-full rounded-2xl" />
        <Skeleton className="h-[250px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load topper comparative statistics. Please retry."
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Comparative Report Unavailable"
        description="The system could not compile comparison data. Ensure that other students have submitted attempts for this mock test paper."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            🥇 Topper Performance Gap Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Evaluate your subject benchmarks and chapter accuracies against the privacy-safe topper stats
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          ← Back to Result
        </Button>
      </div>

      <TopperComparePanel data={data} />
    </div>
  );
}
