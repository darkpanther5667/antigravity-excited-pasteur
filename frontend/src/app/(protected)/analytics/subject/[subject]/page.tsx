'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchSubjectBreakdown } from '@/lib/analyticsApi';
import type { SubjectBreakdownData } from '@/lib/types/analytics';

// UI components
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import StatCard from '@/components/ui/StatCard';

const SUBJECT_METADATA: Record<string, { label: string; icon: string; style: string }> = {
  physics: { label: 'Physics', icon: '⚛️', style: 'indigo' },
  chemistry: { label: 'Chemistry', icon: '🧪', style: 'emerald' },
  maths: { label: 'Mathematics', icon: '📐', style: 'orange' },
};

export default function SubjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const rawSubject = params?.subject as string;
  const subjectKey = rawSubject?.toLowerCase();

  const meta = SUBJECT_METADATA[subjectKey] || { label: rawSubject, icon: '📊', style: 'indigo' };

  // Fetch subject breakdown
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SubjectBreakdownData | null>({
    queryKey: ['analytics-subject', subjectKey],
    queryFn: async () => {
      try {
        return await fetchSubjectBreakdown(subjectKey.toUpperCase());
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(subjectKey && SUBJECT_METADATA[subjectKey]),
    staleTime: 30 * 1000,
  });

  if (!SUBJECT_METADATA[subjectKey]) {
    return (
      <EmptyState
        title="Invalid Subject Route"
        description="The requested subject analysis page does not exist. Choose Physics, Chemistry, or Maths."
        actionText="Back to Dashboard"
        onAction={() => router.push('/dashboard')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={`Failed to fetch ${meta.label} analytics breakdown. Please try again.`}
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title={`${meta.label} breakdown not available`}
        description={`You haven't attempted any tests containing ${meta.label} questions yet.`}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>{meta.icon}</span>
          {meta.label} Analysis
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
          Detailed chapter-wise, topic-wise, and accuracy-level breakdown for {meta.label}
        </p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Overall Accuracy"
          value={`${data.overall_accuracy.toFixed(0)}%`}
          description={`Average accuracy in ${meta.label}`}
        />
        <StatCard
          title="Questions Attempted"
          value={data.total_questions_attempted}
          description="Total answered questions"
        />
        <StatCard
          title="Average Score"
          value={data.avg_score_per_test.toFixed(1)}
          description="Average marks obtained per mock"
        />
      </div>

      {/* Strong vs Weak chapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong */}
        <div className="border border-emerald-150 dark:border-emerald-950/30 rounded-2xl p-5 bg-emerald-50/10 dark:bg-emerald-950/5 flex flex-col gap-3">
          <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Top Strong Areas
          </h4>
          {data.strong_chapters.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No strong chapters identified yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.strong_chapters.map((ch) => (
                <li key={ch.chapter} className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 shadow-xxs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{ch.chapter}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{ch.accuracy.toFixed(0)}% accuracy</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weak */}
        <div className="border border-rose-150 dark:border-rose-950/30 rounded-2xl p-5 bg-rose-50/10 dark:bg-rose-950/5 flex flex-col gap-3">
          <h4 className="font-extrabold text-sm text-rose-800 dark:text-rose-455 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Weak Areas (Prioritize)
          </h4>
          {data.weak_chapters.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No weak chapters identified yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.weak_chapters.map((ch) => (
                <li key={ch.chapter} className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 shadow-xxs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{ch.chapter}</span>
                  <span className="font-black text-rose-600 dark:text-rose-405">{ch.accuracy.toFixed(0)}% accuracy</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chapters Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Detailed Chapter Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Chapter</th>
                <th className="px-6 py-3">Attempted</th>
                <th className="px-6 py-3">Accuracy</th>
                <th className="px-6 py-3">Avg Speed</th>
                <th className="px-6 py-3 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-750 dark:text-slate-350">
              {data.chapter_breakdown.map((ch) => {
                const trendIcon = ch.trend === 'improving'
                  ? '📈'
                  : ch.trend === 'declining'
                  ? '📉'
                  : '➡️';
                return (
                  <tr key={ch.chapter} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-150 max-w-[220px] truncate">{ch.chapter}</td>
                    <td className="px-6 py-3.5">{ch.attempted}</td>
                    <td className={`px-6 py-3.5 font-extrabold ${
                      ch.accuracy >= 75
                        ? 'text-emerald-600'
                        : ch.accuracy >= 55
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}>
                      {ch.accuracy.toFixed(0)}%
                    </td>
                    <td className="px-6 py-3.5">{(ch.avg_time_seconds || 0).toFixed(0)}s / q</td>
                    <td className="px-6 py-3.5 text-right font-bold flex justify-end gap-1">
                      <span>{trendIcon}</span>
                      <span className="capitalize">{ch.trend}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wider">
            Sub-Topic Breakdown Analysis
          </h3>
        </div>
        {data.topic_breakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">No sub-topics logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Sub-Topic</th>
                  <th className="px-6 py-3.5">Chapter</th>
                  <th className="px-6 py-3.5">Solved</th>
                  <th className="px-6 py-3.5">Accuracy</th>
                  <th className="px-6 py-3.5 text-right">Avg Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                {data.topic_breakdown.map((t, idx) => (
                  <tr key={`${t.topic}-${idx}`} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-bold text-slate-850 dark:text-slate-200 max-w-[200px] truncate">{t.topic || 'General Practice'}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{t.chapter}</td>
                    <td className="px-6 py-3">{t.attempted}</td>
                    <td className="px-6 py-3 font-bold">{t.accuracy.toFixed(0)}%</td>
                    <td className="px-6 py-3 text-right">{(t.avg_time_seconds || 0).toFixed(0)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
