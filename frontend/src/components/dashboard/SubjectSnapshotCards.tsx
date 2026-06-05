import React from 'react';
import { useRouter } from 'next/navigation';
import { OverviewData } from '../../lib/types/analytics';

interface SubjectSnapshotCardsProps {
  averages: OverviewData['subject_averages'];
}

export default function SubjectSnapshotCards({ averages }: SubjectSnapshotCardsProps) {
  const router = useRouter();

  const subjects = [
    {
      name: 'Physics',
      key: 'physics' as const,
      avgScore: averages.physics.avg_score,
      accuracy: averages.physics.avg_accuracy,
      color: 'indigo',
      borderStyle: 'border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-850 dark:text-indigo-400',
      barStyle: 'bg-indigo-500',
    },
    {
      name: 'Chemistry',
      key: 'chemistry' as const,
      avgScore: averages.chemistry.avg_score,
      accuracy: averages.chemistry.avg_accuracy,
      color: 'emerald',
      borderStyle: 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-850 dark:text-emerald-400',
      barStyle: 'bg-emerald-500',
    },
    {
      name: 'Maths',
      key: 'maths' as const,
      avgScore: averages.maths.avg_score,
      accuracy: averages.maths.avg_accuracy,
      color: 'orange',
      borderStyle: 'border-orange-100 dark:border-orange-950/40 bg-orange-50/20 dark:bg-orange-950/10 text-orange-850 dark:text-orange-400',
      barStyle: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {subjects.map((sub) => (
        <div
          key={sub.name}
          onClick={() => router.push(`/analytics/subject/${sub.key}`)}
          className={`group cursor-pointer rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition hover:shadow-md ${sub.borderStyle}`}
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">{sub.name}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:underline">
                Details →
              </span>
            </div>
            <div className="text-3.5xl font-black mt-2 tracking-tight">
              {sub.avgScore.toFixed(1)}
              <span className="text-xs font-semibold text-slate-400 ml-1.5">Avg Score</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-450">Average Accuracy</span>
              <span className="font-bold">{sub.accuracy.toFixed(0)}%</span>
            </div>
            {/* Custom progress bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${sub.barStyle}`}
                style={{ width: `${sub.accuracy}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
