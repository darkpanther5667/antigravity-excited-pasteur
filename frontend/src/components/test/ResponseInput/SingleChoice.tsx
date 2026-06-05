'use client';

import React from 'react';

interface SingleChoiceProps {
  options: {
    label: string;
    value: string; // "A" | "B" | "C" | "D"
    text: string | null;
  }[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SingleChoice: React.FC<SingleChoiceProps> = ({
  options,
  selectedValue,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Answer options">
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        return (
          <label
            key={opt.value}
            className={[
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none',
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-50',
              isSelected
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-800',
            ].join(' ')}
          >
            <input
              type="radio"
              name="single-choice"
              value={opt.value}
              checked={isSelected}
              onChange={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 accent-blue-600 shrink-0"
            />
            <div className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="font-semibold shrink-0 text-slate-500">{opt.label}.</span>
              <span
                className="option-content"
                dangerouslySetInnerHTML={{ __html: opt.text ?? '' }}
              />
            </div>
          </label>
        );
      })}
    </div>
  );
};
