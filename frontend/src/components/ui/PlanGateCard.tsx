import React from 'react';
import { Button } from './Button';
import { Plan } from '../../lib/types';
import { getPlanLabel } from '../../lib/planUtils';

interface PlanGateCardProps {
  requiredPlan: Plan;
  featureName: string;
  description?: string;
  onUpgradeClick?: () => void;
}

export default function PlanGateCard({
  requiredPlan,
  featureName,
  description = 'This feature contains advanced analytics, pattern insights, and SWOT profiling to help you improve your score.',
  onUpgradeClick,
}: PlanGateCardProps) {
  const planLabel = getPlanLabel(requiredPlan);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition-all dark:border-slate-800 dark:bg-slate-900/50">
      {/* Decorative Gradient Background */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        {/* Lock Icon Wrapper */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/50 dark:text-indigo-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Feature & Badge */}
        <div className="mb-2 flex items-center gap-2 flex-wrap justify-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {featureName}
          </h3>
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm ring-1 ring-orange-500/30">
            {planLabel} Required
          </span>
        </div>

        {/* Description */}
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onUpgradeClick || (() => window.location.href = '/dashboard?upgrade=true')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 font-semibold px-6 py-2"
          >
            Upgrade to {planLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
