import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import * as authApi from '@/lib/authApi';
import type { AuthUser } from '@/lib/authApi';
import { setAuthUnauthorizedHandler } from '@/lib/authUnauthorized';
import { getStoredToken, setStoredToken } from '@/lib/authSession';

function parseUserFromToken(token: string): AuthUser | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { sub?: string; email?: string };
    if (!payload.sub || !payload.email) return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthSessionSync() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    setAuthUnauthorizedHandler(async () => {
      await signOut();
      router.replace('/login');
    });
    return () => setAuthUnauthorizedHandler(null);
  }, [router, signOut]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await getStoredToken();
      if (cancelled) return;
      setToken(t);
      if (t) setUser(parseUserFromToken(t));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await authApi.loginApi(email, password);
    await setStoredToken(t);
    setToken(t);
    setUser(u);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await authApi.registerApi(email, password);
    await setStoredToken(t);
    setToken(t);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signUp, signOut }),
    [token, user, loading, signIn, signUp, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      <AuthSessionSync />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
