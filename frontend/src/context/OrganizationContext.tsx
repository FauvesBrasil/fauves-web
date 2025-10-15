import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/apiBase';

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  site?: string;
  bio?: string;
  description?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
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
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const LS_KEY = 'selectedOrgId';
const ORG_CACHE_KEY = 'ORG_CACHE_V1';
const ORG_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: userLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [fromOrgName, setFromOrgName] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const prevOrgs = orgsRef.current || [];
    try {
      // Busca userId do usuário logado via AuthContext
      const userId = user?.id;
      if (!userId) {
        setOrgs([]); setSelectedOrg(null); setLoading(false); return;
      }
  let finalList: Organization[] = [];
      // First try a same-origin quick fetch (relative path). In many deployments
      // the frontend is served from the same host as the backend and this avoids
      // a potentially slow or mis-resolved apiBase probe that could point to
      // localhost or another host unreachable from the client.
      try {
        const relStart = Date.now();
        // include token if available so same-origin endpoints that require
        // Bearer auth succeed (matches fetchApi behavior)
        let relHeaders: Record<string,string> = { Accept: 'application/json' };
        try { const t = window.localStorage.getItem('AUTH_TOKEN_V1'); if (t) relHeaders['Authorization'] = 'Bearer ' + t; } catch {}
        const relRes = await fetch(`/api/organization?userId=${userId}`, { headers: relHeaders });
        if (relRes && relRes.ok) {
          const relData = await relRes.json().catch(() => null);
          if (relData) {
            let relList: Organization[] = [];
            if (Array.isArray(relData)) relList = relData;
            else if (relData.organizations && Array.isArray(relData.organizations)) relList = relData.organizations;
            else if (relData.items && Array.isArray(relData.items)) relList = relData.items;
            else if (relData.organization && Array.isArray(relData.organization)) relList = relData.organization;
            else if (relData && typeof relData === 'object' && relData.id && !relData.error) relList = [relData];
            if (relList.length) {
              finalList = relList;
              try { window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: finalList })); } catch {}
              console.debug('[OrganizationContext] loaded orgs via same-origin', { count: finalList.length });
              setOrgs(finalList);
              const savedId = localStorage.getItem(LS_KEY);
              applySelection(finalList, savedId);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        // ignore and fall back to the parallel candidate attempts below
        try { console.debug('[OrganizationContext] same-origin fetch error', e); } catch {}
      }

      // Try several endpoints / response shapes because different deployments
      // may expose slightly different organization endpoints. Take the first
      // successful result that yields an array of organizations.
      const attempts = [
        `/api/organization?userId=${userId}`,
        `/api/organizations/by-user?userId=${userId}`,
        `/api/organization/user/${userId}`,
        `/api/organization/equipe?userId=${userId}`,
      ];

      // Fire all attempts in parallel and pick the first successful result that yields organizations.
      const promises = attempts.map(async (path) => {
        const start = Date.now();
        try {
          const res = await fetchApi(path);
          const duration = Date.now() - start;
          if (!res) return null;
          if (res.status === 401) return { unauth: true } as any;
          if (!res.ok) return null;
          const data = await res.json().catch(() => null);
          if (!data) return null;

          // normalize common shapes
          let list: Organization[] = [];
          if (Array.isArray(data)) list = data;
          else if (data.organizations && Array.isArray(data.organizations)) list = data.organizations;
          else if (data.items && Array.isArray(data.items)) list = data.items;
          else if (data.organization && Array.isArray(data.organization)) list = data.organization;
          else if (data && typeof data === 'object' && data.id && !data.error) list = [data];

          return list.length ? { path, list, duration } : null;
        } catch (e) {
          const duration = Date.now() - start;
          return { path, error: String(e?.message || e), duration } as any;
        }
      });

  const settled = await Promise.allSettled(promises);
  const diag: Array<any> = [];
      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value) {
          diag.push({ ok: true, ...(s.value) });
        } else if (s.status === 'rejected') {
          diag.push({ ok: false, error: String((s as any).reason) });
        } else if (s.status === 'fulfilled' && !s.value) {
          // handle null results
          // we cannot know path here, so leave generic
          diag.push({ ok: false, note: 'no data' });
        }
      }

      for (const d of diag) {
        if (d?.unauth) {
          // user unauthorized: clear organizations
          setOrgs([]); setSelectedOrg(null); setLoading(false); return;
        }
        if (d?.list && Array.isArray(d.list) && d.list.length) {
          finalList = d.list;
          try { window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: finalList })); } catch {}
          console.debug('[OrganizationContext] loaded orgs via candidate', { path: d.path, count: finalList.length });
          setOrgs(finalList);
          const savedId = localStorage.getItem(LS_KEY);
          applySelection(finalList, savedId);
          // orgs loaded; keep silent in production and development
          break;
        }
      }

      // nothing returned
      if (!finalList.length) {
        // If we had previously cached orgs locally, keep showing them instead of blanking the UI.
        if (prevOrgs && prevOrgs.length) {
          console.warn('[OrganizationContext] refresh failed but previous orgs exist; keeping local cache');
          setError('Falha ao atualizar organizações — mantendo dados em cache');
        } else {
          setOrgs([]);
          setSelectedOrg(null);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar organizações');
      // Preserve previous orgs if available to avoid blanking the UI on intermittent network errors
      if (!prevOrgs || !prevOrgs.length) {
        setOrgs([]);
        setSelectedOrg(null);
      } else {
        console.warn('[OrganizationContext] refresh threw but preserving previous orgs', e);
      }
    } finally {
      setLoading(false);
    }
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
    setOrgs(prev => {
      if (prev.some(o => o.id === org.id)) return prev;
      const next = [...prev, org];
      try { window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ ts: Date.now(), orgs: next })); } catch {}
      return next;
    });
    setSelectedOrg(prev => {
      if (prev?.id === org.id) return prev;
      try { localStorage.setItem(LS_KEY, org.id); } catch (e) {}
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

    if (orgs.length === 0) {
      refresh();
    } else {
      // still refresh in background to get fresh data
      refresh();
    }
    // Atualiza organizações quando usuário muda
    // Não precisa listener do supabase
  }, [refresh, clear, orgs.length, user]);

  // Expose a dev-only helper to force a refresh from the console for diagnostics
  useEffect(() => {
    return () => {};
  }, [refresh]);

  const value = useMemo<OrganizationContextValue>(() => ({
    orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, addOrganization, clear,
    transitioning, fromOrgName
  }), [orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, addOrganization, clear, transitioning, fromOrgName]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};
