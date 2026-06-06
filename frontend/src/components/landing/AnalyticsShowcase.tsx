"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type TabKey = 'coverage' | 'gaps' | 'compare';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'coverage', label: 'Syllabus Coverage' },
  { key: 'gaps', label: 'Weak Areas' },
  { key: 'compare', label: 'Benchmarking' },
];

const chapterData: Record<TabKey, {
  subjects: { name: string; chapters: { name: string; accuracy: number; level: 'strong' | 'border' | 'weak' }[] }[]
}> = {
  coverage: {
    subjects: [
      {
        name: 'Physics',
        chapters: [
          { name: 'Electrostatics', accuracy: 92, level: 'strong' },
          { name: 'Kinematics', accuracy: 85, level: 'strong' },
          { name: 'Magnetism', accuracy: 68, level: 'border' },
          { name: 'Rotational Dynamics', accuracy: 35, level: 'weak' },
        ],
      },
      {
        name: 'Chemistry',
        chapters: [
          { name: 'Mole Concept', accuracy: 95, level: 'strong' },
          { name: 'Chemical Bonding', accuracy: 81, level: 'strong' },
          { name: 'Thermodynamics', accuracy: 42, level: 'weak' },
          { name: 'Coordination Chem', accuracy: 55, level: 'border' },
        ],
      },
      {
        name: 'Mathematics',
        chapters: [
          { name: 'Limits & Continuity', accuracy: 88, level: 'strong' },
          { name: 'Matrices & Determinants', accuracy: 76, level: 'border' },
          { name: 'Probability', accuracy: 30, level: 'weak' },
          { name: 'Vector Algebra', accuracy: 83, level: 'strong' },
        ],
      },
    ],
  },
  gaps: {
    subjects: [
      {
        name: 'Priority',
        chapters: [
          { name: 'Conceptual Gaps (Below 50%)', accuracy: 30, level: 'weak' },
          { name: 'Speed Drills Needed (Slow but Accurate)', accuracy: 76, level: 'border' },
          { name: 'Pacing Traps (Slow + Inaccurate)', accuracy: 42, level: 'weak' },
          { name: 'Strong Areas (Above 80%)', accuracy: 92, level: 'strong' },
        ],
      },
      {
        name: 'Recommendation',
        chapters: [
          { name: 'Review Thermodynamics fundamentals', accuracy: 42, level: 'weak' },
          { name: 'Practice Rotational Dynamics problems', accuracy: 35, level: 'weak' },
          { name: 'Speed drills for Chemical Bonding', accuracy: 76, level: 'border' },
          { name: 'Maintain Electrostatics & Limits', accuracy: 92, level: 'strong' },
        ],
      },
    ],
  },
  compare: {
    subjects: [
      {
        name: 'Metric',
        chapters: [
          { name: 'Total Score', accuracy: 71, level: 'border' },
          { name: 'Avg Time per Physics Q', accuracy: 75, level: 'border' },
          { name: 'Chemistry Accuracy', accuracy: 81, level: 'strong' },
          { name: 'Unforced Errors per Test', accuracy: 65, level: 'weak' },
        ],
      },
      {
        name: 'Target',
        chapters: [
          { name: 'Topper Benchmark', accuracy: 95, level: 'strong' },
          { name: 'Target Time', accuracy: 90, level: 'strong' },
          { name: 'Target Accuracy', accuracy: 96, level: 'strong' },
          { name: 'Target Errors', accuracy: 90, level: 'strong' },
        ],
      },
    ],
  },
};

const levelStyles = {
  strong: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  border: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  weak: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const levelBar = {
  strong: 'bg-emerald-600',
  border: 'bg-amber-500',
  weak: 'bg-red-500',
};

export default function AnalyticsShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('coverage');

  const currentData = chapterData[activeTab];

  return (
    <section id="analytics" className="py-20 md:py-28 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="max-w-2xl mb-12"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
            Performance Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
            Know Exactly Where to Improve.
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg">
            A score alone tells you nothing. Our analytics break down your performance by chapter,
            identify conceptual gaps, and benchmark your speed against topper averages.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit mx-auto lg:mx-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-[180ms] ease-in-out motion-reduce:transition-none ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-[#161a22] text-brand-800 dark:text-brand-300 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-gray-50/50 dark:bg-[#11151d]/30 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentData.subjects.map((subject) => (
                <div key={subject.name}>
                  <h4 className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider mb-4">
                    {subject.name}
                  </h4>
                  <div className="space-y-2.5">
                    {subject.chapters.map((ch) => (
                      <div
                        key={ch.name}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-[#161a22] border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {ch.name}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${levelStyles[ch.level]}`}>
                              {ch.accuracy}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${levelBar[ch.level]} transition-all duration-500`}
                              style={{ width: `${ch.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
