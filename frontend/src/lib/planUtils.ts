import { Plan } from './types';

export const PLAN_HIERARCHY: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  ELITE: 2,
};

/**
 * Checks if a user's subscription plan is sufficient to access a resource/feature
 * @param userPlan - The subscription plan of the current user
 * @param requiredPlan - The minimum plan required to access the resource/feature
 */
export function canAccess(userPlan: Plan | undefined, requiredPlan: Plan): boolean {
  if (!userPlan) return false;
  const userWeight = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredWeight = PLAN_HIERARCHY[requiredPlan] ?? 0;
  return userWeight >= requiredWeight;
}

/**
 * Returns a human-readable description/label for a plan
 */
export function getPlanLabel(plan: Plan): string {
  switch (plan) {
    case 'ELITE':
      return 'Elite';
    case 'PRO':
      return 'Pro';
    case 'FREE':
    default:
      return 'Free';
  }
}

/**
 * Returns color classes for plan badges
 */
export function getPlanBadgeStyles(plan: Plan): string {
  switch (plan) {
    case 'ELITE':
      return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm ring-1 ring-purple-500/30';
    case 'PRO':
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm ring-1 ring-orange-500/30';
    case 'FREE':
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  }
}
