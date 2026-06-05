import React from 'react';
import { useRouter } from 'next/navigation';
import { OverviewData } from '../../lib/types/analytics';
import { useAuth } from '../providers/AuthContext';
import { canAccess } from '../../lib/planUtils';

interface SuggestedActionsProps {
  data: OverviewData;
}

export default function SuggestedActions({ data }: SuggestedActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const hasPro = canAccess(user?.plan, 'PRO');

  const actions = [];

  // Weakest subject revision action
  if (data.weakest_subject) {
    const subName = data.weakest_subject.charAt(0).toUpperCase() + data.weakest_subject.slice(1);
    actions.push({
      title: `Revise ${subName} Concepts`,
      description: `Your average accuracy is lowest in ${subName}. Let's focus on weak chapters and clear basic concepts.`,
      actionText: 'View Subject Breakdown',
      onClick: () => router.push(`/analytics/subject/${data.weakest_subject.toLowerCase()}`),
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    });
  }

  // Trend-based action
  if (data.recent_trend === 'declining') {
    actions.push({
      title: 'Analyze Score Dip',
      description: 'Your scores show a declining trend recently. Review your mistakes to avoid repeating them in future mocks.',
      actionText: 'Mistake Review List',
      onClick: () => router.push('/analytics/progress'),
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-950/30',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    });
  } else {
    // Time efficiency action
    actions.push({
      title: 'Optimize Section Timing',
      description: 'JEE scoring depends heavily on time management. Inspect your per-question speed breakdown.',
      actionText: 'Analyze Section Speeds',
      onClick: () => router.push('/analytics/time-analysis'),
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/30',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  // SWOT gate suggestion
  if (!hasPro) {
    actions.push({
      title: 'Unlock SWOT Profiling',
      description: 'Get deep AI-driven analyses on your Strengths, Weaknesses, Opportunities, and Exam Threats.',
      actionText: 'Upgrade Tier Now',
      onClick: () => router.push('/dashboard?upgrade=true'),
      iconColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-950/30',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    });
  } else {
    actions.push({
      title: 'Check Your SWOT Matrix',
      description: 'Review your personalized patterns, weak subject targets, and prioritized action guidelines.',
      actionText: 'Open SWOT Insights',
      onClick: () => router.push('/analytics/swot'),
      iconColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-950/30',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
        Personalized Study Guide
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act) => (
          <div
            key={act.title}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md h-full"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${act.iconColor}`}>
                  {act.icon}
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {act.title}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {act.description}
              </p>
            </div>
            <button
              onClick={act.onClick}
              className="w-full text-center py-2 border border-indigo-200 dark:border-indigo-950/40 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition"
            >
              {act.actionText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
