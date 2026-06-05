'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewData, fetchChapterHeatmap } from '@/lib/analyticsApi';
import type { OverviewData, ChapterHeatmapData } from '@/lib/types/analytics';

// Components
import OverviewCards from '@/components/dashboard/OverviewCards';
import SubjectAccuracyBar from '@/components/analytics/SubjectAccuracyBar';
import ChapterHeatmap from '@/components/analytics/ChapterHeatmap';
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export default function AnalyticsOverviewPage() {
  // 1. Fetch overview
  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: errorOverview,
    refetch: refetchOverview,
  } = useQuery<OverviewData | null>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      try {
        return await fetchOverviewData();
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

  // 2. Fetch chapter heatmap
  const {
    data: heatmapData,
    isLoading: isLoadingHeatmap,
    error: errorHeatmap,
    refetch: refetchHeatmap,
  } = useQuery<ChapterHeatmapData | null>({
    queryKey: ['analytics-heatmap'],
    queryFn: async () => {
      try {
        return await fetchChapterHeatmap();
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

  const isLoading = isLoadingOverview || isLoadingHeatmap;
  const isError = errorOverview || errorHeatmap;
  const noAttempts = overview === null || heatmapData === null || overview === undefined || heatmapData === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Unable to fetch analytics telemetry. Please try again."
        onRetry={() => {
          refetchOverview();
          refetchHeatmap();
        }}
      />
    );
  }

  if (noAttempts) {
    return (
      <EmptyState
        title="Analytics details will appear here"
        description="You have not submitted any test attempts yet. Complete a mock exam to view accuracy stats and confidence heatmaps."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Performance Overview
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          High-level metrics summary and global syllabus accuracy diagnostics
        </p>
      </div>

      {/* Metrics Row */}
      <OverviewCards data={overview} />

      {/* Chart and Heatmap Grid */}
      <div className="space-y-6">
        <SubjectAccuracyBar averages={overview.subject_averages} />
        <ChapterHeatmap heatmap={heatmapData.heatmap} />
      </div>
    </div>
  );
}
