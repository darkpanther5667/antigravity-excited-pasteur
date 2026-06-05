"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, TestLeaderboardData, GlobalLeaderboardData, LeaderboardEntry, GlobalLeaderboardEntry } from '../../lib/api/leaderboardApi';
import { Spinner } from '../ui/Spinner';
import ErrorState from '../ui/ErrorState';
import type { APIResponse } from '../../lib/types';

interface LeaderboardTableProps {
  mode: 'test' | 'global';
  testId?: string;
}

export default function LeaderboardTable({ mode, testId }: LeaderboardTableProps) {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);

  const { data, isLoading, isError, error, refetch } = useQuery<APIResponse<TestLeaderboardData> | APIResponse<GlobalLeaderboardData>, Error>({
    queryKey: ['leaderboard', mode, { testId, page, limit }],
    queryFn: () => {
      if (mode === 'test' && testId) {
        return leaderboardApi.getTestLeaderboard(testId, page, limit);
      } else {
        return leaderboardApi.getGlobalLeaderboard(page, limit);
      }
    },
    enabled: mode !== 'test' || !!testId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Retrieving leaderboard rankings...</p>
      </div>
    );
  }

  if (isError || !data?.success || !data.data) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl">
        <ErrorState
          title="Failed to Load Leaderboard"
          message={error instanceof Error ? error.message : (data?.error || 'Failed to fetch ranking entries.')}
          onRetry={refetch}
        />
      </div>
    );
  }

  const dataObj = data.data as TestLeaderboardData & GlobalLeaderboardData;
  const list = dataObj.leaderboard as Array<LeaderboardEntry & GlobalLeaderboardEntry>;
  const totalPages = dataObj.totalPages;
  const totalRecords = dataObj.total;

  if (list.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-slate-500">
        No attempts submitted yet. Be the first to start this test!
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950">
              <th className="p-4 w-20">Rank</th>
              <th className="p-4 text-left">Student Name</th>
              {mode === 'test' ? (
                <>
                  <th className="p-4">Overall Score</th>
                  <th className="p-4">Percentile</th>
                  <th className="p-4">Physics</th>
                  <th className="p-4">Chemistry</th>
                  <th className="p-4">Maths</th>
                </>
              ) : (
                <>
                  <th className="p-4">Average Percentile</th>
                  <th className="p-4">Tests Attempted</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx: number) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="p-4 align-middle">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-black text-[11px] ${
                    item.rank === 1
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      : item.rank === 2
                      ? 'bg-slate-150 text-slate-700 bg-slate-200 dark:bg-slate-800/80 dark:text-slate-350'
                      : item.rank === 3
                      ? 'bg-orange-100 text-orange-850 dark:bg-orange-950/20 dark:text-orange-400'
                      : 'bg-slate-100/50 text-slate-500 dark:bg-slate-950/30'
                  }`}>
                    {item.rank}
                  </span>
                </td>
                <td className="p-4 text-left align-middle font-bold text-slate-800 dark:text-slate-250">
                  {item.name}
                  {item.institute && (
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">{item.institute}</span>
                  )}
                </td>
                
                {mode === 'test' ? (
                  <>
                    <td className="p-4 align-middle font-extrabold text-slate-800 dark:text-slate-200">
                      {item.score} <span className="text-[10px] text-slate-400 font-normal">/ {dataObj.test?.total_marks}</span>
                    </td>
                    <td className="p-4 align-middle font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.percentile?.toFixed(2)} %ile
                    </td>
                    <td className="p-4 align-middle text-slate-600 dark:text-slate-400 font-semibold">{item.physicsScore}</td>
                    <td className="p-4 align-middle text-slate-600 dark:text-slate-400 font-semibold">{item.chemistryScore}</td>
                    <td className="p-4 align-middle text-slate-600 dark:text-slate-400 font-semibold">{item.mathsScore}</td>
                  </>
                ) : (
                  <>
                    <td className="p-4 align-middle font-mono font-bold text-purple-600 dark:text-purple-400">
                      {item.avgPercentile?.toFixed(2)} %ile
                    </td>
                    <td className="p-4 align-middle font-extrabold text-slate-700 dark:text-slate-300">
                      {item.testsTaken} Exams
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-850 dark:text-slate-200">{page}</strong> of <strong className="text-slate-850 dark:text-slate-200">{totalPages}</strong> (Showing {list.length} of {totalRecords} entries)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-850 text-[10px] font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-850 text-[10px] font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
