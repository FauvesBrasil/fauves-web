import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/apiBase';

interface AuthUser { id: string; email: string; name?: string | null; isAdmin?: boolean }
interface AuthState { user: AuthUser | null; token: string | null; loading: boolean }
interface AuthContextValue extends AuthState { login(email: string, password: string): Promise<boolean>; logout(): void; refreshUser(): Promise<void> }

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_TOKEN_KEY = 'AUTH_TOKEN_V1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega token inicial
  useEffect(() => {
    try {
      // First, check if OAuth redirected with a token in the query string (e.g. ?auth_token=...)
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth_token') || params.get('token') || null;
      if (authToken) {
        try { window.localStorage.setItem(LS_TOKEN_KEY, authToken); } catch {}
        setToken(authToken);
        // remove token from URL without reloading
        params.delete('auth_token'); params.delete('token');
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, '', newUrl);
      } else {
        const stored = window.localStorage.getItem(LS_TOKEN_KEY);
        if (stored) setToken(stored);
      }
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

      // Also try to fetch authoritative user from server (in case name/email changed on backend)
      (async () => {
        try {
          const res = await fetchApi('/api/auth/me', { headers: { Accept: 'application/json' } });
          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data && (data.id || data.user)) {
              const u = data.user || data;
              setUser({ id: u.id || u.sub || payload.sub, email: u.email || payload.email, name: u.name ?? u.nome ?? u.full_name ?? payload.name ?? null, isAdmin: !!u.isAdmin || !!payload.isAdmin });
            }
          }
        } catch (e) {
          // ignore network errors here; keep token-decoded user as fallback
        }
      })();
    } catch (e) {
      // token inválido -> limpar
      console.warn('[Auth] falha ao decodificar token', e);
      setUser(null);
    }
  }, [token]);

  // Expose a refreshUser API that callers can use after making server-side changes
  // Deduplicated refreshUser: share a single in-flight promise and rate-limit
  const refreshPromiseRef = React.useRef<Promise<void> | null>(null);
  const lastRefreshTsRef = React.useRef<number>(0);
  const refreshUser = useCallback(async () => {
    try { (window as any).__AUTH_REFRESH_COUNT__ = ((window as any).__AUTH_REFRESH_COUNT__ || 0) + 1; } catch {}
    if (!token) return;
    const now = Date.now();
    const MIN_INTERVAL = 2000; // 2s
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    if (now - lastRefreshTsRef.current < MIN_INTERVAL) return;

    const p = (async () => {
      lastRefreshTsRef.current = Date.now();
      try {
        const res = await fetchApi('/api/auth/me', { headers: { Accept: 'application/json' } });
        try { (window as any).__AUTH_REFRESH_LAST__ = { ts: Date.now(), status: res?.status || null }; } catch {}
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setToken(null); setUser(null);
            try { window.localStorage.removeItem(LS_TOKEN_KEY); } catch {}
          }
          return;
        }
        const data = await res.json().catch(() => null);
        if (data) {
          const u = data.user || data;
          setUser({ id: u.id || u.sub || user?.id || '', email: u.email || user?.email || '', name: u.name ?? u.nome ?? u.full_name ?? user?.name ?? null, isAdmin: !!u.isAdmin || !!user?.isAdmin });
        }
      } catch (e) {
        // ignore
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = p;
    return p;
  }, [token, user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetchApi('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
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

  const value: AuthContextValue = { user, token, loading, login, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
