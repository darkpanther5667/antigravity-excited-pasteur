import apiClient from './api/apiClient';
import type {
  StartAttemptResponse,
  SaveResponsePayload,
  SubmitAttemptPayload,
  TestMetadata,
} from './types/attempt';
import type { APIResponse } from './types';

// ─── Test Metadata ─────────────────────────────────────────────────────────────

export async function fetchTestMetadata(testId: string): Promise<TestMetadata> {
  const res = await apiClient.get<APIResponse<TestMetadata>>(`/tests/${testId}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch test metadata');
  }
  return res.data.data;
}

// ─── Attempt Lifecycle ────────────────────────────────────────────────────────

/**
 * Starts a new attempt or resumes an existing one.
 * The backend handles the idempotency — if an attempt already exists,
 * it returns the existing attempt with saved responses.
 */
export async function startOrResumeAttempt(testId: string): Promise<StartAttemptResponse> {
  const res = await apiClient.post<APIResponse<StartAttemptResponse>>(`/tests/${testId}/start`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to start attempt');
  }
  return res.data.data;
}

// ─── Response Save ────────────────────────────────────────────────────────────

export async function saveResponse(
  testId: string,
  payload: SaveResponsePayload,
  signal?: AbortSignal,
): Promise<{ saved: boolean }> {
  const res = await apiClient.post<APIResponse<{ saved: boolean }>>(
    `/tests/${testId}/save-response`,
    payload,
    { signal },
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to save response');
  }
  return res.data.data;
}

// ─── Submit Attempt ───────────────────────────────────────────────────────────

export async function submitAttempt(
  testId: string,
  payload: SubmitAttemptPayload,
): Promise<unknown> {
  const res = await apiClient.post<APIResponse<unknown>>(
    `/tests/${testId}/submit`,
    payload,
  );
  if (!res.data.success) {
    throw new Error(res.data.error || 'Failed to submit attempt');
  }
  return res.data.data;
}
