'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressChartProps {
  scoreTrend: { date: string; score: number }[];
  percentileTrend: { date: string; percentile: number }[];
}

export default function ProgressChart({ scoreTrend, percentileTrend }: ProgressChartProps) {
  const [metric, setMetric] = useState<'score' | 'percentile'>('score');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Prepare chart data
  const chartData = metric === 'score'
    ? scoreTrend.map(item => ({
        date: formatDate(item.date),
        value: item.score,
      }))
    : percentileTrend.map(item => ({
        date: formatDate(item.date),
        value: item.percentile,
      }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Chronological Performance Trend
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Monitor mock score improvements and percentiles across consecutive dates
          </p>
        </div>

        {/* Toggle Switches */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-bold border border-slate-205 dark:border-slate-700/60">
          <button
            onClick={() => setMetric('score')}
            className={`rounded-md px-3.5 py-1.5 transition-all ${
              metric === 'score'
                ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Mocks Score (Avg)
          </button>
          <button
            onClick={() => setMetric('percentile')}
            className={`rounded-md px-3.5 py-1.5 transition-all ${
              metric === 'percentile'
                ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Percentile Rank
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[280px] w-full text-xs font-semibold select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" />
            <XAxis
              dataKey="date"
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
              domain={metric === 'score' ? [0, 300] : [0, 100]}
              tickFormatter={(v) => (metric === 'score' ? `${v}M` : `${v}%`)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
              formatter={(value: unknown) => [
                metric === 'score' ? `${Number(value || 0).toFixed(1)} / 300` : `${Number(value || 0).toFixed(2)}%`,
                metric === 'score' ? 'Score' : 'Percentile',
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric === 'score' ? '#4f46e5' : '#8b5cf6'}
              strokeWidth={3}
              dot={{ stroke: metric === 'score' ? '#4f46e5' : '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
