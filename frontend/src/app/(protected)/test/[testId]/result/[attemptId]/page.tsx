'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import type { APIResponse } from '@/lib/types';
import type { ResultData, ReviewFilter, SubjectFilter, SectionBreakdown } from '@/lib/types/result';
import ResultReviewFilter from '@/components/result/ResultReviewFilter';
import ResultReviewList from '@/components/result/ResultReviewList';
import { Button } from '@/components/ui/Button';
import RankGapWidget from '@/components/leaderboard/RankGapWidget';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const attemptId = params?.attemptId as string;

  const [currentFilter, setCurrentFilter] = useState<ReviewFilter>('all');
  const [currentSubject, setCurrentSubject] = useState<SubjectFilter>('all');

  const { data: result, isLoading, error } = useQuery<ResultData>({
    queryKey: ['test-result', testId, attemptId],
    queryFn: async () => {
      const res = await apiClient.get<APIResponse<ResultData>>(
        `/tests/${testId}/result/${attemptId}`,
      );
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error ?? 'Failed to fetch result');
      }
      return res.data.data;
    },
    enabled: Boolean(testId && attemptId),
    staleTime: 30 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-sm px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Result Not Available</h1>
          <p className="text-slate-500 dark:text-slate-450 text-sm mb-6">
            {error instanceof Error ? error.message : 'Unable to load result. Please try again.'}
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            size="md"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { test, scores, stats, section_breakdown, responses = [] } = result;
  const percentage = Math.round((scores.total / scores.max_possible) * 100);
  const isPassing = percentage >= 30;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 flex items-center px-6 gap-4 border-b border-slate-800 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-slate-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <div className="flex-1" />
        <span className="text-white text-sm font-semibold tracking-wide truncate max-w-xs sm:max-w-md">{test.title}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Score Hero */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div
            className={`px-6 py-10 text-center bg-gradient-to-br ${
              isPassing
                ? 'from-indigo-600 via-indigo-700 to-purple-800'
                : 'from-slate-700 via-slate-800 to-slate-900'
            }`}
          >
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Overall Attempt Result</p>
            <div className="text-6xl sm:text-7xl font-black text-white mb-2 tracking-tight">
              {scores.total.toFixed(0)}
            </div>
            <p className="text-indigo-150 text-base sm:text-lg font-medium">
              out of {scores.max_possible}
              <span className="ml-2.5 text-indigo-100 font-extrabold">({percentage}%)</span>
            </p>
            {(stats.rank !== null || stats.percentile !== null) && (
              <div className="mt-6 flex items-center justify-center gap-8 border-t border-white/10 pt-6 max-w-sm mx-auto">
                {stats.rank !== null && (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-white">#{stats.rank}</div>
                    <div className="text-indigo-200 text-xxs font-bold uppercase tracking-wider">Rank</div>
                  </div>
                )}
                {stats.percentile !== null && (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {stats.percentile.toFixed(1)}
                    </div>
                    <div className="text-indigo-200 text-xxs font-bold uppercase tracking-wider">Percentile</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
            <StatCell label="Attempted" value={stats.attempted} color="text-slate-850 dark:text-slate-150" />
            <StatCell label="Correct" value={stats.correct} color="text-emerald-600 dark:text-emerald-400" />
            <StatCell label="Incorrect" value={stats.incorrect} color="text-rose-600 dark:text-rose-400" />
            <StatCell
              label="Time Taken"
              value={formatTime(stats.time_taken_seconds)}
              color="text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">
            Section-wise breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard
              name="Physics"
              score={scores.physics}
              breakdown={section_breakdown.physics}
              color="blue"
            />
            <SectionCard
              name="Chemistry"
              score={scores.chemistry}
              breakdown={section_breakdown.chemistry}
              color="green"
            />
            <SectionCard
              name="Maths"
              score={scores.maths}
              breakdown={section_breakdown.maths}
              color="orange"
            />
          </div>
        </div>

        {/* Rank Gap Neighborhood Leaderboard Widget */}
        <RankGapWidget
          testId={testId}
          attemptId={attemptId}
          myScore={scores.total}
          myRank={stats.rank || 0}
        />

        {/* Question Review Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Question Review Mode
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/leaderboard/test/${testId}`)}
                className="flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Test Leaderboard
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/analytics/compare/${attemptId}?testId=${testId}`)}
                className="flex items-center gap-1"
              >
                Compare with Topper
              </Button>
            </div>
          </div>

          {/* Filter Component */}
          <ResultReviewFilter
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            currentSubject={currentSubject}
            onSubjectChange={setCurrentSubject}
          />

          {/* Review List Component */}
          <ResultReviewList
            questions={responses}
            currentFilter={currentFilter}
            currentSubject={currentSubject}
          />
        </div>

        {/* Actions Bottom */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          <Button
            onClick={() => router.push(`/test/${testId}/instructions`)}
            variant="secondary"
            className="flex-1 font-semibold"
          >
            Re-attempt Test
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1 font-semibold bg-slate-900 hover:bg-slate-800 text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center py-5">
      <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
      <div className="text-xxs font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function SectionCard({
  name,
  score,
  breakdown,
  color,
}: {
  name: string;
  score: number;
  breakdown: SectionBreakdown;
  color: 'blue' | 'green' | 'orange';
}) {
  const colorMap = {
    blue: {
      bg: 'bg-indigo-50/50 dark:bg-indigo-950/10',
      border: 'border-indigo-100 dark:border-indigo-950/40',
      text: 'text-indigo-850 dark:text-indigo-400',
      bar: 'bg-indigo-500',
    },
    green: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
      border: 'border-emerald-100 dark:border-emerald-950/40',
      text: 'text-emerald-850 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
    orange: {
      bg: 'bg-orange-50/50 dark:bg-orange-950/10',
      border: 'border-orange-100 dark:border-orange-950/40',
      text: 'text-orange-850 dark:text-orange-400',
      bar: 'bg-orange-500',
    },
  };
  const c = colorMap[color];

  const totalAttempted = breakdown.attempted;
  const correctCount = breakdown.correct;
  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{name}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2 py-0.5 rounded-full">
            {accuracy}% Accuracy
          </span>
        </div>
        <div className={`text-3.5xl font-black ${c.text} mt-2`}>{score.toFixed(0)}</div>
      </div>

      <div className="space-y-2 text-xs mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400">
        <div className="flex justify-between items-center">
          <span>Attempted</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{breakdown.attempted}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Correct</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{breakdown.correct}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Incorrect</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{breakdown.incorrect}</span>
        </div>
      </div>
    </div>
  );
}
