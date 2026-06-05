"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, LeaderboardEntry } from '../../lib/api/leaderboardApi';
import { Spinner } from '../ui/Spinner';

interface RankGapWidgetProps {
  testId: string;
  attemptId: string;
  myScore: number;
  myRank: number;
}

export default function RankGapWidget({ testId, attemptId, myScore, myRank }: RankGapWidgetProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['rankGaps', testId, attemptId],
    queryFn: () => leaderboardApi.getRankGaps(testId, attemptId),
    enabled: !!testId && !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[180px]">
        <Spinner size="md" />
        <span className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider">Loading Leaderboard Gaps...</span>
      </div>
    );
  }

  if (isError || !data?.success || !data.data) {
    return null; // Don't render widget if it fails
  }

  const list = data.data;

  // We find "self" by matching score and rank to highlight "You"
  const isSelf = (item: LeaderboardEntry) => {
    return item.rank === myRank && Math.abs(item.score - myScore) < 0.01;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
        <h3 className="font-extrabold text-sm text-slate-905 text-slate-900 dark:text-white flex items-center gap-1.5">
          <svg className="h-4.5 w-4.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          Neighborhood Rankings
        </h3>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/20 px-2 py-0.5 border dark:border-slate-800 rounded">
          Rank Gap
        </span>
      </div>

      <div className="overflow-hidden border border-slate-150 dark:border-slate-850 rounded-xl">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="p-3">Rank</th>
              <th className="p-3 text-left">Student Name</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Percentile</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => {
              const self = isSelf(item);
              return (
                <tr
                  key={`${item.rank}-${idx}`}
                  className={`border-b border-slate-100 dark:border-slate-850 last:border-0 ${
                    self
                      ? 'bg-indigo-600/5 dark:bg-indigo-950/20 font-extrabold text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <td className="p-3">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black ${
                      self 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="p-3 text-left max-w-[150px] truncate font-medium">
                    {self ? 'You (Truncated)' : item.name}
                    {item.institute && (
                      <span className="block text-[9px] text-slate-400 font-normal">{item.institute}</span>
                    )}
                  </td>
                  <td className="p-3 font-bold">{item.score}</td>
                  <td className="p-3 font-mono text-[10px]">{item.percentile.toFixed(2)}%ile</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
