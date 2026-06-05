"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import WhyDifferent from '../components/landing/WhyDifferent';
import SimulatorMockup from '../components/landing/SimulatorMockup';
import AnalyticsShowcase from '../components/landing/AnalyticsShowcase';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import { FileText, BarChart3, Target, RefreshCw } from 'lucide-react';

const journeySteps = [
  {
    icon: FileText,
    title: 'Take a Mock Test',
    description:
      'Register in seconds and attempt a full-length NTA-pattern mock. Experience the exact exam interface with realistic timing and section controls.',
  },
  {
    icon: BarChart3,
    title: 'Review Your Performance',
    description:
      'Study step-by-step LaTeX solutions for every question. Filter by subject or chapter to understand where marks were lost.',
  },
  {
    icon: Target,
    title: 'Identify Weak Areas',
    description:
      'Check chapter-wise accuracy profiles. Spot pacing issues, calculation errors, and syllabus gaps that need attention.',
  },
  {
    icon: RefreshCw,
    title: 'Practice & Improve',
    description:
      'Focus revision on your weaker chapters. Retake mocks to measure progress and track percentile improvement over time.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-brand-900 dark:bg-[#0d1117] dark:text-gray-100 font-sans flex flex-col justify-between selection:bg-brand-800/10 selection:text-brand-900 dark:selection:bg-brand-400/20 dark:selection:text-brand-200">
      <Header />
      <main className="flex-1">
        <Hero />
        <SimulatorMockup />
        <WhyDifferent />
        <AnalyticsShowcase />

        {/* Student Journey */}
        <section className="py-20 md:py-28 bg-[#f8f7f4] dark:bg-[#0d1117]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="max-w-2xl mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
                Student Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
                A Systematic Path to Improvement.
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg">
                Scores improve when you practice systematically. Follow our four-step framework
                to identify weak areas and track real progress over time.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {journeySteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="relative bg-white dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <span className="absolute top-4 right-4 text-2xl font-bold text-gray-100 dark:text-gray-800 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-brand-900 dark:text-white mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </motion.div>
              ))}
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
