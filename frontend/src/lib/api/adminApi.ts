import apiClient from './apiClient';
import type { APIResponse } from '../types';

export interface QuestionData {
  id?: string;
  subject: 'PHYSICS' | 'CHEMISTRY' | 'MATHS';
  chapter: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX';
  question_text: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer: string;
  solution: string;
  year?: number | null;
  exam_type: 'MAINS' | 'ADVANCED';
  nta_weightage: number;
}

export interface BulkUploadDetails {
  row: number;
  errors: string[];
}

export interface BulkUploadResult {
  inserted: number;
  errors: BulkUploadDetails[];
}

export interface TestData {
  id?: string;
  title: string;
  type: 'FULL_MOCK' | 'CHAPTER' | 'PYQ' | 'ADAPTIVE';
  exam_type: 'MAINS' | 'ADVANCED';
  duration_minutes: number;
  total_marks: number;
  instructions?: string;
  scheduled_at?: string | null;
  is_published?: boolean;
}

export interface TestQuestionItem {
  question_id: string;
  section: 'PHYSICS' | 'CHEMISTRY' | 'MATHS';
  marks_correct: number;
  marks_incorrect: number;
  question_order: number;
}

export interface TestQuestionRelation {
  question: QuestionData;
  questionOrder: number;
  section: 'PHYSICS' | 'CHEMISTRY' | 'MATHS';
  marksCorrect: number;
  marksIncorrect: string | number;
}

export const adminApi = {
  // Questions CRUD
  getQuestions: async (params: Record<string, string | number | undefined>) => {
    const res = await apiClient.get<APIResponse<{ questions: QuestionData[]; total: number; page: number; totalPages: number }>>('/questions', { params });
    return res.data;
  },
  getQuestion: async (id: string) => {
    const res = await apiClient.get<APIResponse<QuestionData>>(`/questions/${id}`);
    return res.data;
  },
  createQuestion: async (data: QuestionData) => {
    const res = await apiClient.post<APIResponse<QuestionData>>('/questions', data);
    return res.data;
  },
  updateQuestion: async (id: string, data: Partial<QuestionData>) => {
    const res = await apiClient.put<APIResponse<QuestionData>>(`/questions/${id}`, data);
    return res.data;
  },
  deleteQuestion: async (id: string) => {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean }>>(`/questions/${id}`);
    return res.data;
  },
  bulkUploadQuestions: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<APIResponse<BulkUploadResult>>('/questions/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getChapters: async (subject: string) => {
    const res = await apiClient.get<APIResponse<{ subject: string; chapters: string[] }>>('/questions/meta/chapters', { params: { subject } });
    return res.data;
  },
  getTopics: async (subject: string, chapter: string) => {
    const res = await apiClient.get<APIResponse<{ subject: string; chapter: string; topics: string[] }>>('/questions/meta/topics', { params: { subject, chapter } });
    return res.data;
  },

  // Tests CRUD
  getTests: async (params?: Record<string, string | number | boolean | undefined>) => {
    const res = await apiClient.get<APIResponse<{ tests: TestData[]; total: number; page: number; totalPages: number }>>('/tests', { params });
    return res.data;
  },
  getTest: async (id: string) => {
    const res = await apiClient.get<APIResponse<TestData & { testQuestions?: TestQuestionRelation[] }>>(`/tests/${id}`);
    return res.data;
  },
  createTest: async (data: TestData) => {
    const res = await apiClient.post<APIResponse<TestData>>('/tests', data);
    return res.data;
  },
  updateTest: async (id: string, data: Partial<TestData>) => {
    const res = await apiClient.put<APIResponse<TestData>>(`/tests/${id}`, data);
    return res.data;
  },
  deleteTest: async (id: string) => {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean }>>(`/tests/${id}`);
    return res.data;
  },
  publishTest: async (id: string, isPublished: boolean) => {
    const res = await apiClient.patch<APIResponse<{ is_published: boolean }>>(`/tests/${id}/publish`, { is_published: isPublished });
    return res.data;
  },
  setTestQuestions: async (id: string, questions: TestQuestionItem[]) => {
    const res = await apiClient.put<APIResponse<{ question_count: number }>>(`/tests/${id}/questions`, { questions });
    return res.data;
  },
  createNtaMainsTest: async (title: string, scheduledAt?: string | null) => {
    const res = await apiClient.post<APIResponse<TestData>>('/tests/create-nta-mains', { title, scheduled_at: scheduledAt });
    return res.data;
  },
};
