'use client';

import React from 'react';
import type { SectionName } from '../../lib/types/attempt';
import type { SectionState } from '../../lib/types/attempt';

interface SectionTabsProps {
  sections: SectionState[];
  activeSection: SectionName;
  onSectionChange: (section: SectionName) => void;
}

const SECTION_COLORS: Record<SectionName, string> = {
  PHYSICS: 'text-blue-700 border-blue-600 bg-blue-50',
  CHEMISTRY: 'text-green-700 border-green-600 bg-green-50',
  MATHS: 'text-orange-700 border-orange-600 bg-orange-50',
};

const SECTION_INACTIVE: Record<SectionName, string> = {
  PHYSICS: 'text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-transparent',
  CHEMISTRY: 'text-slate-600 hover:text-green-700 hover:bg-green-50 border-transparent',
  MATHS: 'text-slate-600 hover:text-orange-700 hover:bg-orange-50 border-transparent',
};

export const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="flex gap-1 border-b border-slate-200 bg-white px-4" role="tablist">
      {sections.map((section) => {
        const isActive = section.name === activeSection;
        const answeredCount = section.counts.answered + section.counts.answeredMarked;
        const total = section.questions.length;

        return (
          <button
            key={section.name}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSectionChange(section.name)}
            className={[
              'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
              isActive
                ? SECTION_COLORS[section.name]
                : SECTION_INACTIVE[section.name],
            ].join(' ')}
          >
            {section.name.charAt(0) + section.name.slice(1).toLowerCase()}
            <span className="ml-2 text-xs font-normal opacity-75">
              {answeredCount}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );
};
