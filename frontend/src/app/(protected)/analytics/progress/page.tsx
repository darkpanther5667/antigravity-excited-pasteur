'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchProgressData } from '@/lib/analyticsApi';
import type { ProgressData } from '@/lib/types/analytics';

// UI components
import ProgressChart from '@/components/analytics/ProgressChart';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export default function ProgressPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ProgressData | null>({
    queryKey: ['analytics-progress-full'],
    queryFn: async () => {
      try {
        return await fetchProgressData();
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
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load your mock attempt history. Please refresh."
        onRetry={refetch}
      />
    );
  }

  if (!data || data.tests.length === 0) {
    return (
      <EmptyState
        title="No test progress recorded"
        description="Your chronological mock test scores, rank progression, and percentile history will be graphed here. Take a mock test paper first!"
      />
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          📈 Progress & Rank History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          Chronological mapping of mock score metrics, rank gaps, and percentiles
        </p>
      </div>

      {/* Progress Chart */}
      <ProgressChart
        scoreTrend={data.score_trend}
        percentileTrend={data.percentile_trend}
      />

      {/* All attempts table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wider">
            Complete Attempt History Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Test Paper</th>
                <th className="px-6 py-3.5">Attempt Date</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5">Accuracy</th>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Percentile</th>
                <th className="px-6 py-3.5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
              {data.tests.map((att) => (
                <tr key={att.attempt_id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-905 dark:text-slate-200 max-w-[180px] truncate">{att.test_title}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(att.submitted_at)}</td>
                  <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-150">
                    {att.total_score} <span className="text-[10px] text-slate-400 font-normal">/ {att.max_possible}</span>
                  </td>
                  <td className="px-6 py-4">{att.accuracy.toFixed(0)}%</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-300">#{att.rank}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      {att.percentile.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/test/${att.test_id}/result/${att.attempt_id}`)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-705 dark:text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
