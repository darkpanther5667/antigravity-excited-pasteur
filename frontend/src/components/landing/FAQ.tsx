"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Is the testing interface similar to the actual JEE exam?',
    answer:
      'Yes. Our attempt interface is modeled precisely on the computer-based testing interface used by the National Testing Agency (NTA). This includes exact layout behaviors, section tabs, color palette keys (Not Visited, Not Answered, Answered, Marked for Review, Answered & Marked), and timing mechanics.',
  },
  {
    question: 'Does it support both JEE Main and Advanced patterns?',
    answer:
      'Absolutely. We support the standard 75-question JEE Main pattern (including Single Choice and Numerical Value questions with correct positive/negative mark allocations) as well as the JEE Advanced pattern, which features multi-select answers, integer grid matching, and matrix-match lists.',
  },
  {
    question: 'What do I get in the free plan?',
    answer:
      'The Free plan provides 3 full-length mock papers, complete NTA simulator access, and basic score reports. It is designed to let you evaluate the test series environment without paying anything up front.',
  },
  {
    question: 'What extra analysis comes in the PRO plan?',
    answer:
      'The PRO plan unlocks conceptual gap profiling (to categorize your concepts by accuracy), detailed pacing charts showing seconds spent per question, syllabus coverage trackers, and unlimited access to the full mock test catalog.',
  },
  {
    question: 'Who should upgrade to the ELITE plan?',
    answer:
      'ELITE is designed for serious droppers, students targeting IIT/NIT admissions, and parents who want to track objective progress. It unlocks topper benchmark comparisons, detailed performance reports, and automated score updates delivered directly to parents via WhatsApp.',
  },
  {
    question: 'Can I review solutions after submitting a test?',
    answer:
      'Yes, every test includes step-by-step written explanations for all questions, formatted with crisp LaTeX rendering via MathJax 3. You can filter the solutions log by subject, chapter, or question status to review your mistakes immediately.',
  },
  {
    question: 'Is this platform useful for droppers?',
    answer:
      'Droppers will find this platform particularly useful. With the conceptual gap diagnostics and chapter accuracy tracking, you can quickly locate remaining weaknesses and target your daily practice, rather than wasting time repeating chapters you already know.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white dark:bg-[#0d1117]">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
            Common Questions.
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
            Everything you need to know about mock tests, analytics, and plans.
          </p>
        </motion.div>

        <div className="space-y-2">
          {faqData.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#161a22]"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
