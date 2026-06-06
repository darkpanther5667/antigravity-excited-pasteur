"use client";

import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import WhyDifferent from '../components/landing/WhyDifferent';
import SimulatorMockup from '../components/landing/SimulatorMockup';
import AnalyticsShowcase from '../components/landing/AnalyticsShowcase';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import { motion, useReducedMotion } from 'framer-motion';

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="min-h-screen bg-[#fafaf7] text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-900/10 selection:text-blue-900 dark:selection:bg-brand-400/20 dark:selection:text-brand-200">
      <Header />
      <main className="flex-1">
        <Hero />
        <SimulatorMockup />
        <WhyDifferent />
        <AnalyticsShowcase />

        {/* Student Journey Roadmap Section */}
        <section className="py-16 md:py-24 bg-slate-50/60 dark:bg-slate-950/20 border-t border-slate-200/50 dark:border-slate-850/30">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            
            {/* Section Heading */}
            <motion.div
              className="max-w-2xl text-center md:text-left"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest block mb-2">Student Journey</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                A Systematic Feedback Loop for Revision.
              </h2>
              <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 mt-2">
                Scores improve when you practice systematically. Follow our 4-step path to isolate conceptual weaknesses and plug score leaks.
              </p>
            </motion.div>

            {/* Steps Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              
              {/* Step 1 */}
              <motion.div
                className="relative p-6 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 hover:border-brand-300 dark:hover:border-brand-800/60 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-[180ms] ease-in-out motion-reduce:transition-none motion-reduce:transform-none"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800">01</span>
                <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-900 dark:text-blue-400 text-xs">
                  📝
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Take Free Mock</h4>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Register in seconds and solve a full-length mock paper. Practice time management under identical NTA controls.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="relative p-6 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 hover:border-brand-300 dark:hover:border-brand-800/60 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-[180ms] ease-in-out motion-reduce:transition-none motion-reduce:transform-none"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800">02</span>
                <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-900 dark:text-blue-400 text-xs">
                  📊
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Review Explanations</h4>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Study step-by-step MathJax LaTeX solution steps. Filter questions to isolate where your calculation went wrong.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="relative p-6 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 hover:border-brand-300 dark:hover:border-brand-800/60 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-[180ms] ease-in-out motion-reduce:transition-none motion-reduce:transform-none"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800">03</span>
                <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-900 dark:text-blue-400 text-xs">
                  🗺️
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Review Conceptual Gaps</h4>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Check your chapter-wise accuracy profiles. Spot pacing traps, unforced errors, and syllabus coverage leaks immediately.
                </p>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                className="relative p-6 bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 hover:border-brand-300 dark:hover:border-brand-800/60 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-[180ms] ease-in-out motion-reduce:transition-none motion-reduce:transform-none"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800">04</span>
                <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-900 dark:text-blue-400 text-xs">
                  🎯
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Plug Score Gaps</h4>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Target custom revision on your weaker chapters. Re-test with full mocks to measure rank improvement objectively.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
