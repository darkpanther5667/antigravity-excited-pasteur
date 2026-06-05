"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';

interface MockQuestion {
  id: number;
  subject: string;
  section: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
}

const mockQuestions: MockQuestion[] = [
  {
    id: 1,
    subject: "PHYSICS",
    section: "Section A - Single Choice",
    questionText: "A particle starts from rest and moves with constant acceleration of $5\\text{ m/s}^2$. The distance covered in the first 4 seconds is:",
    options: [
      { key: "a", text: "10 m" },
      { key: "b", text: "40 m" },
      { key: "c", text: "80 m" },
      { key: "d", text: "160 m" }
    ],
    correctAnswer: "b"
  },
  {
    id: 2,
    subject: "CHEMISTRY",
    section: "Section A - Single Choice",
    questionText: "The mass (in grams) of 0.5 moles of CaCO$_3$ is: (Atomic masses: Ca = 40, C = 12, O = 16 g/mol)",
    options: [
      { key: "a", text: "25 g" },
      { key: "b", text: "50 g" },
      { key: "c", text: "100 g" },
      { key: "d", text: "200 g" }
    ],
    correctAnswer: "b"
  },
  {
    id: 3,
    subject: "MATHS",
    section: "Section B - Numerical Value",
    questionText: "If A is a $2 \\times 2$ matrix such that $|A| = 3$, then $|2A| = $ ?",
    options: [],
    correctAnswer: "12"
  }
];

type QStatus = 'NOT_VISITED' | 'VISITED' | 'ANSWERED' | 'MARKED';

