import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-spin rounded-full border-t-transparent border-slate-900',
          {
            'h-4 w-4 border-2': size === 'sm',
            'h-8 w-8 border-3': size === 'md',
            'h-12 w-12 border-4': size === 'lg',
          }
        ),
        className
      )}
    />
  );
};
