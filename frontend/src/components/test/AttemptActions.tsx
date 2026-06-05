'use client';

import React from 'react';

interface AttemptActionsProps {
  onSaveNext: () => void;
  onMarkNext: () => void;
  onClear: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSaving?: boolean;
}

export const AttemptActions: React.FC<AttemptActionsProps> = ({
  onSaveNext,
  onMarkNext,
  onClear,
  onPrev,
  onNext,
  isFirst,
  isLast,
  isSaving = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200">
      {/* Save & Next */}
      <button
        id="btn-save-next"
        onClick={onSaveNext}
        disabled={isSaving}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Save &amp; Next
      </button>

      {/* Mark for Review & Next */}
      <button
        id="btn-mark-next"
        onClick={onMarkNext}
        disabled={isSaving}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Mark &amp; Next
      </button>

      {/* Clear */}
      <button
        id="btn-clear"
        onClick={onClear}
        disabled={isSaving}
        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
      >
        Clear
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Previous */}
      <button
        id="btn-prev"
        onClick={onPrev}
        disabled={isFirst}
        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold rounded-lg transition-colors"
      >
        ← Prev
      </button>

      {/* Next */}
      <button
        id="btn-next"
        onClick={onNext}
        disabled={isLast}
        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold rounded-lg transition-colors"
      >
        Next →
      </button>
    </div>
  );
};
