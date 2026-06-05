import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthContext';
import { getPlanBadgeStyles, getPlanLabel } from '../../lib/planUtils';
import { Button } from '../ui/Button';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics/overview' },
    { label: 'SWOT Insight', href: '/analytics/swot' },
    { label: 'Time Analysis', href: '/analytics/time-analysis' },
    { label: 'Progress Trend', href: '/analytics/progress' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center w-full shadow-sm">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-slate-800 dark:text-white uppercase">
            JEE <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">PREP</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isTabActive = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold tracking-wide transition-all ${
                  isTabActive
                    ? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right user controls */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {user.name}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getPlanBadgeStyles(user.plan)}`}>
              {getPlanLabel(user.plan)}
            </span>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1.5 py-1.5 px-3">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden xs:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
