import React from 'react';
import { useRouter } from 'next/navigation';
import { ProgressAttempt } from '../../lib/types/analytics';
import EmptyState from '../ui/EmptyState';

interface RecentAttemptsTableProps {
  attempts: ProgressAttempt[];
}

export default function RecentAttemptsTable({ attempts }: RecentAttemptsTableProps) {
  const router = useRouter();

  if (attempts.length === 0) {
    return (
      <EmptyState
        title="No test attempts yet"
        description="Take your first mock test from the list of available tests below to begin tracking your performance."
      />
    );
  }

  // Show last 5 attempts
  const recentAttempts = attempts.slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Recent Test Attempts
        </h3>
        <button
          onClick={() => router.push('/analytics/progress')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View All Progress
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Test Name</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Percentile</th>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAttempts.map((att) => (
              <tr key={att.attempt_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                  {att.test_title}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  {formatDate(att.submitted_at)}
                </td>
                <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">
                  {att.total_score} <span className="text-xs text-slate-400 font-normal">/ {att.max_possible}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    {att.percentile.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                  #{att.rank}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => router.push(`/test/${att.test_id}/result/${att.attempt_id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-450"
                  >
                    Review
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
