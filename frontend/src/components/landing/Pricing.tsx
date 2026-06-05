"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    tagline: 'Starter',
    price: '0',
    period: 'forever',
    description: 'Try the platform. Attempt a full-length mock and see your baseline score with no commitment.',
    cta: 'Start Free Mock',
    variant: 'outline' as const,
    href: '/register',
    features: [
      { text: '3 Full-Length Mock Exams', included: true },
      { text: 'NTA Simulator Controls', included: true },
      { text: 'Basic Score Reports', included: true },
      { text: 'Chapter-Wise Analysis', included: false },
      { text: 'Topper Benchmarking', included: false },
    ],
  },
  {
    name: 'Pro',
    tagline: 'Recommended',
    price: '999',
    period: 'year',
    description: 'The standard tier for serious aspirants. Unlimited mocks, full analytics, and detailed solutions.',
    cta: 'Upgrade to Pro',
    variant: 'primary' as const,
    href: '/register',
    highlighted: true,
    features: [
      { text: 'Unlimited Mock Tests', included: true },
      { text: 'Full Chapter-Wise Analysis', included: true },
      { text: 'Conceptual Gap Profiling', included: true },
      { text: 'Step-by-Step Solutions (LaTeX)', included: true },
      { text: 'Time & Pacing Analysis', included: true },
    ],
  },
  {
    name: 'Elite',
    tagline: 'Pro + Coaching',
    price: '1799',
    period: 'year',
    description: 'For droppers targeting top percentiles. Includes topper comparison and parent score updates.',
    cta: 'View Elite Plan',
    variant: 'outline' as const,
    href: '/register',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Side-by-Side Topper Comparison', included: true },
      { text: 'Syllabus Gap Warnings', included: true },
      { text: 'WhatsApp Reports for Parents', included: true },
      { text: 'Speed Outlier Alerts', included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#f8f7f4] dark:bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
            Plans & Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
            Simple, Transparent Pricing.
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
            Get full access to NTA-accurate mock tests at a fraction of coaching center costs.
            Start free, upgrade when you need deeper analytics.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border bg-white dark:bg-[#161a22] p-6 md:p-8 ${
                plan.highlighted
                  ? 'border-brand-700 dark:border-brand-500 shadow-lg shadow-brand-900/5 dark:shadow-brand-900/20 scale-[1.02] md:scale-105'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-800 dark:bg-brand-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {plan.tagline}
                </span>
                <h3 className="text-xl font-bold text-brand-900 dark:text-white mt-1">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-brand-900 dark:text-white">
                    ₹{plan.price}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    /{plan.period}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li
                    key={feat.text}
                    className={`flex items-start gap-2.5 text-sm ${
                      feat.included
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${
                        feat.included
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : 'text-gray-200 dark:text-gray-700'
                      }`}
                    >
                      <Check className={`h-4 w-4 ${feat.included ? '' : 'opacity-40'}`} />
                    </span>
                    <span className={feat.included ? '' : 'line-through'}>{feat.text}</span>
                  </li>
                ))}
              </ul>

              {plan.highlighted ? (
                <Link href={plan.href}>
                  <Button className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold h-11 text-sm">
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Link href={plan.href}>
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium h-11 text-sm"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
