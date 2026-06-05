"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api/apiClient';
import { User, AuthState } from '../../lib/types';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<unknown>;
  register: (data: Record<string, unknown>) => Promise<unknown>;
  verifyOtp: (phone: string, otp: string) => Promise<unknown>;
  logout: () => Promise<void>;
  forgotPassword: (phone: string) => Promise<unknown>;
  resetPassword: (data: Record<string, unknown>) => Promise<unknown>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const router = useRouter();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setAuthInitialized(true);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const handleAuthLogout = () => {
      clearSession();
    };

    window.addEventListener('auth-logout', handleAuthLogout);

    const bootstrapSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data && res.data.success) {
            setUser(res.data.data);
            setIsAuthenticated(true);
          } else {
            clearSession();
          }
        } catch (err) {
          console.error('Bootstrapping session failed:', err);
        }
      }
      setIsLoading(false);
      setAuthInitialized(true);
    };

    bootstrapSession();

    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [clearSession]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { identifier, password });
      if (res.data && res.data.success) {
        const { access_token, refresh_token, user: userData } = res.data.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        setUser(userData);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return res.data.data;
      }
    } catch (err: unknown) {
      setIsLoading(false);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        throw (err as { response?: { data?: unknown } }).response?.data || err;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register', data);
      return res.data;
    } catch (err: unknown) {
      setIsLoading(false);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        throw (err as { response?: { data?: unknown } }).response?.data || err;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', { phone, otp });
      if (res.data && res.data.success) {
        const { access_token, refresh_token, user: userData } = res.data.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        setUser(userData);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return res.data.data;
      }
    } catch (err: unknown) {
      setIsLoading(false);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        throw (err as { response?: { data?: unknown } }).response?.data || err;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      clearSession();
    }
  };

  const forgotPassword = async (phone: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { phone });
      return res.data;
    } catch (err: unknown) {
      setIsLoading(false);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        throw (err as { response?: { data?: unknown } }).response?.data || err;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/reset-password', data);
      return res.data;
    } catch (err: unknown) {
      setIsLoading(false);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        throw (err as { response?: { data?: unknown } }).response?.data || err;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    try {
      const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
      if (res.data && res.data.success) {
        const { access_token, refresh_token } = res.data.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
      }
    } catch {
      clearSession();
    }
  };

  const refreshUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error('Refreshing user profile failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authInitialized,
        login,
        register,
        verifyOtp,
        logout,
        forgotPassword,
        resetPassword,
        refreshSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
