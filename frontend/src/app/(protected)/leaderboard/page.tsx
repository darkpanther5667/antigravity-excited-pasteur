import React from 'react';
import LeaderboardTable from '../../../components/leaderboard/LeaderboardTable';

export const metadata = {
  title: 'Global Rankings - Leaderboard',
  description: 'View overall student performance and average percentile rankings on the platform.',
};

export default function GlobalLeaderboardPage() {
  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
        <span className="text-[10px] font-extrabold uppercase bg-purple-600 text-white px-2.5 py-0.5 rounded-md">
          Global Board
        </span>
        <h2 className="text-xl font-black mt-2">Overall Student Rankings</h2>
        <p className="text-xs text-slate-400 mt-1">Global ranking based on average percentiles across all completed JEE mocks. Requires taking at least one mock.</p>
      </div>

      <LeaderboardTable mode="global" />
    </main>
  );
}
