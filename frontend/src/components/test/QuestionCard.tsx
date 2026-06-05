'use client';

import React from 'react';
import type { AttemptQuestion, AnswerDraft } from '../../lib/types/attempt';
import { MathText } from '../ui/MathText';
import { SingleChoice } from './ResponseInput/SingleChoice';
import { MultiChoice } from './ResponseInput/MultiChoice';
import { IntegerInput } from './ResponseInput/IntegerInput';
import { MatrixInput } from './ResponseInput/MatrixInput';

interface QuestionCardProps {
  question: AttemptQuestion;
  draft: AnswerDraft | null;
  onDraftChange: (questionId: string, value: string | null) => void;
  globalIndex: number;
  totalQuestions: number;
  disabled?: boolean;
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  SINGLE: { label: 'Single Correct', color: 'bg-blue-100 text-blue-800' },
  MULTI: { label: 'Multi Correct', color: 'bg-violet-100 text-violet-800' },
  INTEGER: { label: 'Numerical', color: 'bg-amber-100 text-amber-800' },
  MATRIX: { label: 'Matrix Match', color: 'bg-teal-100 text-teal-800' },
};

function buildOptions(question: AttemptQuestion) {
  const labels = ['A', 'B', 'C', 'D'];
  const texts = [question.option_a, question.option_b, question.option_c, question.option_d];
  return labels.map((label, i) => ({
    label,
    value: label,
    text: texts[i],
  })).filter((opt) => opt.text !== null && opt.text !== undefined);
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  draft,
  onDraftChange,
  globalIndex,
  totalQuestions,
  disabled = false,
}) => {
  const badge = TYPE_BADGE[question.type] ?? { label: question.type, color: 'bg-slate-100 text-slate-700' };
  const options = buildOptions(question);

  // Derive multi-choice array from comma-separated string
  const selectedMulti = (() => {
    if (question.type !== 'MULTI') return [];
    if (!draft?.selectedAnswer) return [];
    return draft.selectedAnswer.split(',').filter(Boolean);
  })();

  const handleMultiChange = (values: string[]) => {
    onDraftChange(question.id, values.length > 0 ? values.join(',') : null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">
            Q{globalIndex + 1} / {totalQuestions}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
          {question.difficulty && (
            <span className="text-xs text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
              {question.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {question.subject && (
            <span className="border border-slate-200 px-2 py-0.5 rounded-full">
              {question.subject}
            </span>
          )}
          {question.chapter && (
            <span className="border border-slate-200 px-2 py-0.5 rounded-full truncate max-w-[150px]">
              {question.chapter}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6 prose prose-slate max-w-none text-slate-800 leading-relaxed text-base">
        <MathText
          key={question.id}
          content={question.question_text}
          className="question-body"
        />
      </div>

      {/* Response Input */}
      <div className="flex-1">
        {question.type === 'SINGLE' && (
          <SingleChoice
            options={options}
            selectedValue={draft?.selectedAnswer ?? null}
            onChange={(value) => onDraftChange(question.id, value)}
            disabled={disabled}
          />
        )}
        {question.type === 'MULTI' && (
          <MultiChoice
            options={options}
            selectedValues={selectedMulti}
            onChange={handleMultiChange}
            disabled={disabled}
          />
        )}
        {question.type === 'INTEGER' && (
          <IntegerInput
            value={draft?.selectedAnswer ?? null}
            onChange={(value) => onDraftChange(question.id, value)}
            disabled={disabled}
          />
        )}
        {question.type === 'MATRIX' && (
          <MatrixInput
            value={draft?.selectedAnswer ?? null}
            onChange={(value) => onDraftChange(question.id, value)}
            disabled={disabled}
            rows={question.matrix_options?.rows}
            cols={question.matrix_options?.cols}
          />
        )}
      </div>
    </div>
  );
};
