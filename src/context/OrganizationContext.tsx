import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/apiBase';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  coverUrl?: string;
  site?: string;
  bio?: string;
  description?: string;
  tags?: string[];
  instagram?: string;
  facebook?: string;
  twitter?: string; // X (antigo Twitter) pode vir como 'twitter'
  youtube?: string;
  tiktok?: string;
  x?: string; // se backend usar 'x' em vez de 'twitter'
  telegram?: string;
  whatsapp?: string;
  messenger?: string;
  discord?: string;
  spotify?: string;
  soundcloud?: string;
  instagramChannel?: string;
  // General contact/location
  contactEmail?: string;
  showContactEmail?: boolean;
  locationText?: string;
  artistsMode?: 'popular' | 'recent' | 'hidden';
  createdAt?: string;
  updatedAt?: string;
}

interface OrganizationContextValue {
  orgs: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  error: string | null;
  setSelectedOrgById: (id: string) => void;
  refresh: () => Promise<void>;
  addOrganization: (org: Organization) => void;
  clear: () => void;
  transitioning: boolean;
  fromOrgName: string | null;
  hasAttemptedRefresh: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const LS_KEY = 'selectedOrgId';
const ORG_CACHE_KEY = 'ORG_CACHE_V1';
const ORG_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: userLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true); // inicia como carregando para evitar redirects antes do primeiro refresh
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [fromOrgName, setFromOrgName] = useState<string | null>(null);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const userIdRef = useRef<string | null | undefined>(undefined);
  const orgsRef = useRef<Organization[]>(orgs);
  useEffect(() => { orgsRef.current = orgs; }, [orgs]);

  const applySelection = useCallback((list: Organization[], preferredId?: string | null) => {
    if (!list.length) {
      setSelectedOrg(null);
      return;
    }
    const fromPreferred = preferredId ? list.find(o => o.id === preferredId) : null;
    const next = fromPreferred || list[0];
    setSelectedOrg(next);
    if (next) localStorage.setItem(LS_KEY, next.id);
  }, []);

  // Deduplication and rate-limiting for refresh()
  const refreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastRefreshTsRef = useRef<number>(0);


  const refresh = useCallback(async () => {
    // Dev-only instrumentation: count calls and occasionally log a minimal stack
    try {
      if (!import.meta.env.PROD) {
        (window as any).__ORG_REFRESH_CALLS__ = ((window as any).__ORG_REFRESH_CALLS__ || 0) + 1;
        const lastLog = (window as any).__ORG_REFRESH_LAST_LOG__ || 0;
        if (Date.now() - lastLog > 2000) {
          try {
            // capture a minimal stack to help trace caller sites (may be empty in some browsers)
            const err = new Error('org-refresh-trace');
            const stack = err.stack ? err.stack.split('\n').slice(2, 6).join('\n') : '(no-stack)';
            // eslint-disable-next-line no-console
            console.debug('[OrganizationContext] refresh() called (dev); recent count=', (window as any).__ORG_REFRESH_CALLS__, '\n', stack);
          } catch (e) {}
          (window as any).__ORG_REFRESH_LAST_LOG__ = Date.now();
        }
      }
    } catch (e) {}
    // Avoid multiple concurrent refreshes and rate-limit to 2s
    const now = Date.now();
    const MIN_INTERVAL = 2000;
    // BUILD_INFO log para confirmar deploy (DEBUG_20260330_2)
    console.debug(`[OrganizationContext] refresh() starting for user: ${user?.email} (v:20260330_1520)`);
    console.log('[OrganizationContext] refresh() triggered. userLoading:', userLoading, 'userId:', user?.id);
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    
    // Disable interval-based throttling temporarily to ensure we pick up DB fixes
    // if (now - lastRefreshTsRef.current < MIN_INTERVAL && orgsRef.current && orgsRef.current.length) { ... }
    
    const p = (async () => {
      lastRefreshTsRef.current = Date.now();
      refreshingRef.current = true;
      setLoading(true);
      setError(null);
      const prevOrgs = orgsRef.current || [];
      const uid = user?.id; // keep local reference
      
      try {
        // Busca userId do usuário logado via AuthContext
        const userId = uid;
        if (!userId) {
          console.log('[OrganizationContext] No userId available, can\'t refresh list');
          setOrgs([]); setSelectedOrg(null); setLoading(false); return;
        }

        console.log('[OrganizationContext] Fetching from /api/organization/list for:', userId);

        let finalList: Organization[] = [];
        
        // 1. First try: Primary relative path (same-origin). Most reliable in production.
        try {
          const relRes = await fetchApi(`/api/organization/list?userId=${userId}`, { headers: { Accept: 'application/json' } });
          if (relRes && relRes.ok) {
            const relData = await relRes.json().catch(() => null);
            if (relData) {
              let relList: Organization[] = [];
              if (Array.isArray(relData)) relList = relData;
              else if (relData.organizations && Array.isArray(relData.organizations)) relList = relData.organizations;
              else if (relData.items && Array.isArray(relData.items)) relList = relData.items;
              else if (relData.organization && Array.isArray(relData.organization)) relList = relData.organization;
              else if (relData && typeof relData === 'object' && relData.id && !relData.error) relList = [relData];
              
              if (relList && relList.length > 0) {
                finalList = relList;
                console.debug('[OrganizationContext] Loaded orgs via primary endpoint', { count: finalList.length });
                try { window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: finalList })); } catch {}
                setOrgs(finalList);
                applySelection(finalList, localStorage.getItem(LS_KEY));
                setLoading(false);
                return;
              }
              console.debug('[OrganizationContext] Primary endpoint returned empty list, trying candidates');
            }
          }
        } catch (e) {
          console.debug('[OrganizationContext] Primary endpoint fetch error', e);
        }

        // 2. Parallel attempts for legacy or alternative endpoints
        const attempts = [
          `/api/organization?userId=${userId}`, // repeat just in case of transient error
          `/api/organization/user/${userId}`,
          `/api/organization/equipe?userId=${userId}`,
        ];

        const promises = attempts.map(async (path) => {
          const start = Date.now();
          let duration = 0;
          try {
            const res = await fetchApi(path);
            duration = Date.now() - start;
            if (!res) return null;
            if (res.status === 401) return { unauth: true, path } as any;
            if (!res.ok) return null;
            const data = await res.json().catch(() => null);
            if (!data) return null;

            const list = Array.isArray(data) ? data : (data.organizations || data.items || data.organization || (data.id && !data.error ? [data] : []));
            
            // handling for /equipe which might return { organizationId: ... }
            if (data?.organizationId && (!list || list.length === 0)) {
              return { path, list: [], organizationId: data.organizationId, duration };
            }

            return list.length ? { path, list, duration } : null;
          } catch (e) {
            duration = Date.now() - start;
            return { path, error: String(e?.message || e), duration } as any;
          }
        });

        const settled = await Promise.allSettled(promises);
        for (const s of settled) {
          if (s.status === 'fulfilled' && s.value) {
            const val = s.value;
            if (val.unauth) {
              console.warn('[OrganizationContext] Path unauth:', val.path);
              continue;
            }
            if (val.list && val.list.length > 0) {
              finalList = val.list;
              console.debug('[OrganizationContext] Loaded orgs via candidate', { path: val.path, count: finalList.length });
              break;
            }
          }
        }

        if (finalList.length > 0) {
          try { window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: finalList })); } catch {}
          setOrgs(finalList);
          applySelection(finalList, localStorage.getItem(LS_KEY));
        } else {
          console.warn('[OrganizationContext] No organizations found for user after all probes.', { email: user?.email, userId: user?.id });
          if (prevOrgs && prevOrgs.length) {
            console.warn('[OrganizationContext] Preserving existing cached orgs to avoid UI blank-out');
          } else {
            setOrgs([]);
            setSelectedOrg(null);
          }
        }
      } catch (e: any) {
        console.error('[OrganizationContext] Fatal error during refresh():', e);
        setError(e?.message || 'Falha ao carregar organizações');
      } finally {
        setLoading(false);
        setHasAttemptedRefresh(true);
        refreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = p;
    return p;
  }, [applySelection, user, userLoading]);

  const setSelectedOrgById = useCallback((id: string) => {
    setSelectedOrg(prev => {
      if (prev?.id === id) return prev;
      const found = orgs.find(o => o.id === id) || null;
      if (found) {
        // dispara animação de transição
        setFromOrgName(prev?.name || null);
        setTransitioning(true);
        localStorage.setItem(LS_KEY, found.id);
        // finaliza transição após timeout (match overlay animation)
        setTimeout(() => {
          setTransitioning(false);
          setFromOrgName(null);
        }, 900);
        return found;
      }
      return prev;
    });
  }, [orgs]);

  const clear = useCallback(() => {
    setOrgs([]);
    setSelectedOrg(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  const addOrganization = useCallback((org: Organization) => {
    console.log('[OrganizationContext] addOrganization called with:', org?.id, org?.name);
    setOrgs(prev => {
      if (prev.some(o => o.id === org.id)) {
        console.log('[OrganizationContext] Organization already exists, not adding');
        return prev;
      }
      const next = [...prev, org];
      console.log('[OrganizationContext] Adding organization, new count:', next.length);
      try { 
        window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: next })); 
        console.log('[OrganizationContext] Updated localStorage cache');
      } catch (e) {
        console.warn('[OrganizationContext] Failed to update cache:', e);
      }
      return next;
    });
    setSelectedOrg(prev => {
      if (prev?.id === org.id) {
        console.log('[OrganizationContext] Organization already selected');
        return prev;
      }
      try { 
        localStorage.setItem(LS_KEY, org.id); 
        console.log('[OrganizationContext] Set selected org in localStorage:', org.id);
      } catch (e) {
        console.warn('[OrganizationContext] Failed to set selected org:', e);
      }
      return org;
    });
  }, []);

  // Initial & auth change
  useEffect(() => {
    // Try to seed from cache so UI doesn't flash empty while backend responds
    try {
      const raw = window.localStorage.getItem(ORG_CACHE_KEY);
      if (raw && orgs.length === 0) {
        const parsed = JSON.parse(raw);
        const age = Date.now() - (parsed?.ts || 0);
        if (Array.isArray(parsed?.orgs) && age < ORG_CACHE_TTL) {
          setOrgs(parsed.orgs);
          const savedId = localStorage.getItem(LS_KEY);
          applySelection(parsed.orgs, savedId);
        }
      }
    } catch (e) {}

    // Only call refresh on mount or when the user changes. Avoid depending on orgs.length
    // which would cause a refresh -> setOrgs -> effect loop.
    // Only trigger refresh once the auth state is settled to avoid repeated probes while
    // the AuthContext is still initializing (userLoading=true).
    if (!userLoading && user?.id) {
      console.log('[OrganizationContext] User ready, triggering aggressive refresh for:', user.id);
      void refresh();
    }
    // Atualiza organizações quando usuário muda
    // Não precisa listener do supabase
  }, [user, userLoading, refresh]);

  // Expose a dev-only helper to force a refresh from the console for diagnostics
  useEffect(() => {
    return () => {};
  }, [refresh]);

  const value = useMemo<OrganizationContextValue>(() => ({
    orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, addOrganization, clear,
    transitioning, fromOrgName, hasAttemptedRefresh
  }), [orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, addOrganization, clear, transitioning, fromOrgName, hasAttemptedRefresh]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};
