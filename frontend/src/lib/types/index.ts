export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type Plan = 'FREE' | 'PRO' | 'ELITE';

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
  isActive: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authInitialized: boolean;
}
