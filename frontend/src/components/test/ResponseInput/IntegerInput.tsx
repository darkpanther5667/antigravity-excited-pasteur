'use client';

import React, { useState, useEffect } from 'react';

interface IntegerInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const IntegerInput: React.FC<IntegerInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow: optional minus, digits, optional single decimal point
    if (/^-?\d*\.?\d*$/.test(raw)) {
      setLocalValue(raw);
      onChange(raw === '' ? null : raw);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium">
        Enter a numerical answer (decimals allowed)
      </p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your answer..."
          aria-label="Integer/Numerical answer"
          className={[
            'w-48 h-11 px-4 text-lg font-mono border rounded-lg outline-none',
            'transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            disabled
              ? 'bg-slate-100 cursor-not-allowed text-slate-400'
              : 'bg-white border-slate-300 text-slate-900',
          ].join(' ')}
        />
        {localValue !== '' && (
          <span className="text-sm text-slate-500">
            Entered:{' '}
            <span className="font-semibold text-slate-800 font-mono">{localValue}</span>
          </span>
        )}
      </div>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
        INTEGER / NUMERICAL TYPE — Only your entered value will be evaluated.
        Negative values and decimals are permitted where applicable.
      </p>
    </div>
  );
};
