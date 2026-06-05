'use client';

import React, { useState } from 'react';
import { HeatmapEntry } from '../../lib/types/analytics';

interface ChapterHeatmapProps {
  heatmap: HeatmapEntry[];
}

export default function ChapterHeatmap({ heatmap }: ChapterHeatmapProps) {
  const [filterSubject, setFilterSubject] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'MATHS'>('ALL');

  // Filter entries
  const filteredEntries = heatmap.filter(entry => {
    if (filterSubject === 'ALL') return true;
    return entry.subject.toUpperCase() === filterSubject;
  });

  const getHeatStyles = (entry: HeatmapEntry) => {
    if (entry.insufficient_data || entry.attempted === 0) {
      return {
        bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300',
        label: 'Insufficient Data',
        dot: 'bg-slate-400',
      };
    }

    switch (entry.heat_level) {
      case 5:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/15 dark:border-emerald-900/45 dark:text-emerald-400',
          label: 'Mastered',
          dot: 'bg-emerald-500',
        };
      case 4:
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-900 dark:bg-teal-950/15 dark:border-teal-900/45 dark:text-teal-400',
          label: 'Good Accuracy',
          dot: 'bg-teal-500',
        };
      case 3:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/15 dark:border-amber-900/45 dark:text-amber-400',
          label: 'Moderate',
          dot: 'bg-amber-500',
        };
      case 2:
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/15 dark:border-orange-900/45 dark:text-orange-400',
          label: 'Weak Accuracy',
          dot: 'bg-orange-500',
        };
      case 1:
      default:
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/15 dark:border-rose-900/45 dark:text-rose-450',
          label: 'Critical Priority',
          dot: 'bg-rose-500',
        };
    }
  };

  const subjects = [
    { value: 'ALL' as const, label: 'All Subjects' },
    { value: 'PHYSICS' as const, label: 'Physics' },
    { value: 'CHEMISTRY' as const, label: 'Chemistry' },
    { value: 'MATHS' as const, label: 'Maths' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Chapter Accuracy Heatmap
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Visual breakdown of topic confidence levels across the syllabus
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
          {subjects.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterSubject(s.value)}
              className={`rounded-md px-3.5 py-1.5 transition-all ${
                filterSubject === s.value
                  ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-505 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-450 border-y border-slate-100 dark:border-slate-800 py-3">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Excellent (&gt;80%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500" /> Good (70-80%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate (55-70%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> Low (40-55%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Critical (&lt;40%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Insufficient Data</span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredEntries.map((entry, idx) => {
          const style = getHeatStyles(entry);
          return (
            <div
              key={`${entry.subject}-${entry.chapter}-${idx}`}
              className={`rounded-xl border p-4 flex flex-col justify-between transition hover:shadow-sm ${style.bg}`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/70 dark:bg-slate-950/30 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/5">
                    {entry.subject}
                  </span>
                  <span className="text-[9px] font-semibold flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs tracking-tight line-clamp-2">
                  {entry.chapter}
                </h4>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-end text-[10px] font-bold">
                <div className="text-slate-500 dark:text-slate-400">
                  Attempted:{' '}
                  <span className="text-slate-800 dark:text-slate-200">
                    {entry.attempted}
                  </span>
                </div>
                <div className="text-right">
                  {entry.insufficient_data ? (
                    <span className="text-slate-400 font-medium">N/A</span>
                  ) : (
                    <span className="text-xs font-black">
                      {entry.accuracy.toFixed(0)}% Accuracy
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
