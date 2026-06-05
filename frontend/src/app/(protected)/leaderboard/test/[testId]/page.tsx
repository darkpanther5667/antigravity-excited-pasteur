import React from 'react';
import LeaderboardTable from '../../../../../components/leaderboard/LeaderboardTable';

export const metadata = {
  title: 'Test Rankings - Leaderboard',
  description: 'View student scores, percentiles, and subject performance for this JEE Mock Test.',
};

interface TestLeaderboardPageProps {
  params: {
    testId: string;
  };
}

export default function TestLeaderboardPage({ params }: TestLeaderboardPageProps) {
  const { testId } = params;

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <span className="text-[10px] font-extrabold uppercase bg-indigo-600 text-white px-2.5 py-0.5 rounded-md">
          Exam Leaderboard
        </span>
        <h2 className="text-xl font-black mt-2">JEE Mock Test Rankings</h2>
        <p className="text-xs text-slate-400 mt-1">Review student rankings, scores, and subject metrics. Privacy-safe truncated names are displayed.</p>
      </div>

      <LeaderboardTable mode="test" testId={testId} />
    </main>
  );
}
