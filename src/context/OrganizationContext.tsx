import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchApi } from '@/lib/apiBase';

export interface Organization {
  id: string;
  name: string;
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
  clear: () => void;
  transitioning: boolean;
  fromOrgName: string | null;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const LS_KEY = 'selectedOrgId';

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [fromOrgName, setFromOrgName] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

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
    try {
      // Tentativa de chamada autenticada (JWT) sem userId na query
      const res = await fetchApi('/api/organization');
      if (res.status === 401) {
        setOrgs([]); setSelectedOrg(null); return; // usuário não autenticado via JWT
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Organization[] = Array.isArray(data) ? data : [];
      setOrgs(list);
      const savedId = localStorage.getItem(LS_KEY);
      applySelection(list, savedId);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar organizações');
      setOrgs([]);
      setSelectedOrg(null);
    } finally {
      setLoading(false);
    }
  }, [applySelection]);

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

  // Initial & auth change
  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) {
        clear();
      } else if (session.user.id !== userIdRef.current) {
        refresh();
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [refresh, clear]);

  const value = useMemo<OrganizationContextValue>(() => ({
    orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, clear,
    transitioning, fromOrgName
  }), [orgs, selectedOrg, loading, error, setSelectedOrgById, refresh, clear, transitioning, fromOrgName]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};
