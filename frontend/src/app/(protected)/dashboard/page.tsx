'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { useAuth } from '@/components/providers/AuthContext';
import type { APIResponse } from '@/lib/types';
import type { OverviewData, ProgressData } from '@/lib/types/analytics';
import { fetchOverviewData, fetchProgressData } from '@/lib/analyticsApi';

// Shared UI components
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

// Dashboard components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OverviewCards from '@/components/dashboard/OverviewCards';
import SubjectSnapshotCards from '@/components/dashboard/SubjectSnapshotCards';
import SuggestedActions from '@/components/dashboard/SuggestedActions';
import RecentAttemptsTable from '@/components/dashboard/RecentAttemptsTable';
import UpgradeModal from '@/components/dashboard/UpgradeModal';

interface TestItem {
  id: string;
  title: string;
  type: 'FULL' | 'CHAPTER' | 'SECTION';
  examType: 'MAINS' | 'ADVANCED';
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  
  // State for upgrade modal
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Check URL params for upgrade trigger
  useEffect(() => {
    if (searchParams?.get('upgrade') === 'true') {
      setIsUpgradeOpen(true);
    }
  }, [searchParams]);

  // 1. Fetch available mock tests
  const {
    data: testsData,
    isLoading: isLoadingTests,
    error: errorTests,
  } = useQuery<{ tests: TestItem[] }>({
    queryKey: ['available-tests'],
    queryFn: async () => {
      const res = await apiClient.get<APIResponse<{ tests: TestItem[] }>>(
        '/tests?is_published=true'
      );
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error || 'Failed to load tests');
      }
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch overview analytics (404 is ignored if no attempts yet)
  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: errorOverview,
    refetch: refetchOverview,
  } = useQuery<OverviewData | null>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      try {
        return await fetchOverviewData();
      } catch (err) {
        const error = err as { message?: string; response?: { status?: number } };
        // If 404 error indicating no attempts, return null instead of throwing
        if (error.message?.includes('No submitted attempts') || error.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
    retry: false,
  });

  // 3. Fetch progress attempts (404 is ignored if no attempts yet)
  const {
    data: progress,
    isLoading: isLoadingProgress,
    error: errorProgress,
    refetch: refetchProgress,
  } = useQuery<ProgressData | null>({
    queryKey: ['dashboard-progress'],
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
    retry: false,
  });

  const handleUpgradeSuccess = async () => {
    setIsUpgradeOpen(false);
    await refreshUser();
    // Centralized cache invalidation to refetch all dashboard and analytic keys in-place
    queryClient.invalidateQueries();
  };

  const hasAttempts =
    overview !== null &&
    overview !== undefined &&
    progress !== null &&
    progress !== undefined &&
    progress.tests.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <DashboardHeader />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent blur-xl pointer-events-none" />
          <div className="space-y-1 z-10">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">JEE Preparation Arena</h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-md">
              Take mock exams under NTA-accurate constraints, review detailed chapter-level answers, and master your pacing.
            </p>
          </div>
          <div className="flex shrink-0 z-10">
            <Button
              onClick={() => setIsUpgradeOpen(true)}
              className="bg-white text-indigo-950 hover:bg-slate-100 font-bold px-6 py-2.5 shadow-md"
            >
              Explore Tiers
            </Button>
          </div>
        </div>

        {/* ─── Analytics Summary Section ─── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Performance Insights
            </h2>
            {hasAttempts && (
              <button
                onClick={() => router.push('/analytics/overview')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Analytics Dashboard →
              </button>
            )}
          </div>

          {isLoadingOverview || isLoadingProgress ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          ) : errorOverview || errorProgress ? (
            <ErrorState
              message="Failed to load your performance insights. Please refresh."
              onRetry={() => {
                refetchOverview();
                refetchProgress();
              }}
            />
          ) : !hasAttempts ? (
            <div className="rounded-2xl border border-slate-250 bg-slate-50/40 p-8 text-center dark:border-slate-850 dark:bg-slate-900/10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Mock Attempts Registered</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Take a mock test paper below. Once submitted, your scores, average percentiles, chapter heatmaps, and SWOT diagnostics will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Stat Cards */}
              <OverviewCards data={overview} />

              {/* Subject Breakdown & Advice */}
              <div className="space-y-6">
                <SubjectSnapshotCards averages={overview.subject_averages} />
                <SuggestedActions data={overview} />
              </div>

              {/* Recent Attempts */}
              <RecentAttemptsTable attempts={progress.tests} />
            </div>
          )}
        </div>

        {/* ─── Available Mock Tests ─── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            Available Mock Test Papers
          </h2>

          {isLoadingTests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : errorTests ? (
            <ErrorState message="Could not load mock test papers. Check connection." />
          ) : !testsData || testsData.tests.length === 0 ? (
            <EmptyState
              title="No tests available"
              description="Check back later. Admin has not published any JEE Mains or Advanced tests yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testsData.tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition-all rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        test.examType === 'ADVANCED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/35 dark:text-amber-400'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/35 dark:text-indigo-400'
                      }`}>
                        JEE {test.examType}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {test.type === 'FULL' ? 'Full Test' : test.type === 'SECTION' ? 'Sectional' : 'Chapter Practice'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight mb-2">
                      {test.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex gap-4">
                      <span>🕒 {test.durationMinutes} mins</span>
                      <span>📊 {test.totalMarks} Marks</span>
                    </div>
                    <Button
                      onClick={() => router.push(`/test/${test.id}/instructions`)}
                      size="sm"
                      className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                    >
                      Start Attempt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-12">
        <p>&copy; {new Date().getFullYear()} JEE Mock Test Series. Built for premium preparation.</p>
      </footer>
    </div>
  );
}
