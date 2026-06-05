'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: 'Analytics Overview', href: '/analytics/overview', icon: '📊' },
    { label: 'Physics Breakdown', href: '/analytics/subject/physics', icon: '⚛️' },
    { label: 'Chemistry Breakdown', href: '/analytics/subject/chemistry', icon: '🧪' },
    { label: 'Maths Breakdown', href: '/analytics/subject/maths', icon: '📐' },
    { label: 'SWOT Diagnostic', href: '/analytics/swot', icon: '🎯' },
    { label: 'Time & Speed Analysis', href: '/analytics/time-analysis', icon: '⏱️' },
    { label: 'Progress Trend', href: '/analytics/progress', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar / Horizontal scroll tabs */}
        <aside className="w-full lg:w-64 shrink-0">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-col gap-1.5 sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
              Performance Navigation
            </p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/15 dark:bg-indigo-500'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-205 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile / Tablet Horizontal Navigation */}
          <nav className="flex lg:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-sm overflow-x-auto gap-1.5 scrollbar-none">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold whitespace-nowrap tracking-wide transition-all shrink-0 border ${
                    isActive
                      ? 'bg-indigo-650 border-indigo-650 text-white dark:bg-indigo-500 dark:border-indigo-500'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-450 dark:hover:text-slate-250 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Analytics Main View */}
        <section className="flex-1 min-w-0">
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-12">
        <p>&copy; {new Date().getFullYear()} JEE mock tests analytics engine. Prep smarter, score higher.</p>
      </footer>
    </div>
  );
}
