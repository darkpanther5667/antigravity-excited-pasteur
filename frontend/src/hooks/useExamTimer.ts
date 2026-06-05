'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseExamTimerOptions {
  initialSeconds: number;
  onTick?: (secondsRemaining: number) => void;
  onExpire?: () => void;
  enabled?: boolean;
}

/**
 * Countdown timer hook.
 *
 * - Starts from `initialSeconds`.
 * - Calls `onTick` every second with the current remaining seconds.
 * - Calls `onExpire` when it hits zero.
 * - Exposes `syncTime` to reconcile from backend (latest-write-wins).
 * - Can be paused with `enabled = false`.
 */
export function useExamTimer({
  initialSeconds,
  onTick,
  onExpire,
  enabled = true,
}: UseExamTimerOptions) {
  const secondsRef = useRef<number>(initialSeconds);
  const expiredRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Keep callback refs stable
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Sync from backend (called after save-response succeeds)
  const syncTime = useCallback((serverSeconds: number) => {
    // Only sync if the server value is meaningfully different (>2s drift)
    if (Math.abs(secondsRef.current - serverSeconds) > 2) {
      secondsRef.current = serverSeconds;
    }
  }, []);

  const forceSet = useCallback((seconds: number) => {
    secondsRef.current = Math.max(0, seconds);
    expiredRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Reset expiry flag when timer is initialized/resumed
    if (secondsRef.current > 0) {
      expiredRef.current = false;
    }

    intervalRef.current = setInterval(() => {
      if (expiredRef.current) return;

      secondsRef.current = Math.max(0, secondsRef.current - 1);
      onTickRef.current?.(secondsRef.current);

      if (secondsRef.current <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  return { syncTime, forceSet, getSeconds: () => secondsRef.current };
}
