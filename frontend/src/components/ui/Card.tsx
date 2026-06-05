import React from 'react';
import { twMerge } from 'tailwind-merge';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
