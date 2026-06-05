'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthContext';
import { canAccess } from '@/lib/planUtils';
import { fetchSWOTData } from '@/lib/analyticsApi';
import type { SWOTData } from '@/lib/types/analytics';

// UI components
import PlanGateCard from '@/components/ui/PlanGateCard';
import SWOTPanel from '@/components/analytics/SWOTPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export default function SWOTPage() {
  const { user } = useAuth();
  const hasAccess = canAccess(user?.plan, 'PRO');

  // Fetch SWOT data (only if user has PRO/ELITE access)
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SWOTData | null>({
    queryKey: ['analytics-swot'],
    queryFn: async () => {
      try {
        return await fetchSWOTData();
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: hasAccess,
    staleTime: 30 * 1000,
    retry: false,
  });

  // Gated UI for FREE users
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            SWOT Analysis Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Evaluate your Strengths, Weaknesses, Opportunities, and Pace Threats
          </p>
        </div>
        <PlanGateCard
          requiredPlan="PRO"
          featureName="AI-Driven SWOT Report"
          description="Unlock your personalized SWOT matrix, priority topic revision roadmaps, and pace analysis threats to maximize your JEE marks."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to compute your SWOT report. Please try again."
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="SWOT Matrix Not Ready"
        description="We need at least one completed mock exam attempt to compile your Strengths, Weaknesses, and pacing threats. Try taking a test first!"
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          🎯 SWOT Report Card
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          Personalized assessment of mock exam habits, target chapters, and pacing anomalies
        </p>
      </div>

      <SWOTPanel data={data} />
    </div>
  );
}
