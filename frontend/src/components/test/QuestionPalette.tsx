'use client';

import React from 'react';
import type { PaletteEntry, SectionName, ResponseStatus } from '../../lib/types/attempt';

interface QuestionPaletteProps {
  palette: PaletteEntry[];
  activeIndex: number;
  onQuestionClick: (globalIndex: number) => void;
}

// NTA color scheme for palette
const STATUS_STYLES: Record<ResponseStatus, string> = {
  NOT_VISITED: 'bg-white border-2 border-slate-300 text-slate-600',
  VISITED: 'bg-red-100 border-2 border-red-400 text-red-700',
  ANSWERED: 'bg-green-500 border-2 border-green-600 text-white',
  MARKED: 'bg-violet-500 border-2 border-violet-600 text-white',
  ANSWERED_MARKED: 'bg-violet-500 border-2 border-violet-600 text-white relative',
};

// Active (current question) overlay
const ACTIVE_RING = 'ring-2 ring-offset-1 ring-blue-500 scale-110';

const SECTION_LABEL_COLORS: Record<SectionName, string> = {
  PHYSICS: 'text-blue-700 bg-blue-50 border-blue-200',
  CHEMISTRY: 'text-green-700 bg-green-50 border-green-200',
  MATHS: 'text-orange-700 bg-orange-50 border-orange-200',
};

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  palette,
  activeIndex,
  onQuestionClick,
}) => {
  // Group palette by section
  const grouped: Record<string, PaletteEntry[]> = {};
  for (const entry of palette) {
    if (!grouped[entry.section]) grouped[entry.section] = [];
    grouped[entry.section].push(entry);
  }

  const sections = Object.keys(grouped) as SectionName[];

  return (
    <div className="flex flex-col gap-4" aria-label="Question palette">
      {sections.map((section) => (
        <div key={section}>
          <div className={`text-xs font-semibold px-2 py-1 rounded mb-2 border ${SECTION_LABEL_COLORS[section]}`}>
            {section.charAt(0) + section.slice(1).toLowerCase()}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {grouped[section].map((entry) => {
              const isActive = entry.questionIndex === activeIndex;
              const isAnsweredMarked = entry.status === 'ANSWERED_MARKED';

              return (
                <button
                  key={entry.questionId}
                  onClick={() => onQuestionClick(entry.questionIndex)}
                  aria-label={`Question ${entry.questionIndex + 1} — ${entry.status.replace(/_/g, ' ').toLowerCase()}`}
                  aria-current={isActive ? 'true' : undefined}
                  title={`Q${entry.questionIndex + 1}: ${entry.status.replace(/_/g, ' ')}`}
                  className={[
                    'w-8 h-8 rounded text-xs font-semibold transition-transform transition-colors',
                    STATUS_STYLES[entry.status],
                    isActive ? ACTIVE_RING : '',
                    'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
                  ].join(' ')}
                >
                  {entry.questionIndex + 1}
                  {isAnsweredMarked && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
