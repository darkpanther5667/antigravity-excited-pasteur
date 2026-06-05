"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Shield, BarChart3, BookOpen } from 'lucide-react';

const features = [
  {
    icon: Monitor,
    title: 'Exact NTA Controls',
    description:
      'Every button, tab, and palette color behaves exactly like the real JEE computer-based test. Build muscle memory so nothing distracts you on exam day.',
    color: 'text-brand-600 dark:text-brand-400',
    bgColor: 'bg-brand-50 dark:bg-brand-900/20',
  },
  {
    icon: Shield,
    title: '100% Distraction-Free',
    description:
      'No social feeds. No pop-ups. No clickbait. Just a clean testing environment designed for focused practice. Parent oversight reports included.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: BarChart3,
    title: 'Chapter-Level Analytics',
    description:
      'Know exactly which chapters cost you marks. We track accuracy per topic across Physics, Chemistry, and Mathematics so you can revise what matters.',
    color: 'text-brand-600 dark:text-brand-400',
    bgColor: 'bg-brand-50 dark:bg-brand-900/20',
  },
  {
    icon: BookOpen,
    title: 'Step-by-Step Solutions',
    description:
      'Every question includes a detailed solution rendered in LaTeX. Review your mistakes immediately after each test with clear, faculty-written explanations.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

export default function WhyDifferent() {
  return (
    <section id="features" className="py-20 md:py-28 bg-[#f8f7f4] dark:bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="max-w-2xl mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
            Why This Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
            Built for Serious JEE Preparation.
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg">
            Every feature is designed around one goal: helping you improve your score.
            No gimmicks, no fluff — just focused practice and actionable insights.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className={`h-10 w-10 rounded-lg ${feature.bgColor} flex items-center justify-center ${feature.color} mb-4`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-brand-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* NTA Palette Legend — inline visual proof */}
        <motion.div
          className="mt-10 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px]">
            NTA Status Palette:
          </span>
          {[
            { color: 'bg-white border border-gray-300 dark:border-gray-600 dark:bg-[#161a22]', label: 'Not Visited' },
            { color: 'bg-amber-500', label: 'Not Answered' },
            { color: 'bg-emerald-600', label: 'Answered' },
            { color: 'bg-brand-600', label: 'Marked for Review' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2 text-gray-400 dark:text-gray-500 font-medium">
              <span className={`h-3.5 w-3.5 rounded-sm ${item.color}`} />
              {item.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
