import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/apiBase';

interface AuthUser { id: string; email: string; name?: string | null; isAdmin?: boolean; photoUrl?: string | null; cpf?: string | null; phone?: string | null }
interface AuthState { user: AuthUser | null; token: string | null; loading: boolean }
interface PasswordLoginResult { success: boolean; twoFactorRequired?: boolean; challengeToken?: string; message?: string }
interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<PasswordLoginResult>;
  completeTwoFactorLogin(challengeToken: string, code: string): Promise<PasswordLoginResult>;
  requestOtp(email: string): Promise<{ success: boolean; message?: string }>;
  loginWithOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }>;
  logout(): void; 
  refreshUser(): Promise<void>;
  isLoginModalOpen: boolean;
  loginModalRedirect: string | undefined;
  openLoginModal(redirect?: string): void;
  closeLoginModal(): void;
  loginWelcomeUser: AuthUser | null;
  dismissLoginWelcome(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_TOKEN_KEY = 'AUTH_TOKEN_V1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalRedirect, setLoginModalRedirect] = useState<string | undefined>(undefined);
  const [loginWelcomeUser, setLoginWelcomeUser] = useState<AuthUser | null>(null);
  const oauthWelcomePendingRef = React.useRef(false);

  const getAvatarFallback = (idOrEmail: string | undefined | null) => {
    if (!idOrEmail) return '/avatars/avatar_1.avif';
    let sum = 0;
    for (let i = 0; i < idOrEmail.length; i++) sum += idOrEmail.charCodeAt(i);
    return `/avatars/avatar_${(sum % 47) + 1}.avif`;
  };

  // Carrega token inicial
  useEffect(() => {
    try {
      // First, check if OAuth redirected with a token in the query string (e.g. ?auth_token=...)
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth_token') || params.get('token') || null;
      if (authToken) {
        oauthWelcomePendingRef.current = true;
        try { 
          window.localStorage.setItem(LS_TOKEN_KEY, authToken); 
          window.localStorage.removeItem('EXPLICIT_LOGOUT');
        } catch {}
        setToken(authToken);
        // remove token from URL without reloading
        params.delete('auth_token'); params.delete('token');
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, '', newUrl);
      } else {
        const stored = window.localStorage.getItem(LS_TOKEN_KEY);
        if (stored) {
          try {
            if (window.sessionStorage.getItem('FAUVES_LOGIN_WELCOME_PENDING') === 'true') {
              oauthWelcomePendingRef.current = true;
            }
          } catch {}
          setToken(stored);
        } else {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
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
      const decodedUser: AuthUser = { 
        id: payload.sub, 
        email: payload.email, 
        name: payload.name || null, 
        isAdmin: !!payload.isAdmin,
        photoUrl: payload.photoUrl || payload.picture || getAvatarFallback(payload.email || payload.sub) 
      };
      setUser(decodedUser);
      if (oauthWelcomePendingRef.current) {
        oauthWelcomePendingRef.current = false;
        setLoginWelcomeUser(decodedUser);
        try { window.sessionStorage.removeItem('FAUVES_LOGIN_WELCOME_PENDING'); } catch {}
      }
      setLoading(false); // Set loading false immediately after decoding JWT locally

      // Also try to fetch authoritative user from server (in case name/email changed on backend)
      (async () => {
        try {
          const res = await fetchApi('/api/auth/me', { headers: { Accept: 'application/json' } });
          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data && (data.id || data.user)) {
              const u = data.user || data;
              setUser({ 
                id: u.id || u.sub || payload.sub, 
                email: u.email || payload.email, 
                name: u.name ?? u.nome ?? u.full_name ?? payload.name ?? null, 
                isAdmin: !!u.isAdmin || !!payload.isAdmin,
                photoUrl: u.photoUrl ?? u.photo ?? u.avatarUrl ?? payload.photoUrl ?? payload.picture ?? getAvatarFallback(u.email || payload.email || u.id),
                cpf: u.cpf || null,
                phone: u.phone || null
              });
            }
          } else if (res.status === 401 || res.status === 403) {
            // Token is invalid/expired — clear it so the app stops sending bad credentials
            setToken(null);
            setUser(null);
            try { window.localStorage.removeItem(LS_TOKEN_KEY); } catch {}
          }
        } catch (e) {
          // ignore network errors here; keep token-decoded user as fallback
        }
      })();
    } catch (e) {
      // token inválido -> limpar
      setUser(null);
      setLoading(false);
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
          setUser({ 
            id: u.id || u.sub || user?.id || '', 
            email: u.email || user?.email || '', 
            name: u.name ?? u.nome ?? u.full_name ?? user?.name ?? null, 
            isAdmin: !!u.isAdmin || !!user?.isAdmin,
            photoUrl: u.photoUrl ?? u.photo ?? u.avatarUrl ?? user?.photoUrl ?? getAvatarFallback(u.email || u.id),
            cpf: u.cpf || null,
            phone: u.phone || null
          });
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

  const persistLogin = useCallback((data: any, fallbackEmail: string): PasswordLoginResult => {
    if (!data?.token) return { success: false };
    const signedInUser: AuthUser = {
      id: data.user?.id || data.user?.sub || fallbackEmail,
      email: data.user?.email || fallbackEmail,
      name: data.user?.name ?? data.user?.nome ?? null,
      isAdmin: Boolean(data.user?.isAdmin),
      photoUrl: data.user?.photoUrl ?? data.user?.photo ?? data.user?.avatarUrl ?? getAvatarFallback(data.user?.email || fallbackEmail),
      cpf: data.user?.cpf || null,
      phone: data.user?.phone || null,
    };
    setToken(data.token);
    setUser(signedInUser);
    setLoginWelcomeUser(signedInUser);
    try {
      window.localStorage.setItem(LS_TOKEN_KEY, data.token);
      window.localStorage.removeItem('EXPLICIT_LOGOUT');
    } catch {}
    return { success: true };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<PasswordLoginResult> => {
    try {
      const res = await fetchApi('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) return { success: false, message: 'Credenciais inválidas' };
      const data = await res.json();
      if (data?.twoFactorRequired && data?.challengeToken) return { success: false, twoFactorRequired: true, challengeToken: data.challengeToken };
      return persistLogin(data, email);
    } catch (e) {
      return { success: false, message: 'Erro de conexão' };
    }
  }, [persistLogin]);

  const completeTwoFactorLogin = useCallback(async (challengeToken: string, code: string): Promise<PasswordLoginResult> => {
    try {
      const response = await fetchApi('/api/auth/login/2fa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeToken, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, message: data.message || data.error || 'Código inválido ou expirado' };
      return persistLogin(data, data.user?.email || '');
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  }, [persistLogin]);

  const requestOtp = useCallback(async (email: string) => {
    try {
      const res = await fetchApi('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, message: data?.message || 'Falha ao solicitar código' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro de conexão' };
    }
  }, []);

  const loginWithOtp = useCallback(async (email: string, otp: string) => {
    try {
      const res = await fetchApi('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok && data?.token) {
        const signedInUser: AuthUser = {
          id: data.user?.id || data.user?.sub || email,
          email: data.user?.email || email,
          name: data.user?.name ?? data.user?.nome ?? null,
          isAdmin: Boolean(data.user?.isAdmin),
          photoUrl: data.user?.photoUrl ?? data.user?.photo ?? data.user?.avatarUrl ?? getAvatarFallback(data.user?.email || email),
          cpf: data.user?.cpf || null,
          phone: data.user?.phone || null,
        };
        setToken(data.token);
        setUser(signedInUser);
        setLoginWelcomeUser(signedInUser);
        try { 
          window.localStorage.setItem(LS_TOKEN_KEY, data.token); 
          window.localStorage.removeItem('EXPLICIT_LOGOUT');
        } catch {}
        return { success: true };
      }
      return { success: false, message: data?.message || 'Código inválido ou expirado' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro de conexão' };
    }
  }, []);

  const logout = useCallback(() => {
    if (token) {
      void fetchApi('/account-settings/security/session/current', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null); setUser(null);
    try { 
      window.localStorage.removeItem(LS_TOKEN_KEY); 
      window.localStorage.setItem('EXPLICIT_LOGOUT', 'true');
    } catch {}
    // Return to the public landing and reload so every authenticated state is cleared.
    setTimeout(() => window.location.assign('/'), 100);
  }, []);

  const openLoginModal = useCallback((redirect?: string) => {
    setLoginModalRedirect(redirect);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    // Delay clearing redirect so modal can finish transitions if needed
    setTimeout(() => setLoginModalRedirect(undefined), 300);
  }, [token]);

  const dismissLoginWelcome = useCallback(() => {
    setLoginWelcomeUser(null);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refreshUser();
    };
    window.addEventListener('profile-updated', handleUpdate);
    return () => window.removeEventListener('profile-updated', handleUpdate);
  }, [refreshUser]);

  const value: AuthContextValue = { 
    user, 
    token, 
    loading, 
    login,
    completeTwoFactorLogin,
    requestOtp,
    loginWithOtp,
    logout, 
    refreshUser,
    isLoginModalOpen,
    loginModalRedirect,
    openLoginModal,
    closeLoginModal,
    loginWelcomeUser,
    dismissLoginWelcome,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
