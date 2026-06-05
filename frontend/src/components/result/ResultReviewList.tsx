import React, { useState, useEffect } from 'react';
import { ResultResponse, ReviewFilter, SubjectFilter } from '../../lib/types/result';
import ResultQuestionRow from './ResultQuestionRow';
import EmptyState from '../ui/EmptyState';

interface ResultReviewListProps {
  questions: ResultResponse[];
  currentFilter: ReviewFilter;
  currentSubject: SubjectFilter;
}

const ITEMS_PER_PAGE = 5;

export default function ResultReviewList({
  questions,
  currentFilter,
  currentSubject,
}: ResultReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    // Subject filter
    if (currentSubject !== 'all') {
      const qSub = q.subject.toUpperCase();
      const filterSub = currentSubject.toUpperCase();
      if (qSub !== filterSub) return false;
    }

    // Status filter
    switch (currentFilter) {
      case 'correct':
        return q.is_correct === true;
      case 'incorrect':
        return q.is_correct === false && q.status !== 'UNANSWERED' && q.status !== 'NOT_VISITED';
      case 'unattempted':
        return q.status === 'UNANSWERED' || q.status === 'NOT_VISITED' || !q.selected_answer;
      case 'marked':
        return q.status === 'MARKED_REVIEW';
      case 'all':
      default:
        return true;
    }
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFilter, currentSubject]);

  // Pagination logic
  const totalItems = filteredQuestions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (totalItems === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="No questions match the selected filters"
          description="Try selecting a different subject or answer status from the filters above."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Showing count */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100/60 dark:bg-slate-800/40 px-4 py-2 rounded-lg">
        <span>Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} Questions</span>
        {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
      </div>

      {/* List */}
      <div className="space-y-6">
        {paginatedQuestions.map((question) => {
          const qIdx = questions.indexOf(question) + 1;
          return (
            <ResultQuestionRow
              key={question.question_id}
              question={question}
              index={qIdx}
            />
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          
          <div className="flex gap-1.5 overflow-x-auto max-w-[180px] sm:max-w-none">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
