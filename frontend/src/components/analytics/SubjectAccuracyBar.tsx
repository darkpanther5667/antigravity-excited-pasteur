'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { OverviewData } from '../../lib/types/analytics';

interface SubjectAccuracyBarProps {
  averages: OverviewData['subject_averages'];
}

export default function SubjectAccuracyBar({ averages }: SubjectAccuracyBarProps) {
  const data = [
    {
      subject: 'Physics',
      accuracy: averages.physics.avg_accuracy,
      color: '#4f46e5', // indigo-600
    },
    {
      subject: 'Chemistry',
      accuracy: averages.chemistry.avg_accuracy,
      color: '#10b981', // emerald-500
    },
    {
      subject: 'Maths',
      accuracy: averages.maths.avg_accuracy,
      color: '#f97316', // orange-500
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Subject Accuracy Comparison
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
          Compare your average correct response ratio across the core subjects
        </p>
      </div>

      <div className="h-[250px] w-full text-xs font-semibold select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" />
            <XAxis
              dataKey="subject"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              dx={-5}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
              formatter={(value: unknown) => [`${Number(value || 0).toFixed(1)}%`, 'Accuracy']}
            />
            <Bar
              dataKey="accuracy"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
