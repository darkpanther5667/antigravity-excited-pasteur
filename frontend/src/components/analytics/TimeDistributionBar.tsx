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
} from 'recharts';

interface TimeDistributionBarProps {
  distribution: { bucket: string; count: number }[];
}

export default function TimeDistributionBar({ distribution }: TimeDistributionBarProps) {
  // Sort or mapping if necessary, but backend usually returns ordered buckets.
  const chartData = distribution.map(d => ({
    bucket: d.bucket,
    questions: d.count,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Time Distribution Profile
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
          See the density of questions solved across different timing brackets
        </p>
      </div>

      <div className="h-[250px] w-full text-xs font-semibold select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" />
            <XAxis
              dataKey="bucket"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              tickFormatter={(v) => Math.round(v).toString()}
              axisLine={false}
              dx={-5}
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
              formatter={(value: unknown) => [`${String(value || '')} Questions`, 'Count']}
            />
            <Bar
              dataKey="questions"
              fill="#6366f1" // indigo-500
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
