'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeAnalysis } from '@/lib/analyticsApi';
import type { TimeAnalysisData } from '@/lib/types/analytics';

// UI components
import TimeDistributionBar from '@/components/analytics/TimeDistributionBar';
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import StatCard from '@/components/ui/StatCard';

export default function TimeAnalysisPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TimeAnalysisData | null>({
    queryKey: ['analytics-time'],
    queryFn: async () => {
      try {
        return await fetchTimeAnalysis();
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Skeleton className="h-[280px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load your speed analytics. Please try again."
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Time analytics not ready"
        description="We need at least one mock test submission to calculate your section pacing, speed distributions, and slowest chapter targets."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          ⏱️ Speed & Time Analysis
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          Evaluate your pacing profile, time efficiency by difficulty, and target speed bottlenecks
        </p>
      </div>

      {/* Overview timing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Overall Pace"
          value={`${data.avg_time_per_question_seconds.toFixed(0)}s`}
          description="Average time spent per solved question"
        />
        <StatCard
          title="Fastest Subject"
          value={
            Object.entries(data.by_subject).reduce((min, cur) => (cur[1].avg_time < min[1].avg_time ? cur : min))[0].toUpperCase()
          }
          description="Subject with lowest average time per question"
        />
        <StatCard
          title="Hard Questions Pace"
          value={`${data.by_difficulty.hard.avg_time.toFixed(0)}s`}
          description="Average time spent on hard questions"
        />
      </div>

      {/* Time distribution chart */}
      <TimeDistributionBar distribution={data.time_distribution} />

      {/* Subject timing stats grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
          Section Speed Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(data.by_subject).map(([subject, stats]) => (
            <div key={subject} className="bg-slate-50/50 dark:bg-slate-950/15 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {subject}
              </h4>
              <div className="text-2xl font-black">
                {stats.avg_time.toFixed(0)}s <span className="text-[10px] font-medium text-slate-400">/ question</span>
              </div>
              <div className="space-y-1 text-[10px] font-semibold text-slate-500">
                <div>
                  <span className="text-slate-405">Fastest:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300 font-bold truncate block">{stats.fastest_chapter || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-405">Slowest:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300 font-bold truncate block">{stats.slowest_chapter || 'None'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slowest and Fastest chapter callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fastest */}
        <div className="border border-emerald-100 dark:border-emerald-950/30 rounded-2xl p-5 bg-emerald-50/10 dark:bg-emerald-950/5 flex flex-col gap-3">
          <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚡ Fastest Syllabus Chapters
          </h4>
          {data.fast_chapters.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No speed outliers detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.fast_chapters.slice(0, 4).map((ch) => (
                <li key={ch} className="text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 shadow-xxs font-bold text-slate-700 dark:text-slate-300">
                  {ch}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slowest */}
        <div className="border border-rose-100 dark:border-rose-950/30 rounded-2xl p-5 bg-rose-50/10 dark:bg-rose-950/5 flex flex-col gap-3">
          <h4 className="font-extrabold text-sm text-rose-800 dark:text-rose-455 uppercase tracking-wider flex items-center gap-1.5">
            🐌 Slowest Speed Bottlenecks
          </h4>
          {data.slow_chapters.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No pace bottleneck chapters detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.slow_chapters.slice(0, 4).map((ch) => (
                <li key={ch} className="text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 shadow-xxs font-bold text-slate-700 dark:text-slate-350">
                  {ch}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
