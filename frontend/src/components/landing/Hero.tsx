"use client";

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { GraduationCap, BarChart3, Clock, FileText } from 'lucide-react';

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-[#fafaf7] dark:bg-slate-950">
      {/* Subtle warm texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(30,58,95,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(74,123,181,0.06),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            className="lg:col-span-5 space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800/40">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />
              <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 tracking-wide">
                NTA-Pattern Mock Tests
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold text-brand-900 dark:text-white leading-[1.1] tracking-tight">
              JEE Mock Tests
              <br />
              <span className="text-brand-600 dark:text-brand-400">That Feel Real.</span>
            </h1>

            <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 max-w-lg mx-auto lg:mx-0">
              A distraction-free exam simulator built for JEE Main &amp; Advanced aspirants.
              Practice with realistic NTA controls, get chapter-wise analytics, and track
              your progress — no ads, no distractions, just serious preparation.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button className="bg-brand-800 hover:bg-brand-700 text-white font-semibold h-12 px-8 text-sm shadow-lg shadow-brand-900/10 dark:shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-[180ms] ease-in-out active:translate-y-0 active:shadow-md">
                  Try Free Mock Test
                </Button>
              </Link>
              <Link href="#simulator">
                <Button variant="ghost" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium text-sm h-12 px-6">
                  See the Simulator
                </Button>
              </Link>
            </div>

            {/* Trust Strip */}
            <div className="pt-6 border-t border-gray-200/70 dark:border-gray-800/50">
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center lg:text-left"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { icon: GraduationCap, label: 'JEE Pattern', sub: 'Main & Advanced' },
                  { icon: Clock, label: 'Realistic Timing', sub: 'NTA Controls' },
                  { icon: BarChart3, label: 'Chapter Analytics', sub: 'Weak Areas' },
                  { icon: FileText, label: 'Detailed Solutions', sub: 'Step-by-Step' },
                ].map((item) => (
                  <motion.div key={item.label} className="space-y-1" variants={itemVariants}>
                    <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                      <item.icon className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                      <span className="text-[12px] font-semibold text-brand-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.sub}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Exam Simulator Visual */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="relative">
              {/* Subtle glow behind */}
              <div className="absolute -inset-4 bg-gradient-to-b from-brand-200/20 via-transparent to-transparent dark:from-brand-600/10 rounded-3xl blur-2xl" />

              {/* Main exam screen mockup */}
              <div className="relative bg-white dark:bg-[#161a22] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#11151d] border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <span className="ml-3 text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                      JEE MAIN 2026 — Paper 1
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                    <Clock className="h-3 w-3" />
                    <span className="font-semibold text-brand-700 dark:text-brand-400">02:44:12</span>
                  </div>
                </div>

                {/* Subject tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                  {['Physics', 'Chemistry', 'Mathematics'].map((sub, i) => (
                    <button
                      key={sub}
                      className={`px-5 py-2.5 text-[11px] font-medium border-r border-gray-100 dark:border-gray-800 transition-colors ${
                        i === 0
                          ? 'bg-white dark:bg-[#161a22] text-brand-700 dark:text-brand-400 border-b-2 border-b-brand-700 dark:border-b-brand-400'
                          : 'bg-gray-50/50 dark:bg-[#11151d]/50 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* Question area */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Question 1 (Single Correct)
                    </span>
                    <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                      Section A
                    </span>
                  </div>

                  <p className="text-[13px] leading-relaxed text-gray-800 dark:text-gray-200 font-medium mb-4">
                    A ball is dropped from rest from the top of a tower of height 80 m. How long
                    does it take to reach the ground? (Take <span className="italic">g</span> = 10 m/s²)
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'A', text: '2 s' },
                      { key: 'B', text: '4 s', selected: true },
                      { key: 'C', text: '8 s' },
                      { key: 'D', text: '16 s' },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-[13px] font-medium transition-colors ${
                          opt.selected
                            ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            opt.selected
                              ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {opt.key}
                        </span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#11151d] border-t border-gray-100 dark:border-gray-800">
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-400 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-700 rounded-md cursor-default">
                      Mark for Review
                    </span>
                    <span className="px-3 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-700 rounded-md cursor-default">
                      Clear
                    </span>
                  </div>
                  <span className="px-5 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md cursor-default">
                    Save &amp; Next
                  </span>
                </div>
              </div>

              {/* Question Palette mini indicator */}
              <div className="absolute -bottom-3 -right-3 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 hidden sm:block">
                <div className="flex gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <span
                      key={n}
                      className={`h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center ${
                        n === 1
                          ? 'bg-emerald-600 text-white'
                          : n === 2
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-[8px] text-gray-400 dark:text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-600" /> Answered</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500" /> Not Answered</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gray-200 dark:bg-gray-700" /> Not Visited</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
