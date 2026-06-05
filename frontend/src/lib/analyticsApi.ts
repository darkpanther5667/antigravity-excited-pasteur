import apiClient from './api/apiClient';
import type { APIResponse } from './types';
import type {
  OverviewData,
  SubjectBreakdownData,
  ChapterHeatmapData,
  TimeAnalysisData,
  ProgressData,
  SWOTData,
  CompareData,
} from './types/analytics';
import type { ResultData } from './types/result';

// ─── Result API ──────────────────────────────────────────────────────────────

export async function fetchTestResult(testId: string, attemptId: string): Promise<ResultData> {
  const res = await apiClient.get<APIResponse<ResultData>>(`/tests/${testId}/result/${attemptId}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch test result');
  }
  return res.data.data;
}

// ─── Analytics API ───────────────────────────────────────────────────────────

export async function fetchOverviewData(): Promise<OverviewData> {
  const res = await apiClient.get<APIResponse<OverviewData>>('/analytics/me/overview');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch overview analytics');
  }
  return res.data.data;
}

export async function fetchSubjectBreakdown(subject: string): Promise<SubjectBreakdownData> {
  const res = await apiClient.get<APIResponse<SubjectBreakdownData>>(`/analytics/me/subject/${subject}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch subject breakdown');
  }
  return res.data.data;
}

export async function fetchChapterHeatmap(): Promise<ChapterHeatmapData> {
  const res = await apiClient.get<APIResponse<ChapterHeatmapData>>('/analytics/me/chapter-heatmap');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch chapter heatmap');
  }
  return res.data.data;
}

export async function fetchTimeAnalysis(): Promise<TimeAnalysisData> {
  const res = await apiClient.get<APIResponse<TimeAnalysisData>>('/analytics/me/time-analysis');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch time analysis');
  }
  return res.data.data;
}

export async function fetchProgressData(): Promise<ProgressData> {
  const res = await apiClient.get<APIResponse<ProgressData>>('/analytics/me/progress');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch progress analytics');
  }
  return res.data.data;
}

export async function fetchSWOTData(): Promise<SWOTData> {
  const res = await apiClient.get<APIResponse<SWOTData>>('/analytics/me/swot');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch SWOT report');
  }
  return res.data.data;
}

export async function fetchCompareData(testId: string, attemptId: string): Promise<CompareData> {
  const res = await apiClient.get<APIResponse<CompareData>>(`/analytics/test/${testId}/compare/${attemptId}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || 'Failed to fetch topper comparison data');
  }
  return res.data.data;
}