export default function SimulatorMockup() {
  const [activeSubject, setActiveSubject] = useState<'PHYSICS' | 'CHEMISTRY' | 'MATHS'>('PHYSICS');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<number, QStatus>>({
    1: 'VISITED', 2: 'NOT_VISITED', 3: 'NOT_VISITED',
    4: 'NOT_VISITED', 5: 'NOT_VISITED', 6: 'NOT_VISITED',
    7: 'NOT_VISITED', 8: 'NOT_VISITED', 9: 'NOT_VISITED', 10: 'NOT_VISITED'
  });

  const activeQuestion = mockQuestions.find(q => q.subject === activeSubject) || mockQuestions[0];

  const handleOptionSelect = (optKey: string) => {
    setSelectedAnswers(prev => ({ ...prev, [activeQuestion.id]: optKey }));
  };

  const handleSaveNext = () => {
    const isAnswered = !!selectedAnswers[activeQuestion.id];
    setQuestionStatus(prev => ({
      ...prev,
      [activeQuestion.id]: isAnswered ? 'ANSWERED' : 'VISITED'
    }));
    if (activeSubject === 'PHYSICS') {
      setActiveSubject('CHEMISTRY');
      setQuestionStatus(prev => ({ ...prev, 2: 'VISITED' }));
    } else if (activeSubject === 'CHEMISTRY') {
      setActiveSubject('MATHS');
      setQuestionStatus(prev => ({ ...prev, 3: 'VISITED' }));
    } else {
      setActiveSubject('PHYSICS');
    }
  };

  const handleMarkReview = () => {
    setQuestionStatus(prev => ({ ...prev, [activeQuestion.id]: 'MARKED' }));
  };

  const handleClear = () => {
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[activeQuestion.id];
      return copy;
    });
    setQuestionStatus(prev => ({ ...prev, [activeQuestion.id]: 'VISITED' }));
  };

  const paletteColor = (status: QStatus, num: number) => {
    const isCurrent = activeQuestion.id === num;
    const base = isCurrent ? 'ring-2 ring-brand-600 dark:ring-brand-400 scale-105' : '';

    switch (status) {
      case 'ANSWERED':
        return `bg-emerald-600 text-white ${base}`;
      case 'VISITED':
        return `bg-amber-500 text-white ${base}`;
      case 'MARKED':
        return `bg-brand-600 text-white ${base}`;
      default:
        return `bg-white dark:bg-[#161a22] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 ${base}`;
    }
  };

  return (
    <section id="simulator" className="py-20 md:py-28 bg-white dark:bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="max-w-2xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-3">
            Exam Simulator
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-900 dark:text-white tracking-tight">
            The Real NTA Testing Environment.
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-lg">
            Same layout. Same controls. Same question palette behavior. Build muscle memory
            for exam day by practicing in an environment that mirrors the real test.
          </p>
        </motion.div>

        {/* Simulator Interface */}
        <motion.div
          className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#161a22] shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Main workspace */}
            <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800">
              {/* Top bar */}
              <div className="bg-gray-50 dark:bg-[#11151d] border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 tracking-wide">JEE MAIN Mock — Paper 1</span>
                <div className="flex items-center gap-2 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md font-mono text-xs text-gray-600 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="font-semibold text-brand-700 dark:text-brand-400">02:44:12</span>
                </div>
              </div>

              {/* Subject Tabs */}
              <div className="flex bg-gray-50/50 dark:bg-[#11151d]/50 border-b border-gray-200 dark:border-gray-800 text-xs font-medium">
                {(['PHYSICS', 'CHEMISTRY', 'MATHS'] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubject(sub)}
                    className={`px-5 py-3 border-r border-gray-200 dark:border-gray-800 transition-all ${
                      activeSubject === sub
                        ? 'bg-white dark:bg-[#161a22] text-brand-700 dark:text-brand-400 border-b-2 border-b-brand-700 dark:border-b-brand-400 font-semibold'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    {sub.charAt(0) + sub.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="p-5 flex-1 min-h-[260px] space-y-4">
                <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span>Question {activeQuestion.id}</span>
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">{activeQuestion.section}</span>
                </div>

                <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                  {activeQuestion.questionText}
                </p>

                {/* Options */}
                {activeQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {activeQuestion.options.map(opt => {
                      const isSelected = selectedAnswers[activeQuestion.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleOptionSelect(opt.key)}
                          className={`text-left px-3.5 py-2.5 rounded-lg border text-sm font-medium flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-900/15 text-brand-800 dark:text-brand-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          }`}
                        >
                          <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {opt.key.toUpperCase()}
                          </span>
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Enter numerical value (e.g. 32)"
                      value={selectedAnswers[activeQuestion.id] || ''}
                      onChange={(e) => handleOptionSelect(e.target.value)}
                      className="w-full max-w-[220px] border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>

              {/* Footer controls */}
              <div className="bg-gray-50 dark:bg-[#11151d] border-t border-gray-200 dark:border-gray-800 p-3 flex justify-between gap-2 text-xs">
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkReview}
                    className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#161a22] hover:bg-gray-50 dark:hover:bg-gray-800/30 text-brand-700 dark:text-brand-400 font-semibold transition-colors"
                  >
                    Mark for Review
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#161a22] hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <button
                  onClick={handleSaveNext}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Save &amp; Next
                </button>
              </div>
            </div>

            {/* Question Palette */}
            <div className="lg:col-span-4 bg-gray-50/30 dark:bg-[#11151d]/20 p-5 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                {/* Candidate info */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Candidate</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Test Taker</span>
                  </div>
                </div>

                {/* Palette grid */}
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 block mb-3 uppercase tracking-wider">Question Palette</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                      const status = questionStatus[num] || 'NOT_VISITED';
                      return (
                        <button
                          key={num}
                          className={`h-8 w-8 text-[11px] font-bold flex items-center justify-center rounded-md transition-all ${paletteColor(status, num)}`}
                          disabled={num > 3}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 shrink-0" />
                      Answered
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 shrink-0" />
                      Not Answered
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand-600 shrink-0" />
                      Marked
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161a22] shrink-0" />
                      Not Visited
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full py-2.5 bg-brand-800 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                  Submit Test Paper
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
