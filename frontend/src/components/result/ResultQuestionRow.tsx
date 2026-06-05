import React, { useState } from 'react';
import { ResultResponse } from '../../lib/types/result';
import { MathText } from '../ui/MathText';

interface ResultQuestionRowProps {
  question: ResultResponse;
  index: number;
}

const TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Single Correct Choice',
  MULTI: 'Multiple Correct Choice',
  INTEGER: 'Numerical Value',
  MATRIX: 'Matrix Match',
};

export default function ResultQuestionRow({ question, index }: ResultQuestionRowProps) {
  const [showSolution, setShowSolution] = useState(false);

  // Time formatter
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Status style helpers
  const getStatusBadge = () => {
    if (question.status === 'UNANSWERED' || question.status === 'NOT_VISITED') {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Unattempted
        </span>
      );
    }
    if (question.is_correct === true) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400">
          Correct
        </span>
      );
    }
    if (question.is_correct === false) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/45 dark:text-rose-400">
          Incorrect
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/45 dark:text-indigo-400">
        Marked
      </span>
    );
  };

  const getMarksBadge = () => {
    const marks = question.marks_awarded;
    if (marks > 0) {
      return (
        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
          +{marks} Marks
        </span>
      );
    }
    if (marks < 0) {
      return (
        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded">
          {marks} Marks
        </span>
      );
    }
    return (
      <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
        0 Marks
      </span>
    );
  };

  // Helper to extract options
  const options = [
    { label: 'A', text: question.option_a },
    { label: 'B', text: question.option_b },
    { label: 'C', text: question.option_c },
    { label: 'D', text: question.option_d },
  ].filter((opt) => opt.text !== null && opt.text !== undefined);

  // Parse multi-choice arrays
  const correctMulti = question.correct_answer ? question.correct_answer.toUpperCase().split(',').map(s => s.trim()) : [];
  const selectedMulti = question.selected_answer ? question.selected_answer.toUpperCase().split(',').map(s => s.trim()) : [];

  // Matrix match helper
  const renderMatrixReview = () => {
    let correctMatrix: Record<string, boolean> = {};
    let selectedMatrix: Record<string, boolean> = {};

    try {
      if (question.correct_answer) {
        correctMatrix = JSON.parse(question.correct_answer);
      }
    } catch {
      // Fallback if not JSON
    }

    try {
      if (question.selected_answer) {
        selectedMatrix = JSON.parse(question.selected_answer);
      }
    } catch {
      // Fallback
    }

    const rows = ['A', 'B', 'C', 'D'];
    const cols = ['P', 'Q', 'R', 'S'];

    const hasCorrectJSON = Object.keys(correctMatrix).length > 0;

    if (!hasCorrectJSON) {
      // Return simple textual representation if not stored as JSON
      return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30 text-sm space-y-2">
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Correct Matches:</span>{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">{question.correct_answer}</code>
          </p>
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Your Selection:</span>{' '}
            {question.selected_answer ? (
              <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-850 dark:text-slate-150">{question.selected_answer}</code>
            ) : (
              <span className="text-slate-400 italic">No answer submitted</span>
            )}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-850">
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-left text-slate-600 dark:text-slate-400 font-semibold">
                  Row \ Col
                </th>
                {cols.map((col) => (
                  <th key={col} className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-center text-slate-600 dark:text-slate-400 font-semibold min-w-[50px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <td className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">
                    {row}
                  </td>
                  {cols.map((col) => {
                    const key = `${row}_${col}`;
                    const isCorrectMatch = Boolean(correctMatrix[key]);
                    const isSelectedMatch = Boolean(selectedMatrix[key]);

                    let cellStyle = 'bg-white dark:bg-slate-900';
                    let statusIcon = null;

                    if (isCorrectMatch && isSelectedMatch) {
                      // Correct selection
                      cellStyle = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
                      statusIcon = '✓';
                    } else if (!isCorrectMatch && isSelectedMatch) {
                      // Incorrect selection
                      cellStyle = 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400';
                      statusIcon = '✗';
                    } else if (isCorrectMatch && !isSelectedMatch) {
                      // Missed correct selection
                      cellStyle = 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
                      statusIcon = '○';
                    }

                    return (
                      <td
                        key={col}
                        className={`border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-center ${cellStyle}`}
                      >
                        <span className="font-bold">{statusIcon || '-'}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Correct match</span>
          <span className="flex items-center gap-1"><span className="text-rose-600 font-bold">✗</span> Incorrect selection</span>
          <span className="flex items-center gap-1"><span className="text-amber-600 font-bold">○</span> Missed match</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
      {/* Row Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            Q{index}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {TYPE_LABEL[question.type] || question.type}
          </span>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {question.subject}
          </span>
          {question.chapter && (
            <span className="text-xs text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded max-w-[150px] truncate">
              {question.chapter}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center text-xs text-slate-400 dark:text-slate-500">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Spent {formatTime(question.time_spent_seconds)}
          </span>
          {getMarksBadge()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Question Statement */}
      <div className="prose prose-slate max-w-none text-slate-800 dark:text-slate-200 mb-6 text-sm sm:text-base leading-relaxed">
        <MathText content={question.question_text} />
      </div>

      {/* Answer Options or Numerical Review */}
      <div className="mb-6">
        {/* Single or Multi-choice options */}
        {(question.type === 'SINGLE' || question.type === 'MULTI') && (
          <div className="space-y-3">
            {options.map((opt) => {
              const isCorrectOpt = question.type === 'SINGLE'
                ? question.correct_answer?.toUpperCase() === opt.label
                : correctMulti.includes(opt.label);

              const isSelectedOpt = question.type === 'SINGLE'
                ? question.selected_answer?.toUpperCase() === opt.label
                : selectedMulti.includes(opt.label);

              let optionStyle = 'border-slate-200 bg-white hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900';
              let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350';

              if (isCorrectOpt) {
                // Correct options are always green
                optionStyle = 'border-emerald-500 bg-emerald-50/30 text-emerald-950 dark:border-emerald-500/50 dark:bg-emerald-950/10 dark:text-emerald-300';
                badgeColor = 'bg-emerald-500 text-white';
              } else if (isSelectedOpt && !isCorrectOpt) {
                // Selected options that are incorrect are red
                optionStyle = 'border-rose-500 bg-rose-50/30 text-rose-950 dark:border-rose-500/50 dark:bg-rose-950/10 dark:text-rose-300';
                badgeColor = 'bg-rose-500 text-white';
              }

              return (
                <div
                  key={opt.label}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm select-none transition-all ${optionStyle}`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badgeColor}`}>
                    {opt.label}
                  </div>
                  <div className="flex-1 leading-relaxed">
                    <MathText content={opt.text ?? ''} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Integer Input Review */}
        {question.type === 'INTEGER' && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Correct Answer:</span>
              <span className="font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-lg">
                {question.correct_answer}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Your Response:</span>
              {question.selected_answer ? (
                <span className={`font-mono font-bold px-3 py-1 rounded-lg ${
                  question.is_correct
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                }`}>
                  {question.selected_answer}
                </span>
              ) : (
                <span className="text-slate-400 italic">No answer submitted</span>
              )}
            </div>
          </div>
        )}

        {/* Matrix Match Review */}
        {question.type === 'MATRIX' && renderMatrixReview()}
      </div>

      {/* Solution Section */}
      {question.solution && (
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showSolution ? 'Hide Solution' : 'View Solution & Explanation'}
            <svg
              className={`h-4 w-4 transform transition-transform ${showSolution ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSolution && (
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-5 border border-slate-100 dark:border-slate-850">
              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Detailed Solution
              </h5>
              <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-350 text-sm sm:text-base leading-relaxed">
                <MathText content={question.solution} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
