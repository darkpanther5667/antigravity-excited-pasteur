"use client";

import React, { useEffect, useRef } from 'react';

interface MathJaxGlobal {
  typesetPromise?: (elements: (HTMLElement | null)[]) => Promise<void>;
}

declare global {
  interface Window {
    MathJax?: MathJaxGlobal;
  }
}

interface MathTextProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ content, className, inline = false }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err: unknown) => {
        console.error('MathJax typesetting failed:', err);
      });
    }
  }, [content]);

  if (inline) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
