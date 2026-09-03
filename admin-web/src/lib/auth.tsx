'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';
import type { Admin } from './types';

type AuthContextValue = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdmin: (patch: Partial<Admin>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api<Admin & { role: string }>('/api/me');
        if (!cancelled) {
          if (me.role !== 'ADMIN') {
            clearToken();
            setAdmin(null);
          } else {
            setAdmin(me);
          }
        }
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ access_token: string; user: Admin }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.user.role !== 'ADMIN') {
      throw new Error('NOT_ADMIN');
    }
    setToken(data.access_token);
    setAdmin(data.user);
  }, []);

  /**
   * Logout wipes every trace of the session client-side, not just the token -
   * cached admin data can contain PII and must not survive for the next
   * person at this machine.
   */
  const logout = useCallback(() => {
    clearToken();
    setAdmin(null);
  }, []);

  const updateAdmin = useCallback((patch: Partial<Admin>) => {
    setAdmin((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
