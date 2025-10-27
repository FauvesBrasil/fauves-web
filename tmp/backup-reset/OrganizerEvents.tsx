import React, { useEffect, useMemo, useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { toast } from '@/components/ui/sonner';
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Calendar } from "lucide-react";
import CollectionDrawer from "@/components/CollectionDrawer";
import { ensureApiBase, apiUrl } from '@/lib/apiBase';
import { useOrganization } from '@/context/OrganizationContext';

// Event projection used in this screen
interface OrgEvent {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  status?: string | null;
  privacy?: string | null;
  type?: string | null;
  image?: string | null;
  soldCount?: number | null;
  capacity?: number | null;
  grossTotal?: number | null;
  organizerId?: string | null;
  organizationId?: string | null;
}

interface OrganizationOption { id: string; name: string }

interface CollectionItem {
  id: string;
  title: string;
  description?: string | null;
  bannerImage?: string | null;
  organizerName?: string | null;
  upcomingCount?: number;
  slug?: string;
  published?: boolean;
  organizerId?: string | null;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const OrganizerEvents: React.FC = () => {
  const [fabOpen, setFabOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const { selectedOrg, orgs, loading: loadingOrgs } = useOrganization();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const headers: Record<string,string> = { Accept: 'application/json' };
    try {
      const t = window.localStorage.getItem('AUTH_TOKEN_V1');
      if (t) headers['Authorization'] = 'Bearer ' + t;
    } catch (e) {}
    return headers;
  };

  // helpful flag for showing a small dev-only debug panel when developing locally
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Collections state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsSearch, setCollectionsSearch] = useState("");
  const [showCollections, setShowCollections] = useState(false);
  const [lastEventDebug, setLastEventDebug] = useState<any | null>(null);
  const [showFullEventDebug, setShowFullEventDebug] = useState(false);
  const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);
  const [collectionDrawerMode, setCollectionDrawerMode] = useState<'create'|'edit'>('create');
  const [editingCollection, setEditingCollection] = useState<any|null>(null);
  

  // Derive organizations from loaded events if missing
  useEffect(() => {
    if (organizations.length === 0 && events.length > 0) {
      const map = new Map<string, OrganizationOption>();
      for (const ev of events) {
        const oid = (ev as any).organizationId || ev.organizerId;
        const oname = (ev as any).organizationName;
        if (oid) if (!map.has(oid)) map.set(oid, { id: oid, name: oname || 'Organização' });
      }
      if (map.size) setOrganizations(prev => prev.length ? prev : Array.from(map.values()));
    }
  }, [events, organizations]);

  // Enrich placeholder org names
  useEffect(() => {
    const enrich = async () => {
      const need = organizations.filter(o => o.name === 'Organização');
      if (!need.length) return;
      const updated: OrganizationOption[] = [];
      for (const o of need) {
        try {
          const r = await fetch(`/api/organization/${o.id}`, { headers: getAuthHeaders() });
          const data = await r.json();
          if (data?.name) updated.push({ id: o.id, name: data.name });
        } catch {}
      }
      if (updated.length) setOrganizations(prev => prev.map(p => updated.find(u => u.id === p.id) || p));
    };
    enrich();
  }, [organizations]);

  // Bootstrap
  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
  const uid = userId;
  if (!uid) { setEvents([]); setCollections([]); return; }
        await ensureApiBase();
        // Load events and organizations as before (single canonical requests)
        try {
          const eventsRes = await fetch(`/api/events/by-user?userId=${uid}`, { headers: getAuthHeaders() });
          const eventsData = eventsRes.ok ? await eventsRes.json() : [];
          setEvents(Array.isArray(eventsData) ? eventsData : []);
          (window as any).__dbgEventsByUser = eventsData;
        } catch (e) { console.debug('events by-user fetch failed', e); }
        try {
          const orgsRes = await fetch(`/api/organizations/by-user?userId=${uid}`, { headers: getAuthHeaders() });
          const orgsData = orgsRes.ok ? await orgsRes.json() : [];
          if (Array.isArray(orgsData)) setOrganizations(orgsData);
          (window as any).__dbgOrgsByUser = orgsData;
        } catch (e) { console.debug('organizations by-user fetch failed', e); }
        // Load user-scoped collections (single canonical path)
        try {
          const colsRes = await fetch(`/api/collections/by-user?userId=${uid}`, { headers: getAuthHeaders() });
          const cols = colsRes.ok ? await colsRes.json() : null;
          if (Array.isArray(cols)) setCollections(cols);
        } catch (e) { console.debug('collections by-user fetch failed', e); }
      } catch (e) {
        console.warn('[OrganizerEvents.boot] falhou', e);
      } finally { setLoading(false); }
    };
    boot();
  }, []);

  // When the selected organization changes, automatically re-scope events
  // to the selected organization (or back to the user's events when
  // selection is cleared). This calls the reusable `refresh` helper which
  // already contains the logic for scoped and unscoped fetches.
  useEffect(() => {
    // Only trigger when we have a userId (otherwise refresh would early-return).
    if (!userId) return;
    // call refresh to fetch scoped events for the new selectedOrg
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg?.id, userId]);

  // Helper used across this page to determine whether an event belongs to
  // the currently-selected organization. Some backends use `organizerId`,
  // others `organizationId`, so accept either.
  const belongsToSelected = (evt: any) => {
    if (!selectedOrg?.id) return true; // no org selected -> event is allowed
    return !!evt && (evt.organizerId === selectedOrg.id || evt.organizationId === selectedOrg.id);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = events;
    // If an organization is selected, scope the visible events to those
    // that belong to that organization using the same criterion as
    // `EventPanel` (organizerId || organizationId).
    if (selectedOrg?.id) {
      base = base.filter(e => belongsToSelected(e));
    }
    if (!q) return base;
    return base.filter(e => e.name?.toLowerCase().includes(q));
  }, [events, search]);

  const filteredCollections = useMemo(() => {
    const q = collectionsSearch.trim().toLowerCase();
    // First scope collections to the selected organization (if any).
    let base = collections;
    if (selectedOrg?.id) {
      // Only filter by organization if collection items include an org identifier
      // (some backends use `organizerId`, others `organizationId`). If none of
      // the items have such fields, assume `fetchCollections` already returned
      // an org-scoped list and don't further filter here (avoids empty list).
      const hasOrgField = collections.some(c => (c as any).organizerId || (c as any).organizationId);
      if (hasOrgField) {
        base = base.filter(c => ((c as any).organizerId === selectedOrg.id) || ((c as any).organizationId === selectedOrg.id));
      }
    }
    if (!q) return base;
    return base.filter(c => c.title?.toLowerCase().includes(q));
  }, [collections, collectionsSearch, selectedOrg?.id]);

  const refresh = async () => {
    if (!userId) return;
    try {
      await ensureApiBase();
      if (selectedOrg) {
        const attempts = [
          `/api/organization/${selectedOrg.id}/events`,
          apiUrl(`/api/organization/${selectedOrg.id}/events`),
          `http://localhost:4000/api/organization/${selectedOrg.id}/events`,
          `http://localhost:3000/api/organization/${selectedOrg.id}/events`
        ];
        let gotAny: any[] | null = null;
        for (const u of attempts) {
          try {
            const headers = getAuthHeaders();
            const sentHeaders = { ...headers } as Record<string,string>;
            if (sentHeaders.Authorization) delete sentHeaders.Authorization;
            const r = await fetch(u, { headers });
            let bodyText: string | null = null;
            try { bodyText = await r.text(); } catch {}
            let parsed: any = null;
            try { parsed = bodyText ? JSON.parse(bodyText) : null; } catch {}
            setLastEventDebug({ url: u, status: r.status, ok: r.ok, body: bodyText, bodySnippet: bodyText?.slice?.(0,1200), parsed, sentHeaders });
            if (r.ok) { if (Array.isArray(parsed)) { gotAny = parsed; (window as any).__dbgEventsScopedRefresh = parsed; break; } }
          } catch (e) { setLastEventDebug({ url: u, err: String(e) }); }
        }
        // If organization-scoped fetch returned results, use them. Otherwise
        // fallback to user-scoped events so the UI doesn't become empty
        // silently when the org has no events (better UX).
        if (Array.isArray(gotAny) && gotAny.length > 0) {
          // If backend returned events for the organization but the items
          // don't include organizerId/organizationId fields, tag them here
          // with the selectedOrg id so client-side scoping (belongsToSelected)
          // will accept them. This handles backends that honor the
          // organization query param but omit echoing the id on each item.
          const needTag = selectedOrg && !gotAny.some((it: any) => it.organizerId || it.organizationId);
            if (needTag && selectedOrg?.id) {
            setEvents(gotAny.map((it: any) => ({ ...(it || {}), organizationId: selectedOrg.id, organizerId: selectedOrg.id })));
          } else {
            setEvents(gotAny);
          }
        } else {
          // If org-scoped returned empty, try several alternate event endpoints
          // that some backends expose before falling back to user-level events.
          const normalizeEvents = (raw: any) => {
            if (!raw) return null;
            if (Array.isArray(raw)) return raw;
            if (raw.events && Array.isArray(raw.events)) return raw.events;
            if (raw.data && Array.isArray(raw.data)) return raw.data;
            if (raw.items && Array.isArray(raw.items)) return raw.items;
            if (raw.rows && Array.isArray(raw.rows)) return raw.rows;
            return null;
          };

          const altEventPaths = [
            `/api/events?organizationId=${selectedOrg.id}`,
            `/api/events?organizerId=${selectedOrg.id}`,
            `/api/events/by-organization?organizationId=${selectedOrg.id}`,
            `/api/events/by-organizer?organizerId=${selectedOrg.id}`
          ];
          for (const p of altEventPaths) {
            try {
              const headers = getAuthHeaders();
              const sentHeaders = { ...headers } as Record<string,string>;
              if (sentHeaders.Authorization) delete sentHeaders.Authorization;
              const r = await fetch(p, { headers });
              let bodyText: string | null = null;
              try { bodyText = await r.text(); } catch {}
              let parsed: any = null;
              try { parsed = bodyText ? JSON.parse(bodyText) : null; } catch {}
              setLastEventDebug({ url: p, status: r.status, ok: r.ok, body: bodyText, bodySnippet: bodyText?.slice?.(0,1200), parsed, sentHeaders });
              const norm = normalizeEvents(parsed);
              if (Array.isArray(norm) && norm.length) {
                // same tagging logic for alternate endpoints: if items lack
                // org identifiers but response came from an org-scoped
                // endpoint, attribute them to the selected org
                const needTagAlt = selectedOrg && !norm.some((it: any) => it.organizerId || it.organizationId);
                const finalList = (needTagAlt && selectedOrg?.id) ? norm.map((it: any) => ({ ...(it || {}), organizationId: selectedOrg.id, organizerId: selectedOrg.id })) : norm;
                setEvents(finalList);
                (window as any).__dbgEventsScopedRefresh = finalList;
                gotAny = finalList;
                break;
              }
            } catch (e) { setLastEventDebug({ url: p, err: String(e) }); }
          }
          // After trying alternate org-scoped endpoints, do NOT fall back to
          // user-level events when an organization is explicitly selected.
          // Keep the events list empty so the UI strictly reflects the
          // selected organization's data.
          setEvents([]);
          toast.info('Nenhum evento encontrado para a organização selecionada.');
        }
      } else {
  const attempts = [`/api/events/by-user?userId=${userId}`, apiUrl(`/api/events/by-user?userId=${userId}`), `http://localhost:4000/api/events/by-user?userId=${userId}`, `http://localhost:3000/api/events/by-user?userId=${userId}`];
        for (const u of attempts) {
          try {
            const r = await fetch(u, { headers: getAuthHeaders() });
            if (r.ok) { const list = await r.json(); setEvents(Array.isArray(list) ? list : []); (window as any).__dbgEventsByUser = list; break; }
          } catch {}
        }
      }
    } catch {}
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ensureApiBase();
  const urls = [`/api/event/${deleteTarget}`, apiUrl(`/api/event/${deleteTarget}`), `http://localhost:4000/api/event/${deleteTarget}`, `http://localhost:3000/api/event/${deleteTarget}`];
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'DELETE', headers: getAuthHeaders() });
          if (res.ok) { const j = await res.json(); if (j?.ok) { await refresh(); break; } }
        } catch {}
      }
    } finally { setDeleteTarget(null); }
  };

  const openCreateCollection = () => { setCollectionDrawerMode('create'); setEditingCollection(null); setShowCollectionDrawer(true); };

  // Reusable collections fetcher: try user-scoped (query & path styles) then organization fallbacks
  // fetchCollections accepts a forceReload flag to force fetching from the
  // backend even when we already have collections cached in state. This is
  // useful when the user switches organizations or re-opens the collections
  // tab and we want fresh data.
  const fetchCollections = async (forceReload: boolean = false) => {
    if (!userId) {
      toast.error('Usuário não autenticado — não é possível carregar coleções');
      return;
    }
    setCollectionsLoading(true);
    try {
      await ensureApiBase();
      // If an organization is selected, request organization-scoped collections only.
      if (selectedOrg?.id) {
        try {
          const r = await fetch(`/api/organization/${selectedOrg.id}/collections`, { headers: getAuthHeaders() });
          if (r.ok) {
            const list = await r.json();
            setCollections(Array.isArray(list) ? list : []);
            toast.success('Coleções carregadas');
            return;
          } else {
            setCollections([]);
            toast.error('Nenhuma coleção encontrada para a organização selecionada');
            return;
          }
        } catch (e) {
          console.debug('[fetchCollections] org-scoped request failed', e);
          setCollections([]);
          toast.error('Erro ao carregar coleções da organização');
          return;
        }
      }

      // Otherwise, load user-scoped collections (single canonical path)
      try {
        const r = await fetch(`/api/collections/by-user?userId=${userId}`, { headers: getAuthHeaders() });
        if (r.ok) {
          const list = await r.json();
          setCollections(Array.isArray(list) ? list : []);
          toast.success('Coleções carregadas');
          return;
        }
      } catch (e) {
        console.debug('[fetchCollections] user-scoped request failed', e);
      }
      setCollections([]);
      toast.error('Nenhuma coleção encontrada');
    } catch (e) {
      console.warn('[OrganizerEvents] fetchCollections error', e);
      toast.error('Erro ao carregar coleções');
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    if (showCollections) fetchCollections(true);
  }, [showCollections, organizations, userId, selectedOrg?.id]);

  const handleCollectionSaved = async (col: any) => {
    try {
      setCollections(prev => prev.some(p => p.id === col.id) ? prev : [col, ...prev]);
      try { sessionStorage.setItem('collections-cache', JSON.stringify([col, ...collections])); } catch {}
      await ensureApiBase();
      let oid = col.organizerId;
      if (!oid && userId) {
      const attempts = [`/api/organization/equipe?userId=${userId}`, apiUrl(`/api/organization/equipe?userId=${userId}`), `http://localhost:4000/api/organization/equipe?userId=${userId}`, `http://localhost:3000/api/organization/equipe?userId=${userId}`];
    for (const u of attempts) { try { const r = await fetch(u, { headers: getAuthHeaders() }); if (r.ok) { const j = await r.json(); if (j?.organizationId) { oid = j.organizationId; break; } } } catch {} }
      }
      if (oid) {
    const attempts = [`/api/organization/${oid}/collections`, apiUrl(`/api/organization/${oid}/collections`), `http://localhost:4000/api/organization/${oid}/collections`, `http://localhost:3000/api/organization/${oid}/collections`];
  for (const u of attempts) { try { const r = await fetch(u, { headers: getAuthHeaders() }); if (r.ok) { const list = await r.json(); if (Array.isArray(list) && list.length) { setCollections(list); try { sessionStorage.setItem('collections-cache', JSON.stringify(list)); } catch {}; break; } } } catch {} }
      }
    } catch (e) { console.error('[OrganizerEvents] refresh collections after save failed', e); }
    finally { setShowCollections(true); setShowCollectionDrawer(false); }
  };

  const handleEditCollection = (col: any) => { setCollectionDrawerMode('edit'); setEditingCollection(col); setShowCollectionDrawer(true); };
  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Excluir esta coleção?')) return;
    await ensureApiBase();
  const attempts = [`/api/collection/${id}`, apiUrl(`/api/collection/${id}`), `http://localhost:4000/api/collection/${id}`, `http://localhost:3000/api/collection/${id}`];
  for (const u of attempts) { try { const res = await fetch(u, { method: 'DELETE', headers: getAuthHeaders() }); if (res.ok) { const j = await res.json(); if (j?.ok) { setCollections(prev => prev.filter(c => c.id !== id)); break; } } } catch {} }
  };
  const loadCollectionEvents = async (collectionId: string) => {
    await ensureApiBase();
  const attempts = [`/api/collection/${collectionId}/events`, apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`, `http://localhost:3000/api/collection/${collectionId}/events`];
  for (const u of attempts) { try { const r = await fetch(u, { headers: getAuthHeaders() }); if (r.ok) return r.json(); } catch {} }
    return [];
  };
  const addEventToCollection = async (collectionId: string, eventId: string) => {
    await ensureApiBase();
    const attempts = [`/api/collection/${collectionId}/events`, apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`, `http://localhost:3000/api/collection/${collectionId}/events`];
  for (const u of attempts) { try { await fetch(u, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) }); break; } catch {} }
  };
  const removeEventFromCollection = async (collectionId: string, eventId: string) => {
    await ensureApiBase();
    const attempts = [`/api/collection/${collectionId}/events/${eventId}`, apiUrl(`/api/collection/${collectionId}/events/${eventId}`), `http://localhost:4000/api/collection/${collectionId}/events/${eventId}`, `http://localhost:3000/api/collection/${collectionId}/events/${eventId}`];
  for (const u of attempts) { try { await fetch(u, { method: 'DELETE', headers: getAuthHeaders() }); break; } catch {} }
  };
  const togglePublish = async (c: CollectionItem) => { if (!c.id) return; try { const res = await fetch(`/api/collection/${c.id}/publish`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !c.published }) }); const j = await res.json(); if (j?.collection?.id) { setCollections(prev => prev.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p)); try { sessionStorage.setItem('collections-cache', JSON.stringify(collections.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p))); } catch {} } } catch {} };
  const shareCollection = async (c: CollectionItem) => { if (!c.slug) return; const url = `${window.location.origin}/colecoes/${c.slug}`; if ((navigator as any).share) { try { await (navigator as any).share({ title: c.title, text: c.description || c.title, url }); return; } catch {} } try { await navigator.clipboard.writeText(url); } catch {} };
  const deleteCollection = async (id: string) => { if (!confirm('Excluir esta coleção?')) return; const res = await fetch(`/api/collection/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); const j = await res.json(); if (j?.ok) { if (!userId) return; const orgRes = await fetch(`/api/organization/equipe?userId=${userId}`, { headers: getAuthHeaders() }); const orgJ = await orgRes.json(); const oid = orgJ?.organizationId; if (!oid) return; const r = await fetch(`/api/organization/${oid}/collections`, { headers: getAuthHeaders() }); setCollections(await r.json()); } };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] dark:text-white flex justify-center items-start">{/* aligned with dashboard root */}
      <SidebarMenu activeKeyOverride="eventos" />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">{/* dashboard-sized container */}
        <AppHeader />
        {/* mimic absolute inner layout used on dashboard for consistent left/top spacing */}
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-32">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">Eventos</h1>
          <div className="flex items-center gap-6 border-b border-zinc-200 -mb-2">{/* moved up tighter like dashboard sections */}
            <button onClick={() => setShowCollections(false)} className={`pb-2 ${!showCollections ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold dark:border-indigo-400 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Eventos</button>
            <button onClick={() => setShowCollections(true)} className={`pb-2 ${showCollections ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold dark:border-indigo-400 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Coleções</button>
          </div>
          {!showCollections ? (
            <>
              <div className="flex items-center gap-4 mt-2">{/* simplified: removed placeholder select */}
                <input className="flex-1 h-[46px] px-5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px] bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:placeholder:text-slate-400 dark:text-white" placeholder="Pesquisar eventos" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] shadow-sm mt-4">{/* card style like dashboard's large cards */}
                <table className="w-full text-left">
                  <thead className="bg-[#F6F7FB] dark:bg-[#0b0b0b] text-slate-600 dark:text-slate-300 text-xs font-medium tracking-wide">
                    <tr>
                      <th className="py-4 px-6">Evento</th>
                      <th className="py-4 px-6">Organização</th>
                      <th className="py-4 px-6">Vendidos</th>
                      <th className="py-4 px-6">Bruto</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[13px]">
                    {loading ? (
                      Array.from({length:7}).map((_,i)=>(
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                              <div className="space-y-2">
                                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                          <td className="py-4 px-6 text-right"><div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                          Nenhum evento encontrado para esta organização.
                          <div className="mt-4">
                            <Link to="/create-event" className="inline-flex items-center px-5 h-[42px] rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 text-sm">+ Criar primeiro evento</Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((ev: any) => {
                        const orgName = (ev as any).organizationName || organizations.find(o => o.id === ev.organizationId || o.id === ev.organizerId)?.name || 'Sem organização';
                        // derive status: deleted > ended > published > draft
                        const now = Date.now();
                        const ended = ev.endDate ? (new Date(ev.endDate).getTime() < now) : false;
                        const published = Boolean(ev.isPublished || ev.status === 'published' || ev.status === 'Publicado');
                        const deleted = ev.status === 'deleted';
                        let statusLabel = 'Rascunho';
                        let dotClass = 'bg-zinc-400';
                        let badgeClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[12px]';
                        if (deleted) {
                          statusLabel = 'Excluído';
                          dotClass = 'bg-red-500';
                          badgeClass += ' bg-red-100 text-red-600';
                        } else if (ended) {
                          statusLabel = 'Encerrado';
                          dotClass = 'bg-zinc-400';
                          badgeClass += ' bg-zinc-100 text-zinc-700';
                        } else if (published) {
                          statusLabel = 'Publicado';
                          dotClass = 'bg-green-500';
                          badgeClass += ' bg-green-100 text-green-700';
                        } else {
                          statusLabel = 'Rascunho';
                          dotClass = 'bg-zinc-400';
                          badgeClass += ' bg-zinc-100 text-zinc-700';
                        }

                        return (
                          <tr key={ev.id} className="hover:bg-[#F8F9FC] dark:hover:bg-[#0f0f0f] cursor-pointer transition" onClick={() => navigate(`/painel-evento/${ev.id}`)}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                {ev.image ? (
                                  <img src={ev.image} alt={ev.name || 'evento'} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                                )}
                                <div>
                                  <div className="text-[15px] text-slate-900 dark:text-white font-semibold leading-tight mb-0.5">{ev.name || 'Sem nome'}</div>
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                                    <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <span>{formatDate(ev.startDate)}</span>
                                  </div>
                                  <div className={`text-[11px] font-medium mt-0.5 ${ev.privacy === 'public' ? 'text-[#2A2AD7] dark:text-[#9FB3FF]' : 'text-[#EF4118] dark:text-[#FFB7A6]'}`}>{ev.privacy === 'public' ? 'Público' : 'Privado'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{orgName}</td>
                            <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{Number(ev.soldCount || 0)} / {Number(ev.capacity || 0)}</td>
                            <td className="py-4 px-6 text-slate-700 dark:text-slate-300">R${Number(ev.grossTotal || 0).toFixed(2).replace('.', ',')}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-[12px]">
                                <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
                                <span className="text-slate-700 dark:text-slate-300">{statusLabel}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4 justify-end">
                                <button onClick={(e)=>{e.stopPropagation(); navigate(`/create-event?eventId=${ev.id}`);}} className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800" title="Editar"><Pencil size={18} /></button>
                                <button className="text-slate-400 dark:text-slate-400 hover:text-red-600" title="Excluir" onClick={(e)=>{e.stopPropagation(); setDeleteTarget(ev.id);}}><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-slate-600 mb-6 text-[15px]">Ajude os participantes a encontrarem os melhores eventos criando páginas de coleção para seus eventos relacionados.</p>
              <div className="flex items-center justify-between mb-6 gap-4">
                <input className="flex-1 h-[46px] px-5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px]" placeholder="Pesquisar coleções por título" value={collectionsSearch} onChange={(e) => setCollectionsSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
                {filteredCollections.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-[#E5E7EB] overflow-hidden cursor-pointer bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] hover:shadow-sm transition" onClick={()=>handleEditCollection(c)}>
                    <div className="h-40 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                      {c.bannerImage ? (<img src={c.bannerImage} alt={c.title} className="w-full h-full object-cover" />) : (<span className="text-xs text-zinc-500 dark:text-zinc-400">Sem banner</span>)}
                    </div>
                    <div className="p-5 flex items-start justify-between">
                      <div>
                        <div className="text-slate-900 dark:text-white font-semibold text-[15px] mb-0.5">{c.title}</div>
                        {c.slug && (<div className="text-[11px] text-indigo-500 dark:text-indigo-300 font-medium">/{c.slug}</div>)}
                        <div className="flex items-center gap-2 mt-2">
                          {c.published ? (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-semibold">Publicado</span>) : (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-semibold">Rascunho</span>)}
                          {c.slug && c.published && (<button onClick={(e)=>{ e.stopPropagation(); const url = `${window.location.origin}/colecoes/${c.slug}`; try { navigator.clipboard.writeText(url); } catch {}; }} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 underline">Copiar link</button>)}
                          <button onClick={(e)=>{ e.stopPropagation(); togglePublish(c); }} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 underline">{c.published ? 'Despublicar' : 'Publicar'}</button>
                          {c.slug && c.published && (<button onClick={(e)=>{ e.stopPropagation(); shareCollection(c); }} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 underline">Compartilhar</button>)}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 mt-3"><div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700" /><span>{c.organizerName || 'Nome do organizador'}</span></div>
                        <div className="text-[13px] text-orange-600 mt-3 font-medium">{(c.upcomingCount || 0)} {(c.upcomingCount || 0) === 1 ? 'próximo evento' : 'próximos eventos'}</div>
                      </div>
                      <button className="text-slate-400 dark:text-slate-400 hover:text-slate-600" title="Excluir" onClick={(e)=>{e.stopPropagation(); handleDeleteCollection(c.id);}}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {filteredCollections.length === 0 && (
                  <div className="text-slate-400">
                    {selectedOrg?.id ? 'Nenhuma coleção encontrada para a organização selecionada.' : 'Nenhuma coleção encontrada'}
                    <div className="mt-3">
                      <button onClick={() => fetchCollections(true)} disabled={collectionsLoading} className={`px-3 py-2 rounded-lg text-white ${collectionsLoading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {collectionsLoading ? (
                          <span className="inline-flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Carregando...</span>
                        ) : 'Recarregar coleções'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
        {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Excluir evento</h2>
            <p className="text-sm text-slate-600">Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-zinc-300 text-slate-600 hover:bg-zinc-100 text-sm font-medium">Cancelar</button>
              <button onClick={onDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {/* Dev-only debug panel (visible on localhost) */}
      {isLocal && (
        <div className="fixed left-4 bottom-4 z-50 w-96 max-h-[60vh] overflow-auto p-3 bg-white border rounded shadow text-xs text-slate-700">
          <div className="font-semibold mb-1">DEBUG</div>
          <div className="truncate"><strong>selectedOrg:</strong> {selectedOrg?.id || '—'}</div>

          

          <div className="mt-3">
            <div className="flex justify-between items-center">
              <div className="text-[12px] font-medium">Last event fetch</div>
              <div className="text-[11px] text-slate-500">{lastEventDebug ? `${lastEventDebug.url} (${lastEventDebug.status})` : '—'}</div>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate">{lastEventDebug?.bodySnippet ?? lastEventDebug?.err ?? ''}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowFullEventDebug(s => !s)} className="px-2 py-1 rounded bg-zinc-100">{showFullEventDebug ? 'Colapsar' : 'Expandir'}</button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(lastEventDebug?.parsed ?? lastEventDebug?.body ?? lastEventDebug, null, 2)).catch(() => {}); }} className="px-2 py-1 rounded bg-zinc-100">Copiar JSON</button>
            </div>
            {showFullEventDebug && lastEventDebug && (
              <div className="mt-2 text-[11px]">
                <div className="font-medium">Headers (sent)</div>
                <pre className="whitespace-pre-wrap max-h-40 overflow-auto bg-[#f8f9fb] p-2 rounded">{JSON.stringify(lastEventDebug?.sentHeaders ?? {}, null, 2)}</pre>
                <div className="font-medium mt-2">Body</div>
                <pre className="whitespace-pre-wrap max-h-44 overflow-auto bg-[#f8f9fb] p-2 rounded">{JSON.stringify(lastEventDebug?.parsed ?? lastEventDebug?.body ?? lastEventDebug, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      <CollectionDrawer open={showCollectionDrawer} mode={collectionDrawerMode} initialData={editingCollection} organizationOptions={organizations} onClose={()=> setShowCollectionDrawer(false)} onSaved={handleCollectionSaved} onDelete={async (id)=> handleDeleteCollection(id)} loadEvents={collectionDrawerMode==='edit'? loadCollectionEvents : undefined} allUserEvents={events} onAddEvent={addEventToCollection} onRemoveEvent={removeEventFromCollection} />
    {/* Botão flutuante com submenu animado */}
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {/* Submenu animado */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}>
        <Link
          to="/create-event"
          className="w-48 h-14 rounded-xl bg-[#EF4118] shadow-lg flex items-center justify-center hover:bg-[#d12c0f] transition-all text-white font-bold text-base"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          onClick={()=>setFabOpen(false)}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="mr-2">
            <circle cx="16" cy="16" r="16" fill="#EF4118" />
            <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Criar evento
        </Link>
        <button
          className="w-48 h-14 rounded-xl bg-indigo-600 shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all text-white font-bold text-base"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          onClick={()=>{ setFabOpen(false); openCreateCollection(); }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="mr-2">
            <circle cx="16" cy="16" r="16" fill="#6366F1" />
            <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Criar coleção
        </button>
      </div>
      {/* Botão principal */}
      <button
        className="w-16 h-16 rounded-full bg-[#EF4118] shadow-lg flex items-center justify-center hover:bg-[#d12c0f] transition-all"
        aria-label="Ações rápidas"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        onClick={()=>setFabOpen(f=>!f)}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#EF4118" />
          <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
    </div>
  );
};

export default OrganizerEvents;
