import React, { useEffect, useMemo, useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import CollectionDrawer from "@/components/CollectionDrawer";
import { apiUrl, fetchApi } from '@/lib/apiBase';
import { resolveImageUrl } from '../lib/apiBase';
import { useOrganization } from '@/context/OrganizationContext';
import { WarpDialog } from '@/components/WarpDialog';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventImporter from '@/components/EventImporter';


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
  const { selectedOrg, orgs, loading: loadingOrgs, setSelectedOrgById } = useOrganization();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'past'>('all');
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);


  // Estados para menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Collections state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsSearch, setCollectionsSearch] = useState("");
  const [showCollections, setShowCollections] = useState(false);
  const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);
  const [collectionDrawerMode, setCollectionDrawerMode] = useState<'create' | 'edit'>('create');
  const [editingCollection, setEditingCollection] = useState<any | null>(null);

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

  // Normalize collection list shapes from different API versions
  const normalizeCollections = (list: any[] | null, oid?: string | null) => {
    if (!Array.isArray(list)) return [] as CollectionItem[];
    const hasOrgField = list.some((it: any) => it && ((it.organizerId) || (it.organizationId) || (it.organizer && it.organizer.id) || (it.organization && it.organization.id)));
    return list.map((it: any) => {
      const asAny = { ...(it || {}) };
      // if the API didn't include organization/organizer ids, tag with provided oid so UI scoping works
      if (!hasOrgField && oid) {
        asAny.organizationId = asAny.organizationId || asAny.organizerId || oid;
        asAny.organizerId = asAny.organizerId || asAny.organizationId || oid;
      }
      // If nested objects exist, prefer flattened ids
      if (!asAny.organizerId && asAny.organizer && asAny.organizer.id) asAny.organizerId = asAny.organizer.id;
      if (!asAny.organizationId && asAny.organization && asAny.organization.id) asAny.organizationId = asAny.organization.id;
      return asAny as CollectionItem;
    });
  };

  // Enrich placeholder org names
  useEffect(() => {
    const enrich = async () => {
      const need = organizations.filter(o => o.name === 'Organização');
      if (!need.length) return;
      const updated: OrganizationOption[] = [];
      for (const o of need) {
        try { 
          const r = await fetchApi(`/api/organization/${o.id}`); 
          if (r.ok) {
            const data = await r.json(); 
            if (data?.name) updated.push({ id: o.id, name: data.name }); 
          }
        } catch { }
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
        try {
          const cached = sessionStorage.getItem('collections-cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length) {
              setCollections(normalizeCollections(parsed, selectedOrg?.id || null));
            }
          }
        } catch { }

        const uid = userId;
        if (!uid) {
          setEvents([]);
          setCollections([]);
          setCollectionsLoading(false);
          return;
        }

        // Load events and organizations in parallel using fetchApi
        const [eventsData, orgsData, rawCollections] = await Promise.all([
          fetchApi(`/api/events/by-user?userId=${uid}`).then(r => r.ok ? r.json() : []),
          fetchApi(`/api/organizations/by-user?userId=${uid}`).then(r => r.ok ? r.json() : []),
          fetchApi(`/api/collections/by-user/${uid}`).then(r => r.ok ? r.json() : [])
        ]);

        if (!selectedOrg) {
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        }


        setCollectionsLoading(true);
        if (Array.isArray(rawCollections) && rawCollections.length) {
          const norm = normalizeCollections(rawCollections, null);
          setCollections(prev => prev.length ? prev : norm);
          setCollectionsLoading(false);
          try { sessionStorage.setItem('collections-cache', JSON.stringify(norm)); } catch { }
        }

        const orgEquipeRes = await fetchApi(`/api/organization/equipe?userId=${uid}`);
        const orgEquipe = orgEquipeRes.ok ? await orgEquipeRes.json() : null;
        const oid = orgEquipe?.organizationId;
        if (oid) {
          setOrganizations(prev => prev.some(o => o.id === oid) ? prev : [...prev, { id: oid, name: 'Organização' }]);
          setCollectionsLoading(true);
          const colsRes = await fetchApi(`/api/organization/${oid}/collections`);
          const cols = colsRes.ok ? await colsRes.json() : [];
          if (Array.isArray(cols) && cols.length) {
            const normCols = normalizeCollections(cols, oid);
            setCollections(prev => prev.length ? prev : normCols);
            setCollectionsLoading(false);
            try { sessionStorage.setItem('collections-cache', JSON.stringify(normCols)); } catch { }
          }
        }
      } catch (e) {
      } finally { setLoading(false); }
    };
    boot();
  }, [userId, selectedOrg?.id, location.pathname]);

  // Refetch events when selected organization changes (scoped view)
  useEffect(() => {
    if (!userId || !selectedOrg) return;
    let cancelled = false;
    const orgId = selectedOrg.id;
    setEvents([]);
    setLoading(true);

    (async () => {
      try {
        const res = await fetchApi(`/api/organization/${orgId}/events`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setEvents(data);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrg?.id, userId]);

  // Refetch collections when selected organization changes (enforce scope)
  useEffect(() => {
    if (!userId || !selectedOrg) return;
    let cancelled = false;
    const orgId = selectedOrg.id;
    setCollections([]);
    setCollectionsLoading(false);

    (async () => {
      try {
        const res = await fetchApi(`/api/organization/${orgId}/collections`);
        if (!res.ok) return;
        const loaded = await res.json();
        if (!cancelled && Array.isArray(loaded)) {
          const norm = normalizeCollections(loaded, orgId);
          setCollections(norm);
        }
      } finally {
        // no-op
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrg?.id, userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = events;
    // If a selectedOrg exists, enforce it regardless of old dropdown filter
    if (selectedOrg) base = base.filter(e => e.organizerId === selectedOrg.id || (e as any).organizationId === selectedOrg.id);

    // Função para normalizar status
    function normalizeStatus(status: string | undefined) {
      if (!status) return '';
      const s = status.toLowerCase();
      if (s === 'published' || s === 'publicado') return 'published';
      if (s === 'draft' || s === 'rascunho') return 'draft';
      if (s === 'completed' || s === 'encerrado') return 'completed';
      if (s === 'paused' || s === 'pausado') return 'paused';
      if (s === 'deleted' || s === 'excluído') return 'deleted';
      return s;
    }

    // Apply status / time filters
    if (filter === 'published') {
      base = base.filter(e => normalizeStatus((e as any).status) === 'published');
    } else if (filter === 'draft') {
      base = base.filter(e => normalizeStatus((e as any).status) === 'draft');
    } else if (filter === 'past') {
      const now = Date.now();
      base = base.filter(e => { try { return new Date(e.startDate).getTime() < now; } catch { return false; } });
    }
    if (!q) return base;
    return base.filter(e => e.name?.toLowerCase().includes(q));
  }, [events, search, selectedOrg?.id, filter]);

  const filteredCollections = useMemo(() => {
    const q = collectionsSearch.trim().toLowerCase();
    let base = collections;
    // enforce selected organization scope if available
    if (selectedOrg) {
      const oid = selectedOrg.id;
      base = base.filter(c => {
        // support multiple possible shapes returned by the API
        return (
          c.organizerId === oid ||
          (c as any).organizationId === oid ||
          (c as any).organizer?.id === oid ||
          (c as any).organization?.id === oid ||
          (c as any).organizer?.organizationId === oid
        );
      });
    }
    if (!q) return base;
    return base.filter(c => c.title?.toLowerCase().includes(q));
  }, [collections, collectionsSearch, selectedOrg?.id]);

  // Skeletons for collections loading
  const renderCollectionsSkeleton = () => (
    <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] overflow-hidden bg-white dark:bg-[#242424] animate-pulse">
          <div className="h-40 bg-zinc-200 dark:bg-[#1A1A1A] flex items-center justify-center" />
          <div className="p-5">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-[#1A1A1A] rounded mb-2" />
            <div className="h-3 w-20 bg-zinc-200 dark:bg-[#1A1A1A] rounded mb-2" />
            <div className="h-3 w-24 bg-zinc-200 dark:bg-[#1A1A1A] rounded mb-2" />
            <div className="h-3 w-16 bg-zinc-200 dark:bg-[#1A1A1A] rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const refresh = async () => {
    if (!userId) return;
    try {
      const path = selectedOrg 
        ? `/api/organization/${selectedOrg.id}/events`
        : `/api/events/by-user?userId=${userId}`;
      
      const res = await fetchApi(path);
      if (res.ok) {
        const list = await res.json();
        setEvents(Array.isArray(list) ? list : []);
      }
    } catch { }
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchApi(`/api/event/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.ok || res.status === 200) {
          await refresh();
        }
      }
    } finally { setDeleteTarget(null); }
  };

  const openCreateCollection = () => { setCollectionDrawerMode('create'); setEditingCollection(null); setShowCollectionDrawer(true); };
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    const fetchCollectionsIfNeeded = async () => {
      if (!showCollections || collections.length > 0) return;
      try {
        const attemptPath = async (path: string) => {
          try { 
            const r = await fetchApi(path); 
            if (r.ok) return r.json(); 
          } catch { }
          return null;
        };
        // Prefer explicit selectedOrg when present, otherwise fall back to discovered organizations
        let oid: string | null = selectedOrg?.id || organizations[0]?.id || null;
        if (!oid && userId) { const orgJ = await attemptPath(`/api/organization/equipe?userId=${userId}`); oid = orgJ?.organizationId || null; }
        if (collections.length === 0 && userId) {
          const allCols = await attemptPath(`/api/collections/by-user/${userId}`);
          if (Array.isArray(allCols) && allCols.length) { const norm = normalizeCollections(allCols, oid); setCollections(norm); return; }
        }
        if (oid) {
          const list = await attemptPath(`/api/organization/${oid}/collections`);
          if (Array.isArray(list) && list.length) { const norm = normalizeCollections(list, oid); setCollections(prev => prev.length ? prev : norm); try { sessionStorage.setItem('collections-cache', JSON.stringify(norm)); } catch { } }
        }
        if (collections.length === 0 && organizations.length > 1) {
          for (const o of organizations) {
            const ll = await attemptPath(`/api/organization/${o.id}/collections`);
            if (Array.isArray(ll) && ll.length) { 
              const norm = normalizeCollections(ll, o.id); 
              setCollections(prev => prev.length ? prev : norm); 
              try { sessionStorage.setItem('collections-cache', JSON.stringify(norm)); } catch { }
              break; 
            }
          }
        }
      } catch (e) { }
    };
    fetchCollectionsIfNeeded();
  }, [showCollections, collections.length, organizations, userId]);

  const handleCollectionSaved = async (col: any) => {
    try {
      setCollections(prev => prev.some(p => p.id === col.id) ? prev : [col, ...prev]);
      try { sessionStorage.setItem('collections-cache', JSON.stringify([col, ...collections])); } catch { }
      let oid = col.organizerId;
      if (!oid && userId) {
        const attempts = [apiUrl(`/api/organization/equipe?userId=${userId}`), `http://localhost:4000/api/organization/equipe?userId=${userId}`];
        for (const u of attempts) { 
          try { 
            const r = await fetch(u); 
            if (r.ok) { 
              const j = await r.json(); 
              if (j?.organizationId) { 
                oid = j.organizationId; 
                break; 
              } 
            } 
          } catch { } 
        }
      }
      if (oid) {
        const attempts = [apiUrl(`/api/organization/${oid}/collections`), `http://localhost:4000/api/organization/${oid}/collections`];
        for (const u of attempts) { 
          try { 
            const r = await fetch(u); 
            if (r.ok) { 
              const list = await r.json(); 
              if (Array.isArray(list) && list.length) { 
                const norm = normalizeCollections(list, oid); 
                setCollections(norm); 
                try { sessionStorage.setItem('collections-cache', JSON.stringify(norm)); } catch { }
                break; 
              } 
            } 
          } catch { } 
        }
      }
    } catch (e) { }
    finally { setShowCollections(true); setShowCollectionDrawer(false); }
  };

  const handleEditCollection = (col: any) => { setCollectionDrawerMode('edit'); setEditingCollection(col); setShowCollectionDrawer(true); };
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<string | null>(null);
  const handleDeleteCollection = (id: string) => {
    setDeleteCollectionTarget(id);
  };
  const confirmDeleteCollection = async () => {
    if (!deleteCollectionTarget) return;
    const attempts = [apiUrl(`/api/collection/${deleteCollectionTarget}`), `http://localhost:4000/api/collection/${deleteCollectionTarget}`];
    for (const u of attempts) {
      try {
        const res = await fetch(u, { method: 'DELETE' });
        if (res.ok) {
          const j = await res.json();
          if (j?.ok) {
            setCollections(prev => prev.filter(c => c.id !== deleteCollectionTarget));
            break;
          }
        }
      } catch { }
    }
    setDeleteCollectionTarget(null);
  };
  const loadCollectionEvents = async (collectionId: string) => {
    const attempts = [apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`];
    for (const u of attempts) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch { } }
    return [];
  };
  const addEventToCollection = async (collectionId: string, eventId: string) => {
    const attempts = [apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`];
    for (const u of attempts) { try { await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) }); break; } catch { } }
  };
  const removeEventFromCollection = async (collectionId: string, eventId: string) => {
    const attempts = [apiUrl(`/api/collection/${collectionId}/events/${eventId}`), `http://localhost:4000/api/collection/${collectionId}/events/${eventId}`];
    for (const u of attempts) { try { await fetch(u, { method: 'DELETE' }); break; } catch { } }
  };
  const togglePublish = async (c: CollectionItem) => { if (!c.id) return; try { const res = await fetch(`/api/collection/${c.id}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !c.published }) }); const j = await res.json(); if (j?.collection?.id) { setCollections(prev => prev.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p)); try { sessionStorage.setItem('collections-cache', JSON.stringify(collections.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p))); } catch { } } } catch { } };
  const shareCollection = async (c: CollectionItem) => { if (!c.slug) return; const url = `${window.location.origin}/colecoes/${c.slug}`; if ((navigator as any).share) { try { await (navigator as any).share({ title: c.title, text: c.description || c.title, url }); return; } catch { } } try { await navigator.clipboard.writeText(url); } catch { } };
  const deleteCollection = async (id: string) => { if (!confirm('Excluir esta coleção?')) return; const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' }); const j = await res.json(); if (j?.ok) { if (!userId) return; const orgRes = await fetch(`/api/organization/equipe?userId=${userId}`); const orgJ = await orgRes.json(); const oid = orgJ?.organizationId; if (!oid) return; const r = await fetch(`/api/organization/${oid}/collections`); const list = await r.json(); setCollections(normalizeCollections(list, oid)); } };

  return (
    <OrganizerLayout>
      <div className="relative min-h-screen w-full bg-transparent dark:bg-[#0b0b0b] dark:text-white">
        {/* Mobile Menu */}
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          organizations={orgs}
          selectedOrg={selectedOrg}
          selectOrganization={setSelectedOrgById}
          user={user}
        />

        <SidebarMenu activeKeyOverride="eventos" />
        <div className="relative w-full lg:pl-24">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
            <AppHeader />
            <div className="flex flex-col gap-6 w-full mx-auto mt-16 px-2 max-md:mt-10 max-sm:mt-6 pb-[100px]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-2xl mb-0">Eventos</h1>
                <button 
                  onClick={() => setShowImporter(!showImporter)}
                  className="inline-flex items-center gap-2 px-4 h-10 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#1F1F1F] text-slate-700 dark:text-white text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-[#242424] transition font-semibold shadow-sm w-fit"
                >
                  <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  <span>Importar Externo</span>
                </button>
              </div>

              {showImporter && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <EventImporter 
                    onSuccess={() => { setShowImporter(false); refresh(); }} 
                    onClose={() => setShowImporter(false)}
                  />
                </div>
              )}

              {/* Tabs hidden: simplified UI for now (Eventos/Coleções removed) */}
              {!showCollections ? (
                <>
                  <div className="flex items-center gap-4 max-sm:gap-3 mt-2">{/* simplified: removed placeholder select */}
                    <input className="flex-1 h-[46px] max-sm:h-[42px] px-5 max-sm:px-4 rounded-xl border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px] max-sm:text-sm" placeholder="Pesquisar eventos" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  {/* Filtros abaixo da barra de busca */}
                  <div className="flex items-center gap-3 max-sm:gap-2 mt-3 max-sm:mt-2 flex-wrap">
                    <button onClick={() => setFilter('all')} className={`px-4 max-sm:px-3 py-1.5 rounded-full text-sm max-sm:text-xs font-semibold ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-[#1F1F1F] text-slate-700 dark:text-white'}`}>Todos</button>
                    <button onClick={() => setFilter('published')} className={`px-4 max-sm:px-3 py-1.5 rounded-full text-sm max-sm:text-xs font-semibold ${filter === 'published' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-[#1F1F1F] text-slate-700 dark:text-white'}`}>Publicado</button>
                    <button onClick={() => setFilter('draft')} className={`px-4 max-sm:px-3 py-1.5 rounded-full text-sm max-sm:text-xs font-semibold ${filter === 'draft' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-[#1F1F1F] text-slate-700 dark:text-white'}`}>Em rascunho</button>
                    <button onClick={() => setFilter('past')} className={`px-4 max-sm:px-3 py-1.5 rounded-full text-sm max-sm:text-xs font-semibold ${filter === 'past' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-[#1F1F1F] text-slate-700 dark:text-white'}`}>Passado</button>
                  </div>
                  {/* Tabela desktop */}
                  <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#242424] shadow-sm mt-4 max-sm:hidden">{/* card style like dashboard's large cards */}
                    <table className="w-full text-left">
                      <thead className="bg-[#F6F7FB] text-slate-600 text-xs font-medium tracking-wide">
                        <tr>
                          <th className="py-4 px-6">Evento</th>
                          <th className="py-4 px-6">Organização</th>
                          <th className="py-4 px-6">Vendidos</th>
                          <th className="py-4 px-6">Bruto</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-[13px]">
                        {loading ? (
                          Array.from({ length: 7 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-[#1F1F1F]" />
                                  <div className="space-y-2">
                                    <div className="h-4 w-40 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                                    <div className="h-3 w-28 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                                    <div className="h-3 w-16 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6"><div className="h-4 w-32 bg-zinc-200 dark:bg-[#1F1F1F] rounded" /></td>
                              <td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 dark:bg-[#1F1F1F] rounded" /></td>
                              <td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 dark:bg-[#1F1F1F] rounded" /></td>
                              <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 dark:bg-[#1F1F1F] rounded" /></td>
                              <td className="py-4 px-6 text-right"><div className="h-4 w-10 bg-zinc-200 dark:bg-[#1F1F1F] rounded ml-auto" /></td>
                            </tr>
                          ))
                        ) : filtered.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 px-6 text-center text-sm text-slate-500">
                              Nenhum evento encontrado para esta organização.
                              <div className="mt-4">
                                <Link to="/create" className="inline-flex items-center px-5 h-[42px] rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 text-sm">+ Criar primeiro evento</Link>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((ev: any) => {
                            const orgName = (ev as any).organizationName || organizations.find(o => o.id === ev.organizationId || o.id === ev.organizerId)?.name || 'Sem organização';
                            // Função para mapear status do evento para label amigável
                            function getStatusLabel(status: string | undefined): string {
                              switch (status) {
                                case 'draft': return 'Rascunho';
                                case 'published': return 'Publicado';
                                case 'completed': return 'Encerrado';
                                case 'paused': return 'Pausado';
                                case 'deleted': return 'Excluído';
                                default: return status || 'Desconhecido';
                              }
                            }
                            function getStatusBadgeColor(status: string | undefined): string {
                              const normalized = (status || '').toLowerCase();
                              switch (normalized) {
                                case 'published':
                                case 'publicado':
                                  return 'bg-green-500 text-white border-green-600';
                                case 'draft':
                                case 'rascunho':
                                  return 'bg-zinc-500 text-white border-zinc-600';
                                case 'completed':
                                case 'encerrado':
                                  return 'bg-blue-600 text-white border-blue-700';
                                case 'paused':
                                case 'pausado':
                                  return 'bg-yellow-400 text-white border-yellow-600';
                                case 'deleted':
                                case 'excluído':
                                  return 'bg-red-600 text-white border-red-700';
                                default:
                                  return 'bg-gray-500 text-white border-gray-700';
                              }
                            }
                            return (
                              <tr key={ev.id} className="hover:bg-[#F8F9FC] cursor-pointer transition" onClick={() => navigate(`/event/manage/${ev.id}`)}>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    {ev.image ? (
                                      <img 
                                        src={ev.image.startsWith('http') || ev.image.startsWith('/') ? ev.image : `/${ev.image}`} 
                                        alt={ev.name || 'Banner do evento'} 
                                        className="w-11 h-11 rounded-[5px] object-cover flex-shrink-0 border border-zinc-200" 
                                      />
                                    ) : (
                                      <div className="w-11 h-11 rounded-[5px] bg-zinc-200 flex-shrink-0" />
                                    )}
                                    <div>
                                      <div className="text-[15px] text-slate-900 font-semibold leading-tight mb-0.5">{ev.name || 'Sem nome'}</div>
                                      <div className="text-slate-500 text-[11px] flex flex-col gap-0.5">
                                        <span>{formatDate(ev.startDate)}</span>
                                        {ev.locationAddress || ev.location ? (
                                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                            📍 {ev.locationAddress || ev.location}
                                          </span>
                                        ) : null}
                                      </div>
                                      <div className="text-red-500 text-[11px] font-medium mt-0.5">{ev.privacy === 'public' ? 'Público' : 'Privado'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-slate-600">{orgName}</td>
                                <td className="py-4 px-6 text-slate-700">{Number(ev.soldCount || 0)} / {Number(ev.capacity || 0)}</td>
                                <td className="py-4 px-6 text-slate-700">R${Number(ev.grossTotal || 0).toFixed(2).replace('.', ',')}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-block px-3 py-1 rounded-full border text-[12px] font-semibold ${getStatusBadgeColor(ev.status)}`}>{getStatusLabel(ev.status)}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4 justify-end">
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/create?eventId=${ev.id}`); }} className="text-indigo-600 hover:text-indigo-800" title="Editar"><Pencil size={18} /></button>
                                    <button className="text-slate-400 hover:text-red-600" title="Excluir" onClick={(e) => { e.stopPropagation(); setDeleteTarget(ev.id); }}><Trash2 size={18} /></button>
                                    {ev.slug && ev.status === 'published' && (
                                      <button
                                        className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline"
                                        title="Copiar link público"
                                        onClick={e => {
                                          e.stopPropagation();
                                          const url = `${window.location.origin}/${ev.slug}`;
                                          try { navigator.clipboard.writeText(url); } catch { }
                                        }}
                                      >
                                        Copiar link público
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards mobile */}
                  <div className="hidden max-sm:flex flex-col gap-3 mt-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white dark:bg-[#242424] rounded-xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg bg-zinc-200 dark:bg-[#1F1F1F] flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                              <div className="h-3 w-1/2 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-[#1F1F1F] flex justify-between items-center">
                            <div className="h-3 w-20 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                            <div className="h-6 w-16 bg-zinc-200 dark:bg-[#1F1F1F] rounded-full" />
                          </div>
                        </div>
                      ))
                    ) : filtered.length === 0 ? (
                      <div className="bg-white dark:bg-[#242424] rounded-xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Nenhum evento encontrado para esta organização.</p>
                        <Link to="/create" className="inline-flex items-center px-5 h-[42px] rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 text-sm">+ Criar primeiro evento</Link>
                      </div>
                    ) : (
                      filtered.map((ev: any) => {
                        const orgName = (ev as any).organizationName || organizations.find(o => o.id === ev.organizationId || o.id === ev.organizerId)?.name || 'Sem organização';
                        function getStatusLabel(status: string | undefined): string {
                          switch (status) {
                            case 'draft': return 'Rascunho';
                            case 'published': return 'Publicado';
                            case 'completed': return 'Encerrado';
                            case 'paused': return 'Pausado';
                            case 'deleted': return 'Excluído';
                            default: return status || 'Desconhecido';
                          }
                        }
                        function getStatusBadgeColor(status: string | undefined): string {
                          const normalized = (status || '').toLowerCase();
                          switch (normalized) {
                            case 'published':
                            case 'publicado':
                              return 'bg-green-500 text-white';
                            case 'draft':
                            case 'rascunho':
                              return 'bg-zinc-500 text-white';
                            case 'completed':
                            case 'encerrado':
                              return 'bg-blue-600 text-white';
                            case 'paused':
                            case 'pausado':
                              return 'bg-yellow-400 text-white';
                            case 'deleted':
                            case 'excluído':
                              return 'bg-red-600 text-white';
                            default:
                              return 'bg-gray-500 text-white';
                          }
                        }
                        return (
                          <div key={ev.id} className="bg-white dark:bg-[#242424] rounded-xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/event/manage/${ev.id}`)}>
                            <div className="flex gap-3">
                              {ev.image ? (
                                <img 
                                  src={ev.image.startsWith('http') || ev.image.startsWith('/') ? ev.image : `/${ev.image}`} 
                                  alt={ev.name || 'Banner do evento'} 
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-zinc-200 dark:border-[#1F1F1F]" 
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-zinc-200 dark:bg-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                                  <span className="text-zinc-400 dark:text-zinc-600 text-xs">Sem foto</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1 truncate">{ev.name || 'Sem nome'}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{formatDate(ev.startDate)}</div>
                                {ev.locationAddress || ev.location ? (
                                  <div className="text-[11px] text-slate-400 truncate mb-1">
                                    📍 {ev.locationAddress || ev.location}
                                  </div>
                                ) : null}
                                <div className="text-xs text-red-500 font-medium">{ev.privacy === 'public' ? 'Público' : 'Privado'}</div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-[#1F1F1F] flex justify-between items-center">
                              <div className="flex flex-col gap-1">
                                <div className="text-xs text-slate-600 dark:text-slate-400">{Number(ev.soldCount || 0)} / {Number(ev.capacity || 0)} vendidos</div>
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">R${Number(ev.grossTotal || 0).toFixed(2).replace('.', ',')}</div>
                              </div>
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeColor(ev.status)}`}>{getStatusLabel(ev.status)}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/create?eventId=${ev.id}`); }} className="flex-1 text-xs py-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">Editar</button>
                              {ev.slug && ev.status === 'published' && (
                                <button
                                  className="flex-1 text-xs py-2 px-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                  onClick={e => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/${ev.slug}`;
                                    try { navigator.clipboard.writeText(url); } catch { }
                                  }}
                                >
                                  Copiar link
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(ev.id); }} className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-slate-600 mb-6 text-[15px]">Ajude os participantes a encontrarem os melhores eventos criando páginas de coleção para seus eventos relacionados.</p>
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <input className="flex-1 h-[46px] px-5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px]" placeholder="Pesquisar coleções por título" value={collectionsSearch} onChange={(e) => setCollectionsSearch(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
                    {collectionsLoading && collections.length === 0 ? (
                      renderCollectionsSkeleton()
                    ) : filteredCollections.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-[#E5E7EB] overflow-hidden cursor-pointer bg-white hover:shadow-sm transition" onClick={() => handleEditCollection(c)}>
                        <div className="h-40 bg-zinc-200 flex items-center justify-center overflow-hidden">
                          {c.bannerImage ? (<img src={resolveImageUrl(c.bannerImage) || c.bannerImage} alt={c.title} className="w-full h-full object-cover" />) : (<span className="text-xs text-zinc-500">Sem banner</span>)}
                        </div>
                        <div className="p-5 flex items-start justify-between">
                          <div>
                            <div className="text-slate-900 font-semibold text-[15px] mb-0.5">{c.title}</div>
                            {c.slug && (<div className="text-[11px] text-indigo-500 font-medium">/{c.slug}</div>)}
                            <div className="flex items-center gap-2 mt-2">
                              {c.published ? (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">Publicado</span>) : (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-semibold">Rascunho</span>)}
                              {c.slug && c.published && (<button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/colecoes/${c.slug}`; try { navigator.clipboard.writeText(url); } catch { }; }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">Copiar link</button>)}
                              <button onClick={(e) => { e.stopPropagation(); togglePublish(c); }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">{c.published ? 'Despublicar' : 'Publicar'}</button>
                              {c.slug && c.published && (<button onClick={(e) => { e.stopPropagation(); shareCollection(c); }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">Compartilhar</button>)}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-3"><div className="w-5 h-5 rounded-full bg-zinc-300" /><span>{c.organizerName || 'Nome do organizador'}</span></div>
                            <div className="text-[13px] text-orange-600 mt-3 font-medium">{(c.upcomingCount || 0)} {(c.upcomingCount || 0) === 1 ? 'próximo evento' : 'próximos eventos'}</div>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600" title="Excluir" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(c.id); }}><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                    {filteredCollections.length === 0 && !collectionsLoading && (<div className="text-slate-400">Nenhuma coleção encontrada</div>)}
                  </div>
                </div>
              )}
            </div>

            <WarpDialog
              open={deleteCollectionTarget !== null}
              onOpenChange={(open) => {
                if (!open) setDeleteCollectionTarget(null);
              }}
              title="Excluir coleção"
              description="Tem certeza que deseja excluir esta coleção? Essa ação não pode ser desfeita."
              confirmText="Sim, excluir"
              cancelText="Cancelar"
              onConfirm={confirmDeleteCollection}
            />

            <CollectionDrawer open={showCollectionDrawer} mode={collectionDrawerMode} initialData={editingCollection} organizationOptions={organizations} onClose={() => setShowCollectionDrawer(false)} onSaved={handleCollectionSaved} onDelete={async (id) => handleDeleteCollection(id)} loadEvents={collectionDrawerMode === 'edit' ? loadCollectionEvents : undefined} allUserEvents={events} onAddEvent={addEventToCollection} onRemoveEvent={removeEventFromCollection} />
            {/* Botão flutuante com texto flutuante igual ao OrganizerSettings (círculo + texto ao passar o mouse) */}
            <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
              <div className="relative group">
                <button
                  onClick={() => navigate('/create')}
                  className="w-16 h-16 rounded-full bg-[#EF4118] shadow-lg flex items-center justify-center hover:bg-[#d12c0f] transition-all"
                  aria-label="Criar evento"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#EF4118" />
                    <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-white dark:bg-[#242424] text-[#EF4118] dark:text-white font-bold px-4 py-2 rounded-xl shadow text-base opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Criar evento</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerEvents;

