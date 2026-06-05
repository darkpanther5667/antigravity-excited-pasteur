'use client';

import React from 'react';
import type { SaveStatus } from '../../hooks/useAutosave';
import { formatTimer } from '../../lib/attemptUtils';

interface TestTopBarProps {
  testTitle: string;
  displaySeconds: number;
  saveStatus: SaveStatus;
  isSubmitting: boolean;
  onSubmitClick: () => void;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saving':
      return (
        <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          Saving…
        </span>
      );
    case 'saved':
      return (
        <span className="text-xs text-green-600 flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      );
    case 'error':
      return (
        <span className="text-xs text-red-600 flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          Save failed
        </span>
      );
    default:
      return null;
  }
}

export const TestTopBar: React.FC<TestTopBarProps> = ({
  testTitle,
  displaySeconds,
  saveStatus,
  isSubmitting,
  onSubmitClick,
}) => {
  const isLow = displaySeconds > 0 && displaySeconds <= 5 * 60; // ≤ 5 min

  return (
    <div className="h-14 bg-slate-900 text-white flex items-center px-4 gap-4 shrink-0 shadow-md z-50">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-xs font-bold">
          JEE
        </div>
        <span className="hidden sm:block text-sm font-semibold text-slate-300 max-w-[200px] truncate">
          {testTitle}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save indicator */}
      <div className="hidden sm:flex items-center">
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Timer */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold tabular-nums',
          isLow
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-slate-800 text-slate-100',
        ].join(' ')}
        aria-label="Time remaining"
        aria-live="polite"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formatTimer(displaySeconds)}
      </div>

      {/* Submit Button */}
      <button
        id="submit-test-btn"
        onClick={onSubmitClick}
        disabled={isSubmitting}
        className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shrink-0"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Test'}
      </button>
    </div>
  );
};
