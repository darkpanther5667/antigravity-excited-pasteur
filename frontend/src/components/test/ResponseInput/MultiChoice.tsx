'use client';

import React from 'react';

interface MultiChoiceProps {
  options: {
    label: string;
    value: string;
    text: string | null;
  }[];
  // Comma-separated selected values e.g. "A,C"
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export const MultiChoice: React.FC<MultiChoiceProps> = ({
  options,
  selectedValues,
  onChange,
  disabled = false,
}) => {
  const toggle = (value: string) => {
    if (disabled) return;
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2" role="group" aria-label="Answer options (select all that apply)">
      <p className="text-xs text-slate-500 mb-3 font-medium">
        Select one or more correct options
      </p>
      {options.map((opt) => {
        const isSelected = selectedValues.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={[
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none',
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-violet-50',
              isSelected
                ? 'border-violet-600 bg-violet-50 text-violet-900'
                : 'border-slate-200 bg-white text-slate-800',
            ].join(' ')}
          >
            <input
              type="checkbox"
              value={opt.value}
              checked={isSelected}
              onChange={() => toggle(opt.value)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 accent-violet-600 shrink-0 rounded"
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
