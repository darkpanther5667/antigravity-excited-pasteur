import React from 'react';
import { CompareData } from '../../lib/types/analytics';

interface TopperComparePanelProps {
  data: CompareData;
}

export default function TopperComparePanel({ data }: TopperComparePanelProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 60) {
      const h = Math.floor(m / 60);
      const remainingMins = m % 60;
      return `${h}h ${remainingMins}m`;
    }
    return `${m}m ${s}s`;
  };

  const gapAnalysis = data.gap_analysis;

  return (
    <div className="space-y-8">
      {/* Overview Side-by-Side Compare */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          Core Metrics Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Score */}
          <div className="flex flex-col items-center text-center py-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Overall Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 dark:text-white">{data.student.total_score}</span>
              <span className="text-xs text-slate-400 font-bold">vs</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{data.topper.total_score}</span>
            </div>
            <span className="text-xxs font-bold text-slate-500 mt-2 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded">
              Gap: {gapAnalysis.score_gap > 0 ? `+${gapAnalysis.score_gap}` : gapAnalysis.score_gap} Marks
            </span>
          </div>

          {/* Percentile */}
          <div className="flex flex-col items-center text-center py-2 md:pl-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Percentile</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 dark:text-white">{data.student.percentile.toFixed(1)}%</span>
              <span className="text-xs text-slate-400 font-bold">vs</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{data.topper.percentile.toFixed(2)}%</span>
            </div>
            <span className="text-xxs font-bold text-slate-500 mt-2 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded">
              Rank: #{data.student.rank || 'N/A'} vs #{data.topper.rank || 1}
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex flex-col items-center text-center py-2 md:pl-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Accuracy</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 dark:text-white">{data.student.accuracy.toFixed(0)}%</span>
              <span className="text-xs text-slate-400 font-bold">vs</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{data.topper.accuracy.toFixed(0)}%</span>
            </div>
            <span className="text-xxs font-bold text-slate-500 mt-2 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded">
              Gap: {(data.topper.accuracy - data.student.accuracy).toFixed(0)}% lower
            </span>
          </div>

          {/* Time Taken */}
          <div className="flex flex-col items-center text-center py-2 md:pl-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Duration</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{formatDuration(data.student.time_taken_seconds)}</span>
              <span className="text-xs text-slate-400 font-bold">vs</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatDuration(data.topper.time_taken_seconds)}</span>
            </div>
            <span className="text-xxs font-bold text-slate-500 mt-2 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded">
              {gapAnalysis.time_gap_seconds > 0 ? `${formatDuration(gapAnalysis.time_gap_seconds)} slower` : 'Faster than topper'}
            </span>
          </div>
        </div>
      </div>

      {/* Section Gaps */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Subject-wise Marks Gap
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Your Score</th>
                <th className="px-6 py-3.5">Topper Score</th>
                <th className="px-6 py-3.5 text-right">Marks Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
              <tr>
                <td className="px-6 py-4 font-bold text-slate-905 dark:text-slate-200">Physics</td>
                <td className="px-6 py-4">{data.student.physics_score}</td>
                <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400">{data.topper.physics_score}</td>
                <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-405">{gapAnalysis.physics_gap} Marks</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-slate-905 dark:text-slate-200">Chemistry</td>
                <td className="px-6 py-4">{data.student.chemistry_score}</td>
                <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400">{data.topper.chemistry_score}</td>
                <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-405">{gapAnalysis.chemistry_gap} Marks</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-slate-905 dark:text-slate-200">Mathematics</td>
                <td className="px-6 py-4">{data.student.maths_score}</td>
                <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400">{data.topper.maths_score}</td>
                <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-405">{gapAnalysis.maths_gap} Marks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Weak Chapters vs Topper Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Critical Chapter Gap Analysis
          </h3>
          <p className="text-xxs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
            Chapters where the topper outperformed you. Prioritize these during revision.
          </p>
        </div>
        {gapAnalysis.weak_vs_topper.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            No significant chapter gaps found compared to the topper. Fantastic job!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Chapter</th>
                  <th className="px-6 py-3.5">Your Accuracy</th>
                  <th className="px-6 py-3.5">Topper Accuracy</th>
                  <th className="px-6 py-3.5 text-right">Accuracy Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                {gapAnalysis.weak_vs_topper.map((gap) => (
                  <tr key={gap.chapter} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 font-bold text-slate-805 dark:text-slate-200 max-w-[250px] truncate">{gap.chapter}</td>
                    <td className="px-6 py-4">{gap.student_accuracy.toFixed(0)}%</td>
                    <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400">{gap.topper_accuracy.toFixed(0)}%</td>
                    <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-405">-{gap.gap.toFixed(0)}%</td>
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
