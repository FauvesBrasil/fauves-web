import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthUser { id: string; email: string; name?: string | null; isAdmin?: boolean }
interface AuthState { user: AuthUser | null; token: string | null; loading: boolean }
interface AuthContextValue extends AuthState { login(email: string, password: string): Promise<boolean>; logout(): void; }

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_TOKEN_KEY = 'AUTH_TOKEN_V1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega token inicial
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LS_TOKEN_KEY);
      if (stored) setToken(stored);
    } catch {}
    setLoading(false);
  }, []);

  // Sempre que o token mudar, (re)constrói o user a partir do payload do JWT
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );
      const payload = JSON.parse(jsonPayload);
      setUser({ id: payload.sub, email: payload.email, name: payload.name || null, isAdmin: !!payload.isAdmin });
    } catch (e) {
      // token inválido -> limpar
      console.warn('[Auth] falha ao decodificar token', e);
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || null);
        try { window.localStorage.setItem(LS_TOKEN_KEY, data.token); } catch {}
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[Auth] login error', e);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    try { window.localStorage.removeItem(LS_TOKEN_KEY); } catch {}
  }, []);

  const value: AuthContextValue = { user, token, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
