'use client';

import { useCallback, useRef } from 'react';
import { saveResponse as apiSaveResponse } from '../lib/attemptApi';
import type { SaveResponsePayload, ResponseStatus } from '../lib/types/attempt';
import { toBackendStatus } from '../lib/attemptUtils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveOptions {
  testId: string;
  attemptId: string;
  getTimeRemaining: () => number;
  onStatusChange: (status: SaveStatus, errorMsg?: string) => void;
}

/**
 * Autosave hook.
 *
 * Strategy:
 * - Each save call cancels any in-flight save for the same question (AbortController).
 * - Uses a "sequence number" per question to implement latest-write-wins:
 *   if a newer save has already been dispatched, a stale response is discarded.
 * - Exposes a single `save(questionId, answer, status)` function.
 */
export function useAutosave({
  testId,
  attemptId,
  getTimeRemaining,
  onStatusChange,
}: AutosaveOptions) {
  // Track active AbortControllers per question
  const abortControllers = useRef<Record<string, AbortController>>({});
  // Track sequence number per question to discard stale completions
  const sequenceNums = useRef<Record<string, number>>({});

  const save = useCallback(
    async (
      questionId: string,
      selectedAnswer: string | null,
      status: ResponseStatus,
      timeSpentSeconds?: number,
    ) => {
      // Cancel any existing in-flight save for this question
      if (abortControllers.current[questionId]) {
        abortControllers.current[questionId].abort();
      }

      const controller = new AbortController();
      abortControllers.current[questionId] = controller;

      // Increment and capture sequence number
      const currentSeq = (sequenceNums.current[questionId] ?? 0) + 1;
      sequenceNums.current[questionId] = currentSeq;

      onStatusChange('saving');

      const payload: SaveResponsePayload = {
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        status: toBackendStatus(status),
        time_spent_seconds: timeSpentSeconds ?? 0,
        time_remaining: getTimeRemaining(),
      };

      try {
        await apiSaveResponse(testId, payload, controller.signal);

        // Discard if a newer save has already been dispatched
        if (sequenceNums.current[questionId] !== currentSeq) return;

        onStatusChange('saved');
        // Note: backend doesn't return time_remaining in save-response currently
        // If it did, we'd call onTimeSynced(response.time_remaining)
      } catch (err: unknown) {
        // Discard if cancelled (a newer save is in flight)
        if (err instanceof Error && err.name === 'CanceledError') return;
        if (err instanceof Error && err.name === 'AbortError') return;

        // Discard stale error
        if (sequenceNums.current[questionId] !== currentSeq) return;

        const msg =
          err instanceof Error ? err.message : 'Save failed. Please try again.';
        onStatusChange('error', msg);
      } finally {
        // Clean up controller if it's still the current one
        if (abortControllers.current[questionId] === controller) {
          delete abortControllers.current[questionId];
        }
      }
    },
    [testId, attemptId, getTimeRemaining, onStatusChange],
  );

  return { save };
}
