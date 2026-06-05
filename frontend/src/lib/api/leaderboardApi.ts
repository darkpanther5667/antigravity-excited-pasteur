import apiClient from './apiClient';
import type { APIResponse } from '../types';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  institute: string | null;
  score: number;
  percentile: number;
  physicsScore: number;
  chemistryScore: number;
  mathsScore: number;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  name: string;
  institute: string | null;
  avgPercentile: number;
  testsTaken: number;
}

export interface TestLeaderboardData {
  test: {
    id: string;
    title: string;
    total_marks: number;
  };
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GlobalLeaderboardData {
  leaderboard: GlobalLeaderboardEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export const leaderboardApi = {
  getTestLeaderboard: async (testId: string, page = 1, limit = 20) => {
    const res = await apiClient.get<APIResponse<TestLeaderboardData>>(`/leaderboard/test/${testId}`, {
      params: { page, limit }
    });
    return res.data;
  },
  getRankGaps: async (testId: string, attemptId: string) => {
    const res = await apiClient.get<APIResponse<LeaderboardEntry[]>>(`/leaderboard/test/${testId}/my-rank/${attemptId}`);
    return res.data;
  },
  getGlobalLeaderboard: async (page = 1, limit = 20) => {
    const res = await apiClient.get<APIResponse<GlobalLeaderboardData>>(`/leaderboard/global`, {
      params: { page, limit }
    });
    return res.data;
  }
};
