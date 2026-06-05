'use client';

import React, { useMemo } from 'react';
import type { MatrixAnswer } from '../../../lib/types/attempt';

interface MatrixInputProps {
  /**
   * Stored as JSON string of MatrixAnswer: { "A_P": true, "A_Q": false, ... }
   * or null if no answer.
   */
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  /**
   * NTA MATRIX match type: rows = statements (A, B, C, D),
   * cols = options (P, Q, R, S).
   * If backend provides matrix_options, pass them here.
   * Otherwise we default to the standard NTA 4x4 layout.
   */
  rows?: string[];
  cols?: string[];
}

const DEFAULT_ROWS = ['A', 'B', 'C', 'D'];
const DEFAULT_COLS = ['P', 'Q', 'R', 'S'];

export const MatrixInput: React.FC<MatrixInputProps> = ({
  value,
  onChange,
  disabled = false,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
}) => {
  const current: MatrixAnswer = useMemo(() => {
    if (!value) return {};
    try {
      return JSON.parse(value) as MatrixAnswer;
    } catch {
      return {};
    }
  }, [value]);

  const toggle = (row: string, col: string) => {
    if (disabled) return;
    const key = `${row}_${col}`;
    const updated: MatrixAnswer = { ...current, [key]: !current[key] };
    // If no cells are true, return null (no answer)
    const hasAny = Object.values(updated).some(Boolean);
    onChange(hasAny ? JSON.stringify(updated) : null);
  };

  const isSelected = (row: string, col: string): boolean => {
    return Boolean(current[`${row}_${col}`]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium">
        MATRIX MATCH — Select the correct matches between Column I and Column II
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm" aria-label="Matrix match grid">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-slate-100 px-4 py-2 text-slate-600 font-semibold text-left">
                Column I \ II
              </th>
              {cols.map((col) => (
                <th
                  key={col}
                  className="border border-slate-300 bg-slate-100 px-4 py-2 text-slate-600 font-semibold text-center min-w-[60px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-700 bg-slate-50">
                  {row}
                </td>
                {cols.map((col) => {
                  const selected = isSelected(row, col);
                  return (
                    <td
                      key={col}
                      className="border border-slate-300 px-4 py-2 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(row, col)}
                        disabled={disabled}
                        aria-label={`Match ${row} with ${col}`}
                        aria-pressed={selected}
                        className={[
                          'w-8 h-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white focus:ring-blue-500'
                            : 'bg-white border-slate-300 text-transparent hover:border-blue-400 focus:ring-slate-400',
                          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        {selected && (
                          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
        MATRIX TYPE — Each row may match one or more columns. Scoring is based on exact match.
      </p>
    </div>
  );
};
