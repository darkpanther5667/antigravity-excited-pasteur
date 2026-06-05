import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex gap-3 p-4 rounded-lg border text-sm font-medium leading-relaxed',
          {
            'bg-green-50 text-green-800 border-green-200': type === 'success',
            'bg-red-50 text-red-800 border-red-200': type === 'error',
            'bg-blue-50 text-blue-800 border-blue-200': type === 'info',
          }
        ),
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {type === 'success' && <CheckCircle size={16} />}
        {type === 'error' && <AlertCircle size={16} />}
        {type === 'info' && <Info size={16} />}
      </div>
      <div>{message}</div>
    </div>
  );
};
