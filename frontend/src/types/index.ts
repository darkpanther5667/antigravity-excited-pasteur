export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type Plan = 'FREE' | 'PRO' | 'ELITE';
export type Subject = 'PHYSICS' | 'CHEMISTRY' | 'MATHS';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX';
export type ExamType = 'MAINS' | 'ADVANCED';
export type TestType = 'FULL_MOCK' | 'CHAPTER' | 'PYQ' | 'ADAPTIVE';
export type ResponseStatus = 'ANSWERED' | 'UNANSWERED' | 'MARKED_REVIEW';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  plan: Plan;
  planExpiry?: string | null;
  instituteId?: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  subject: Subject;
  chapter: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  solution: string;
  year?: number | null;
  examType: ExamType;
  ntaWeightage: number;
  createdBy: string;
  createdAt: string;
}

export interface Test {
  id: string;
  title: string;
  type: TestType;
  examType: ExamType;
  durationMinutes: number;
  totalMarks: number;
  instructions: string;
  scheduledAt?: string | null;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  section: Subject;
  questionOrder: number;
  marksCorrect: number;
  marksIncorrect: number;
}

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string | null;
  totalScore?: number | null;
  physicsScore?: number | null;
  chemistryScore?: number | null;
  mathsScore?: number | null;
  percentile?: number | null;
  rank?: number | null;
  timeTakenSeconds?: number | null;
}

export interface Response {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  timeSpentSeconds: number;
  status: ResponseStatus;
}

export interface Institute {
  id: string;
  name: string;
  city: string;
  state: string;
  adminId?: string | null;
}
