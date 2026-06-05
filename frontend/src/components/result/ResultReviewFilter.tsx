import React from 'react';
import { ReviewFilter, SubjectFilter } from '../../lib/types/result';

interface ResultReviewFilterProps {
  currentFilter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  currentSubject: SubjectFilter;
  onSubjectChange: (subject: SubjectFilter) => void;
}

export default function ResultReviewFilter({
  currentFilter,
  onFilterChange,
  currentSubject,
  onSubjectChange,
}: ResultReviewFilterProps) {
  const filters: { value: ReviewFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All Questions', color: 'border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800' },
    { value: 'correct', label: 'Correct', color: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800/40 dark:text-emerald-400 dark:bg-emerald-950/20' },
    { value: 'incorrect', label: 'Incorrect', color: 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800/40 dark:text-rose-400 dark:bg-rose-950/20' },
    { value: 'unattempted', label: 'Unattempted', color: 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800/40 dark:text-amber-400 dark:bg-amber-950/20' },
    { value: 'marked', label: 'Marked', color: 'border-indigo-300 text-indigo-700 bg-indigo-50 dark:border-indigo-800/40 dark:text-indigo-400 dark:bg-indigo-950/20' },
  ];

  const subjects: { value: SubjectFilter; label: string }[] = [
    { value: 'all', label: 'All Subjects' },
    { value: 'PHYSICS', label: 'Physics' },
    { value: 'CHEMISTRY', label: 'Chemistry' },
    { value: 'MATHS', label: 'Maths' },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
      {/* Subject Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
          Filter by Subject
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((sub) => {
            const isActive = currentSubject === sub.value;
            return (
              <button
                key={sub.value}
                onClick={() => onSubjectChange(sub.value)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all border ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Response Status Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = currentFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all border ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
