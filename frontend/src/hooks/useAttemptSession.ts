'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { startOrResumeAttempt, submitAttempt } from '../lib/attemptApi';
import {
  groupIntoSections,
  hydrateAnswers,
  derivePalette,
  deriveSectionCounts,
  flattenQuestions,
  findFirstQuestionIndexInSection,
  computeNewStatus,
} from '../lib/attemptUtils';
import { useAutosave, type SaveStatus } from './useAutosave';
import { useExamTimer } from './useExamTimer';
import type {
  AttemptSession,
  SectionName,
  ResponseStatus,
  AnswerDraft,
} from '../lib/types/attempt';

type SessionPhase = 'loading' | 'ready' | 'submitting' | 'submitted' | 'error';

interface UseAttemptSessionOptions {
  testId: string;
  enabled?: boolean; // set false until component is mounted
}

/**
 * The central attempt session hook.
 *
 * Responsibilities:
 * 1. One-time guarded start/resume (prevents double-start on re-render).
 * 2. Hydrates local state from backend responses on resume.
 * 3. Provides answer mutation functions (save, markReview, clear).
 * 4. Drives autosave via useAutosave.
 * 5. Drives countdown timer via useExamTimer.
 * 6. Provides submit flow with idempotency guard.
 * 7. Registers beforeunload guard during active attempt.
 */
