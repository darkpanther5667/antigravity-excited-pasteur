'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAttemptSession } from '@/hooks/useAttemptSession';
import { deriveGlobalCounts } from '@/lib/attemptUtils';
import { Spinner } from '@/components/ui/Spinner';

// Test UI Components
import { TestTopBar } from '@/components/test/TestTopBar';
import { SectionTabs } from '@/components/test/SectionTabs';
import { QuestionCard } from '@/components/test/QuestionCard';
import { AttemptActions } from '@/components/test/AttemptActions';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { PaletteLegend } from '@/components/test/PaletteLegend';
import { SubmitDialog } from '@/components/test/SubmitDialog';


export default function AttemptPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const {
    phase,
    error,
    session,
    displaySeconds,
    saveStatus,
    saveError,
    isSubmitting,
    submitError,
    handleSubmit,
    navigateTo,
    goToSection,
    goNext,
    goPrev,
    updateDraft,
    saveAndNext,
    markAndNext,
    clearResponse,
  } = useAttemptSession({ testId, enabled: Boolean(testId) });

  // ── Derived state (hoisted above early returns — hooks must be unconditional) ────

  const currentQuestion = session?.allQuestions[session.activeQuestionIndex] ?? null;
  const currentDraft = currentQuestion ? (session?.answers[currentQuestion.id] ?? null) : null;
  const globalCounts = useMemo(
    () => deriveGlobalCounts(session?.allQuestions ?? [], session?.answers ?? {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

  const isFirst = (session?.activeQuestionIndex ?? 0) === 0;
  const isLast = (session?.activeQuestionIndex ?? 0) === (session?.allQuestions.length ?? 1) - 1;
  const isSaving = saveStatus === 'saving';

  // Aggregate section count totals for legend
  const totalNotVisited = session?.sections.reduce((a, s) => a + s.counts.notVisited, 0) ?? 0;
  const totalVisited = session?.sections.reduce((a, s) => a + s.counts.visited, 0) ?? 0;
  const totalAnswered = session?.sections.reduce((a, s) => a + s.counts.answered, 0) ?? 0;
  const totalMarked = session?.sections.reduce((a, s) => a + s.counts.marked, 0) ?? 0;
  const totalAnsweredMarked = session?.sections.reduce((a, s) => a + s.counts.answeredMarked, 0) ?? 0;

  // ── Early returns after all hooks ──────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Starting your test session…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Test</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Test Submitted!</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your answers have been recorded. Results will be processed shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/test/${testId}/result/${session?.attemptId}`)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
            >
              View Result
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveNext = async () => {
    if (!currentQuestion) return;
    await saveAndNext(currentQuestion.id, currentDraft?.selectedAnswer ?? null);
  };

  const handleMarkNext = async () => {
    if (!currentQuestion) return;
    await markAndNext(currentQuestion.id, currentDraft?.selectedAnswer ?? null);
  };

  const handleClear = async () => {
    if (!currentQuestion) return;
    await clearResponse(currentQuestion.id);
  };

  const handleDraftChange = (questionId: string, value: string | null) => {
    updateDraft(questionId, value);
  };

  const handleSubmitConfirm = async () => {
    await handleSubmit();
    setShowSubmitDialog(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* Top Bar */}
      <TestTopBar
        testTitle={session.testTitle}
        displaySeconds={displaySeconds}
        saveStatus={saveStatus}
        isSubmitting={isSubmitting || phase === 'submitting'}
        onSubmitClick={() => setShowSubmitDialog(true)}
      />

      {/* Section Tabs */}
      <SectionTabs
        sections={session.sections}
        activeSection={session.activeSection}
        onSectionChange={goToSection}
      />

      {/* Main Layout: Question Area + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Area — 75% */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-slate-200">
          {/* Question Content (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {currentQuestion ? (
              <QuestionCard
                question={currentQuestion}
                draft={currentDraft}
                onDraftChange={handleDraftChange}
                globalIndex={session.activeQuestionIndex}
                totalQuestions={session.allQuestions.length}
                disabled={isSaving || phase === 'submitting'}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No questions available.
              </div>
            )}
          </div>

          {/* Save Error Banner */}
          {saveStatus === 'error' && saveError && (
            <div className="mx-6 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {saveError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 py-3 bg-white border-t border-slate-100">
            <AttemptActions
              onSaveNext={handleSaveNext}
              onMarkNext={handleMarkNext}
              onClear={handleClear}
              onPrev={goPrev}
              onNext={goNext}
              isFirst={isFirst}
              isLast={isLast}
              isSaving={isSaving}
            />
          </div>
        </div>

        {/* Sidebar — ~25% */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden bg-slate-50">
          {/* Status Info */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              Q {session.activeQuestionIndex + 1} of {session.allQuestions.length}
            </p>
            <p className="text-xs text-slate-400 truncate">Test: {session.testTitle}</p>
          </div>

          {/* Palette */}
          <div className="flex-1 overflow-y-auto p-4">
            <QuestionPalette
              palette={session.palette}
              activeIndex={session.activeQuestionIndex}
              onQuestionClick={navigateTo}
            />
          </div>

          {/* Legend */}
          <div className="px-4 pb-4">
            <PaletteLegend
              notVisited={totalNotVisited}
              visited={totalVisited}
              answered={totalAnswered}
              marked={totalMarked}
              answeredMarked={totalAnsweredMarked}
            />
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <SubmitDialog
        isOpen={showSubmitDialog}
        isSubmitting={isSubmitting || phase === 'submitting'}
        counts={globalCounts}
        onConfirm={handleSubmitConfirm}
        onCancel={() => setShowSubmitDialog(false)}
        error={submitError}
      />
    </div>
  );
}
