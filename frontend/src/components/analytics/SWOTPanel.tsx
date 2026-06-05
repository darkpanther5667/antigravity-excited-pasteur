import React from 'react';
import { SWOTData, SWOTItem } from '../../lib/types/analytics';

interface SWOTPanelProps {
  data: SWOTData;
}

export default function SWOTPanel({ data }: SWOTPanelProps) {
  const renderSWOTSection = (
    title: string,
    items: SWOTItem[],
    colorStyles: { border: string; headerText: string; bg: string; badge: string; icon: React.ReactNode }
  ) => {
    return (
      <div className={`rounded-2xl border ${colorStyles.border} ${colorStyles.bg} p-5 flex flex-col justify-between shadow-sm`}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            {colorStyles.icon}
            <h4 className={`font-black text-sm uppercase tracking-wider ${colorStyles.headerText}`}>
              {title}
            </h4>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No SWOT patterns identified in this quadrant yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/60 shadow-xxs"
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-205">
                      {item.label}
                    </span>
                    {item.accuracy !== undefined && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${colorStyles.badge}`}>
                        {item.accuracy.toFixed(0)}% Accuracy
                      </span>
                    )}
                  </div>
                  <p className="text-xxs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                    {item.insight}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const strengthsIcon = (
    <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );

  const weaknessesIcon = (
    <div className="p-1.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  );

  const opportunitiesIcon = (
    <div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
  );

  const threatsIcon = (
    <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSWOTSection('Strengths (Revise Less)', data.strengths, {
          border: 'border-emerald-100 dark:border-emerald-950/30',
          headerText: 'text-emerald-800 dark:text-emerald-400',
          bg: 'bg-emerald-50/15 dark:bg-emerald-950/5',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-450',
          icon: strengthsIcon,
        })}

        {renderSWOTSection('Weaknesses (Needs Focus)', data.weaknesses, {
          border: 'border-rose-100 dark:border-rose-950/30',
          headerText: 'text-rose-800 dark:text-rose-455',
          bg: 'bg-rose-50/15 dark:bg-rose-950/5',
          badge: 'bg-rose-100 text-rose-850 dark:bg-rose-950/35 dark:text-rose-400',
          icon: weaknessesIcon,
        })}

        {renderSWOTSection('Opportunities (Quick Wins)', data.opportunities, {
          border: 'border-indigo-100 dark:border-indigo-950/30',
          headerText: 'text-indigo-800 dark:text-indigo-400',
          bg: 'bg-indigo-50/15 dark:bg-indigo-950/5',
          badge: 'bg-indigo-100 text-indigo-805 dark:bg-indigo-950/35 dark:text-indigo-400',
          icon: opportunitiesIcon,
        })}

        {renderSWOTSection('Threats (Watch Pacing)', data.threats, {
          border: 'border-amber-100 dark:border-amber-950/30',
          headerText: 'text-amber-800 dark:text-amber-400',
          bg: 'bg-amber-50/15 dark:bg-amber-950/5',
          badge: 'bg-amber-100 text-amber-805 dark:bg-amber-950/35 dark:text-amber-400',
          icon: threatsIcon,
        })}
      </div>

      {/* Priority Action Callout */}
      {data.priority_action && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-indigo-200 shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Priority Action Plan
              </h4>
              <p className="text-sm font-semibold leading-relaxed">
                {data.priority_action}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