export function useAttemptSession({ testId, enabled = true }: UseAttemptSessionOptions) {
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guards against double-start
  const startGuard = useRef(false);
  // Guard against duplicate submission
  const submitGuard = useRef(false);

  // ── Timer ──────────────────────────────────────────────────────────────────

  const timerRef = useExamTimer({
    initialSeconds: 0, // will be set after session loads via forceSet
    enabled: phase === 'ready',
    onTick: (secs) => {
      setDisplaySeconds(secs);
    },
    onExpire: () => {
      // Auto-submit on timer expiry (handleSubmit is defined later but called via ref-stable closure)
      handleSubmit();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // ── Autosave ──────────────────────────────────────────────────────────────

  const { save: saveToBackend } = useAutosave({
    testId,
    attemptId: session?.attemptId ?? '',
    getTimeRemaining: timerRef.getSeconds,
    onStatusChange: (status, msg) => {
      setSaveStatus(status);
      setSaveError(msg ?? null);
      // Reset "saved" indicator after 3 seconds
      if (status === 'saved') {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
  });

  // ── Initialization ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;
    if (startGuard.current) return;
    startGuard.current = true;

    (async () => {
      try {
        const data = await startOrResumeAttempt(testId);
        const sections = groupIntoSections(data.questions);
        const allQuestions = flattenQuestions(sections);
        const answers = hydrateAnswers(allQuestions, data.responses ?? []);
        const sectionsWithCounts = deriveSectionCounts(sections, answers);
        const palette = derivePalette(sectionsWithCounts, answers);

        const firstSection: SectionName = sectionsWithCounts[0]?.name ?? 'PHYSICS';
        const firstIndex = findFirstQuestionIndexInSection(allQuestions, firstSection);

        // Mark the first question as visited (not_visited → visited) if not already set
        const firstQ = allQuestions[Math.max(0, firstIndex)];
        if (firstQ && answers[firstQ.id]?.status === 'NOT_VISITED') {
          answers[firstQ.id] = { ...answers[firstQ.id], status: 'VISITED' };
        }

        const newSession: AttemptSession = {
          attemptId: data.attempt_id,
          testId,
          testTitle: data.test.title,
          examType: null,
          totalMarks: data.test.total_marks,
          durationMinutes: data.test.duration_minutes,
          sections: deriveSectionCounts(sections, answers),
          allQuestions,
          activeSection: firstSection,
          activeQuestionIndex: Math.max(0, firstIndex),
          answers,
          palette,
          saveState: { status: 'idle', lastSavedAt: null, errorMessage: null },
          timer: { timeRemainingSeconds: data.time_remaining_seconds, isExpired: false },
          isSubmitting: false,
        };

        setSession(newSession);
        setDisplaySeconds(data.time_remaining_seconds);
        timerRef.forceSet(data.time_remaining_seconds);
        setPhase('ready');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start test';
        setError(msg);
        setPhase('error');
      }
    })();
  // timerRef exposes stable ref-backed functions — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, enabled]);

  // ── beforeunload guard ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'ready') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // ── Internal state updater ─────────────────────────────────────────────────

  /**
   * Apply an answer mutation and re-derive palette + section counts.
   */
  const applyAnswerMutation = useCallback(
    (
      questionId: string,
      newAnswer: string | null,
      newStatus: ResponseStatus,
    ) => {
      setSession((prev) => {
        if (!prev) return prev;

        const updatedAnswers: Record<string, AnswerDraft> = {
          ...prev.answers,
          [questionId]: {
            questionId,
            selectedAnswer: newAnswer,
            status: newStatus,
          },
        };

        const updatedSections = deriveSectionCounts(prev.sections, updatedAnswers);
        const updatedPalette = derivePalette(updatedSections, updatedAnswers);

        return {
          ...prev,
          answers: updatedAnswers,
          sections: updatedSections,
          palette: updatedPalette,
        };
      });
    },
    [],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to a question by global index.
   * Also marks the question as VISITED if it was NOT_VISITED.
   */
  const navigateTo = useCallback(
    (globalIndex: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const clamped = Math.max(0, Math.min(globalIndex, prev.allQuestions.length - 1));
        const targetQ = prev.allQuestions[clamped];
        if (!targetQ) return prev;

        const currentStatus = prev.answers[targetQ.id]?.status ?? 'NOT_VISITED';
        const newStatus: ResponseStatus =
          currentStatus === 'NOT_VISITED' ? 'VISITED' : currentStatus;

        const updatedAnswers: Record<string, AnswerDraft> = {
          ...prev.answers,
          [targetQ.id]: {
            ...(prev.answers[targetQ.id] ?? {
              questionId: targetQ.id,
              selectedAnswer: null,
            }),
            status: newStatus,
          },
        };

        const updatedSections = deriveSectionCounts(prev.sections, updatedAnswers);
        const updatedPalette = derivePalette(updatedSections, updatedAnswers);

        return {
          ...prev,
          activeQuestionIndex: clamped,
          activeSection: targetQ.subject,
          answers: updatedAnswers,
          sections: updatedSections,
          palette: updatedPalette,
        };
      });
    },
    [],
  );

  const goToSection = useCallback(
    (section: SectionName) => {
      if (!session) return;
      const idx = findFirstQuestionIndexInSection(session.allQuestions, section);
      if (idx >= 0) navigateTo(idx);
    },
    [session, navigateTo],
  );

  const goNext = useCallback(() => {
    if (!session) return;
    if (session.activeQuestionIndex < session.allQuestions.length - 1) {
      navigateTo(session.activeQuestionIndex + 1);
    }
  }, [session, navigateTo]);

  const goPrev = useCallback(() => {
    if (!session) return;
    if (session.activeQuestionIndex > 0) {
      navigateTo(session.activeQuestionIndex - 1);
    }
  }, [session, navigateTo]);

  // ── Answer Actions ─────────────────────────────────────────────────────────

  /**
   * Update local draft answer without saving.
   */
  const updateDraft = useCallback(
    (questionId: string, selectedAnswer: string | null) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: {
              ...(prev.answers[questionId] ?? { questionId }),
              selectedAnswer,
            },
          },
        };
      });
    },
    [],
  );

  /**
   * Save & Next: saves current answer, moves to next question.
   */
  const saveAndNext = useCallback(
    async (questionId: string, selectedAnswer: string | null) => {
      const hasAnswer = selectedAnswer !== null && selectedAnswer !== '';
      const newStatus = computeNewStatus('save', hasAnswer);
      applyAnswerMutation(questionId, selectedAnswer, newStatus);
      await saveToBackend(questionId, selectedAnswer, newStatus);
      goNext();
    },
    [applyAnswerMutation, saveToBackend, goNext],
  );

  /**
   * Mark for Review & Next: marks current question, moves to next.
   */
  const markAndNext = useCallback(
    async (questionId: string, selectedAnswer: string | null) => {
      const hasAnswer = selectedAnswer !== null && selectedAnswer !== '';
      const newStatus = computeNewStatus('markReview', hasAnswer);
      applyAnswerMutation(questionId, selectedAnswer, newStatus);
      await saveToBackend(questionId, selectedAnswer, newStatus);
      goNext();
    },
    [applyAnswerMutation, saveToBackend, goNext],
  );

  /**
   * Clear Response: clears the answer for a question.
   */
  const clearResponse = useCallback(
    async (questionId: string) => {
      applyAnswerMutation(questionId, null, 'VISITED');
      await saveToBackend(questionId, null, 'VISITED');
    },
    [applyAnswerMutation, saveToBackend],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!session || submitGuard.current) return;
    submitGuard.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setPhase('submitting');

    try {
      await submitAttempt(testId, { attempt_id: session.attemptId });
      setPhase('submitted');
      return { attemptId: session.attemptId, success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      setPhase('ready');
      submitGuard.current = false;
      setIsSubmitting(false);
      return { success: false, error: msg };
    }
  }, [session, testId]);

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // Phase
    phase,
    error,

    // Session data
    session,

    // Timer display
    displaySeconds,

    // Save status
    saveStatus,
    saveError,

    // Submit
    isSubmitting,
    submitError,
    handleSubmit,

    // Navigation
    navigateTo,
    goToSection,
    goNext,
    goPrev,

    // Answer management
    updateDraft,
    saveAndNext,
    markAndNext,
    clearResponse,
  };
}
