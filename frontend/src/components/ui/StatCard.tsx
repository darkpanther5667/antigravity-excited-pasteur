import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </h4>
        </div>
        {icon && (
          <div className="rounded-lg p-2.5 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      {(trend || description) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend.value}
            </span>
          )}
          {trend?.label && (
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {trend.label}
            </span>
          )}
          {description && !trend && (
            <span className="text-slate-500 dark:text-slate-400 leading-snug">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
