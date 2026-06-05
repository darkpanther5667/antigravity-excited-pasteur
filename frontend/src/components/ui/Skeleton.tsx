import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-36" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex space-x-4 py-4 border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-5 ${
            idx === 0 ? 'w-1/4' : idx === 1 ? 'w-1/3' : 'w-1/6'
          }`}
        />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex-1 flex items-end space-x-4 px-2 mb-4">
        {Array.from({ length: 12 }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="w-full"
            style={{
              height: `${Math.floor(Math.random() * 60) + 20}%`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
