import { useState, useCallback } from 'react';

// 后端 API 地址
// Capacitor 原生应用中页面从本地加载，必须用完整地址
const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
const API_BASE_URL = isNative
  ? 'http://106.14.148.230:8000/api'
  : '/api';

export interface AuthUser {
  email: string;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const AUTH_KEY = 'cloud-auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const user = JSON.parse(raw) as AuthUser;
      if (user.token) {
        return { user, isAuthenticated: true };
      }
    }
  } catch { /* ignore */ }
  return { user: null, isAuthenticated: false };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return data.detail || '登录失败';
      }

      const user: AuthUser = { email: data.email, token: data.token };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setState({ user, isAuthenticated: true });
      return null; // success
    } catch {
      return '网络错误，请检查网络连接';
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return data.detail || '注册失败';
      }

      const user: AuthUser = { email: data.email, token: data.token };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setState({ user, isAuthenticated: true });
      return null; // success
    } catch {
      return '网络错误，请检查网络连接';
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setState({ user: null, isAuthenticated: false });
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
  };
}
