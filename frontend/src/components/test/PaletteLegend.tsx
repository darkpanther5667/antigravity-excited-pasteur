'use client';

import React from 'react';

interface PaletteItem {
  color: string;       // Tailwind bg class
  border?: string;     // Tailwind border class
  label: string;
  count: number;
}

interface PaletteLegendProps {
  notVisited: number;
  visited: number;
  answered: number;
  marked: number;
  answeredMarked: number;
}

export const PaletteLegend: React.FC<PaletteLegendProps> = ({
  notVisited,
  visited,
  answered,
  marked,
  answeredMarked,
}) => {
  const items: PaletteItem[] = [
    { color: 'bg-green-500', label: 'Answered', count: answered },
    { color: 'bg-red-100', border: 'border border-red-400', label: 'Not Answered', count: visited },
    { color: 'bg-white', border: 'border-2 border-slate-300', label: 'Not Visited', count: notVisited },
    { color: 'bg-violet-500', label: 'Marked for Review', count: marked },
    {
      color: 'bg-violet-500',
      label: 'Answered & Marked',
      count: answeredMarked,
    },
  ];

  return (
    <div className="border-t border-slate-200 pt-4 mt-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Legend
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="relative shrink-0">
              <div
                className={[
                  'w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center',
                  item.color,
                  item.border ?? '',
                ].join(' ')}
              />
              {item.label === 'Answered & Marked' && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
              )}
            </div>
            <span className="text-xs text-slate-700">
              {item.label}{' '}
              <span className="font-semibold text-slate-900">({item.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
