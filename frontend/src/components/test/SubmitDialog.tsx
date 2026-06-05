'use client';

import React from 'react';
import type { GlobalCounts } from '../../lib/attemptUtils';

interface SubmitDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  counts: GlobalCounts;
  onConfirm: () => void;
  onCancel: () => void;
  error?: string | null;
}

export const SubmitDialog: React.FC<SubmitDialogProps> = ({
  isOpen,
  isSubmitting,
  counts,
  onConfirm,
  onCancel,
  error,
}) => {
  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4">
          <h2 id="submit-dialog-title" className="text-white text-lg font-bold">
            Confirm Submission
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            This action is irreversible. Review your summary before submitting.
          </p>
        </div>

        {/* Summary */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <SummaryRow
              label="Total Questions"
              value={counts.total}
              color="text-slate-800"
            />
            <SummaryRow
              label="Answered"
              value={counts.answered + counts.answeredAndMarked}
              color="text-green-700"
              bgColor="bg-green-50"
            />
            <SummaryRow
              label="Not Answered"
              value={counts.unanswered - counts.markedForReview}
              color="text-red-700"
              bgColor="bg-red-50"
            />
            <SummaryRow
              label="Marked for Review"
              value={counts.markedForReview + counts.answeredAndMarked}
              color="text-violet-700"
              bgColor="bg-violet-50"
            />
            <SummaryRow
              label="Not Visited"
              value={counts.notVisited}
              color="text-slate-600"
              bgColor="bg-slate-50"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {counts.unanswered > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ⚠️ You have <strong>{counts.unanswered}</strong> unanswered question(s).
              These will be marked as <em>Not Answered</em>.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            id="submit-dialog-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Review More
          </button>
          <button
            id="submit-dialog-confirm-btn"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </span>
            ) : (
              'Submit Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function SummaryRow({
  label,
  value,
  color,
  bgColor = 'bg-white',
}: {
  label: string;
  value: number;
  color: string;
  bgColor?: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2 ${bgColor} border border-slate-100`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
