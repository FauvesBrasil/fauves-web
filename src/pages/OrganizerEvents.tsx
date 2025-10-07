import React, { useEffect, useMemo, useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
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
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const { selectedOrg, orgs, loading: loadingOrgs } = useOrganization();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Collections state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsSearch, setCollectionsSearch] = useState("");
  const [showCollections, setShowCollections] = useState(false);
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
        try { const r = await fetch(`/api/organization/${o.id}`); const data = await r.json(); if (data?.name) updated.push({ id: o.id, name: data.name }); } catch {}
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
        try { const cached = sessionStorage.getItem('collections-cache'); if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed) && parsed.length) setCollections(parsed); } } catch {}
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id || null; setUserId(uid);
        if (!uid) { setEvents([]); setCollections([]); return; }
        await ensureApiBase();
        const buildAttempts = (path: string) => {
          const attempts: string[] = [];
          attempts.push(apiUrl(path));
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('eventsApiBase') : null;
          if (stored) attempts.push(`${stored.replace(/\/$/, '')}${path}`);
          attempts.push(`http://localhost:4000${path}`);
          return attempts;
        };
        const resilientJson = async (path: string) => {
          for (const u of buildAttempts(path)) {
            try { const r = await fetch(u, { headers: { 'Accept': 'application/json' } }); if (!r.ok) continue; return await r.json(); } catch { }
          }
          return null;
        };
  // Carrega visão inicial ampla (por usuário) apenas até termos selectedOrg; depois scoping assume
  const eventsData = await resilientJson(`/api/events/by-user?userId=${uid}`) || [];
  setEvents(Array.isArray(eventsData) ? eventsData : []);
  (window as any).__dbgEventsByUser = eventsData;
  const orgsData = await resilientJson(`/api/organizations/by-user?userId=${uid}`) || [];
  if (Array.isArray(orgsData)) setOrganizations(orgsData);
  (window as any).__dbgOrgsByUser = orgsData;
        const rawCollections = await resilientJson(`/api/collections/by-user/${uid}`);
        if (Array.isArray(rawCollections) && rawCollections.length) {
          setCollections(prev => prev.length ? prev : rawCollections);
          try { sessionStorage.setItem('collections-cache', JSON.stringify(rawCollections)); } catch {}
        }
        const orgEquipe = await resilientJson(`/api/organization/equipe?userId=${uid}`);
        (window as any).__dbgOrgEquipe = orgEquipe;
        const oid = orgEquipe?.organizationId;
        if (oid) {
          setOrganizations(prev => prev.some(o => o.id === oid) ? prev : [...prev, { id: oid, name: 'Organização' }]);
          const cols = await resilientJson(`/api/organization/${oid}/collections`);
            if (Array.isArray(cols) && cols.length) {
              setCollections(prev => prev.length ? prev : cols);
              try { sessionStorage.setItem('collections-cache', JSON.stringify(cols)); } catch {}
            }
        }
        (window as any).__dbgCollections = { initial: rawCollections, afterOrg: (window as any).__dbgCollections?.afterOrg };
      } catch (e) {
        console.warn('[OrganizerEvents.boot] falhou', e);
      } finally { setLoading(false); }
    };
    boot();
  }, []);

  // Refetch events when selected organization changes (scoped view)
  useEffect(() => {
    if (!userId || !selectedOrg) return;
    let cancelled = false;
    const orgId = selectedOrg.id;
    // Limpa imediatamente a lista para evitar mostrar eventos da org anterior
    setEvents([]);
    setLoading(true);
    (async () => {
      try {
        await ensureApiBase();
        const attempts = [
          apiUrl(`/api/organization/${orgId}/events`),
          `http://localhost:4000/api/organization/${orgId}/events`
        ];
        let loaded: any[] | null = null;
        for (const u of attempts) {
          try {
            const r = await fetch(u, { headers: { 'Accept':'application/json' } });
            if (!r.ok) continue;
            const j = await r.json();
            if (Array.isArray(j)) { loaded = j; break; }
          } catch {}
        }
        if (!cancelled && loaded) {
          setEvents(loaded);
          (window as any).__dbgEventsScoped = { orgId, loaded };
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrg?.id, userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = events;
    // If a selectedOrg exists, enforce it regardless of old dropdown filter
    if (selectedOrg) base = base.filter(e => e.organizerId === selectedOrg.id || (e as any).organizationId === selectedOrg.id);
    if (!q) return base;
    return base.filter(e => e.name?.toLowerCase().includes(q));
  }, [events, search, selectedOrg?.id]);

  const filteredCollections = useMemo(() => {
    const q = collectionsSearch.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(c => c.title?.toLowerCase().includes(q));
  }, [collections, collectionsSearch]);

  const refresh = async () => {
    if (!userId) return;
    try {
      await ensureApiBase();
      if (selectedOrg) {
        const attempts = [
          apiUrl(`/api/organization/${selectedOrg.id}/events`),
          `http://localhost:4000/api/organization/${selectedOrg.id}/events`
        ];
        for (const u of attempts) {
          try { const r = await fetch(u); if (r.ok) { const list = await r.json(); if (Array.isArray(list)) { setEvents(list); (window as any).__dbgEventsScopedRefresh = list; break; } } } catch {}
        }
      } else {
        const attempts = [apiUrl(`/api/events/by-user?userId=${userId}`), `http://localhost:4000/api/events/by-user?userId=${userId}`];
        for (const u of attempts) {
          try { const r = await fetch(u); if (r.ok) { const list = await r.json(); setEvents(Array.isArray(list) ? list : []); (window as any).__dbgEventsByUser = list; break; } } catch {}
        }
      }
    } catch {}
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ensureApiBase();
      const urls = [apiUrl(`/api/event/${deleteTarget}`), `http://localhost:4000/api/event/${deleteTarget}`];
      for (const u of urls) {
        try { const res = await fetch(u, { method: 'DELETE' }); if (res.ok) { const j = await res.json(); if (j?.ok) { await refresh(); break; } } } catch {}
      }
    } finally { setDeleteTarget(null); }
  };

  const openCreateCollection = () => { setCollectionDrawerMode('create'); setEditingCollection(null); setShowCollectionDrawer(true); };

  useEffect(() => {
    const fetchCollectionsIfNeeded = async () => {
      if (!showCollections || collections.length > 0) return;
      try {
        await ensureApiBase();
        const attempt = async (path: string) => {
          const bases = [apiUrl(path), `http://localhost:4000${path}`];
          for (const b of bases) { try { const r = await fetch(b); if (r.ok) return r.json(); } catch {} }
          return null;
        };
        let oid: string | null = organizations[0]?.id || null;
        if (!oid && userId) { const orgJ = await attempt(`/api/organization/equipe?userId=${userId}`); oid = orgJ?.organizationId || null; }
        if (collections.length === 0 && userId) {
          const allCols = await attempt(`/api/collections/by-user/${userId}`);
          if (Array.isArray(allCols) && allCols.length) { setCollections(allCols); return; }
        }
        if (oid) {
          const list = await attempt(`/api/organization/${oid}/collections`);
          if (Array.isArray(list) && list.length) { setCollections(prev => prev.length ? prev : list); try { sessionStorage.setItem('collections-cache', JSON.stringify(list)); } catch {} }
        }
        if (collections.length === 0 && organizations.length > 1) {
          for (const o of organizations) {
            const ll = await attempt(`/api/organization/${o.id}/collections`);
            if (Array.isArray(ll) && ll.length) { setCollections(prev => prev.length ? prev : ll); try { sessionStorage.setItem('collections-cache', JSON.stringify(ll)); } catch {}; break; }
          }
        }
      } catch (e) { console.warn('[OrganizerEvents] fetchCollectionsIfNeeded failed', e); }
    };
    fetchCollectionsIfNeeded();
  }, [showCollections, collections.length, organizations, userId]);

  const handleCollectionSaved = async (col: any) => {
    try {
      setCollections(prev => prev.some(p => p.id === col.id) ? prev : [col, ...prev]);
      try { sessionStorage.setItem('collections-cache', JSON.stringify([col, ...collections])); } catch {}
      await ensureApiBase();
      let oid = col.organizerId;
      if (!oid && userId) {
        const attempts = [apiUrl(`/api/organization/equipe?userId=${userId}`), `http://localhost:4000/api/organization/equipe?userId=${userId}`];
        for (const u of attempts) { try { const r = await fetch(u); if (r.ok) { const j = await r.json(); if (j?.organizationId) { oid = j.organizationId; break; } } } catch {} }
      }
      if (oid) {
        const attempts = [apiUrl(`/api/organization/${oid}/collections`), `http://localhost:4000/api/organization/${oid}/collections`];
        for (const u of attempts) { try { const r = await fetch(u); if (r.ok) { const list = await r.json(); if (Array.isArray(list) && list.length) { setCollections(list); try { sessionStorage.setItem('collections-cache', JSON.stringify(list)); } catch {}; break; } } } catch {} }
      }
    } catch (e) { console.error('[OrganizerEvents] refresh collections after save failed', e); }
    finally { setShowCollections(true); setShowCollectionDrawer(false); }
  };

  const handleEditCollection = (col: any) => { setCollectionDrawerMode('edit'); setEditingCollection(col); setShowCollectionDrawer(true); };
  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Excluir esta coleção?')) return;
    await ensureApiBase();
    const attempts = [apiUrl(`/api/collection/${id}`), `http://localhost:4000/api/collection/${id}`];
    for (const u of attempts) { try { const res = await fetch(u, { method: 'DELETE' }); if (res.ok) { const j = await res.json(); if (j?.ok) { setCollections(prev => prev.filter(c => c.id !== id)); break; } } } catch {} }
  };
  const loadCollectionEvents = async (collectionId: string) => {
    await ensureApiBase();
    const attempts = [apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`];
    for (const u of attempts) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch {} }
    return [];
  };
  const addEventToCollection = async (collectionId: string, eventId: string) => {
    await ensureApiBase();
    const attempts = [apiUrl(`/api/collection/${collectionId}/events`), `http://localhost:4000/api/collection/${collectionId}/events`];
    for (const u of attempts) { try { await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) }); break; } catch {} }
  };
  const removeEventFromCollection = async (collectionId: string, eventId: string) => {
    await ensureApiBase();
    const attempts = [apiUrl(`/api/collection/${collectionId}/events/${eventId}`), `http://localhost:4000/api/collection/${collectionId}/events/${eventId}`];
    for (const u of attempts) { try { await fetch(u, { method: 'DELETE' }); break; } catch {} }
  };
  const togglePublish = async (c: CollectionItem) => { if (!c.id) return; try { const res = await fetch(`/api/collection/${c.id}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !c.published }) }); const j = await res.json(); if (j?.collection?.id) { setCollections(prev => prev.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p)); try { sessionStorage.setItem('collections-cache', JSON.stringify(collections.map(p => p.id === c.id ? { ...p, published: j.collection.published } : p))); } catch {} } } catch {} };
  const shareCollection = async (c: CollectionItem) => { if (!c.slug) return; const url = `${window.location.origin}/colecoes/${c.slug}`; if ((navigator as any).share) { try { await (navigator as any).share({ title: c.title, text: c.description || c.title, url }); return; } catch {} } try { await navigator.clipboard.writeText(url); } catch {} };
  const deleteCollection = async (id: string) => { if (!confirm('Excluir esta coleção?')) return; const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' }); const j = await res.json(); if (j?.ok) { if (!userId) return; const orgRes = await fetch(`/api/organization/equipe?userId=${userId}`); const orgJ = await orgRes.json(); const oid = orgJ?.organizationId; if (!oid) return; const r = await fetch(`/api/organization/${oid}/collections`); setCollections(await r.json()); } };

  return (
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">{/* aligned with dashboard root */}
      <SidebarMenu activeKeyOverride="eventos" />
      <div className="rounded-3xl w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">{/* dashboard-sized container */}
        <AppHeader />
        {/* mimic absolute inner layout used on dashboard for consistent left/top spacing */}
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-32">
          <h1 className="text-4xl font-bold text-slate-900 max-sm:text-3xl">Eventos</h1>
          <div className="flex items-center gap-6 border-b border-zinc-200 -mb-2">{/* moved up tighter like dashboard sections */}
            <button onClick={() => setShowCollections(false)} className={`pb-2 ${!showCollections ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Eventos</button>
            <button onClick={() => setShowCollections(true)} className={`pb-2 ${showCollections ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Coleções</button>
          </div>
          {!showCollections ? (
            <>
              <div className="flex items-center gap-4 mt-2">{/* simplified: removed placeholder select */}
                <input className="flex-1 h-[46px] px-5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px]" placeholder="Pesquisar eventos" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Link to="/create-event" className="h-[46px] px-6 inline-flex items-center rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 text-sm whitespace-nowrap">+ Criar evento</Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm mt-4">{/* card style like dashboard's large cards */}
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
                      Array.from({length:7}).map((_,i)=>(
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-zinc-200" />
                              <div className="space-y-2">
                                <div className="h-4 w-40 bg-zinc-200 rounded" />
                                <div className="h-3 w-28 bg-zinc-200 rounded" />
                                <div className="h-3 w-16 bg-zinc-200 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6"><div className="h-4 w-32 bg-zinc-200 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td>
                          <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 rounded" /></td>
                          <td className="py-4 px-6 text-right"><div className="h-4 w-10 bg-zinc-200 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 px-6 text-center text-sm text-slate-500">
                          Nenhum evento encontrado para esta organização.
                          <div className="mt-4">
                            <Link to="/create-event" className="inline-flex items-center px-5 h-[42px] rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 text-sm">+ Criar primeiro evento</Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((ev: any) => {
                        const orgName = (ev as any).organizationName || organizations.find(o => o.id === ev.organizationId || o.id === ev.organizerId)?.name || 'Sem organização';
                        return (
                          <tr key={ev.id} className="hover:bg-[#F8F9FC] cursor-pointer transition" onClick={() => navigate(`/painel-evento/${ev.id}`)}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-zinc-200 flex-shrink-0" />
                                <div>
                                  <div className="text-[15px] text-slate-900 font-semibold leading-tight mb-0.5">{ev.name || 'Sem nome'}</div>
                                  <div className="text-slate-500 text-[11px]">{formatDate(ev.startDate)}</div>
                                  <div className="text-red-500 text-[11px] font-medium mt-0.5">{ev.privacy === 'public' ? 'Público' : 'Privado'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-600">{orgName}</td>
                            <td className="py-4 px-6 text-slate-700">{Number(ev.soldCount || 0)} / {Number(ev.capacity || 0)}</td>
                            <td className="py-4 px-6 text-slate-700">R${Number(ev.grossTotal || 0).toFixed(2).replace('.', ',')}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-[12px]">
                                <span className={`inline-block w-2 h-2 rounded-full ${ev.status === 'published' ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                <span className="text-slate-700">{ev.status === 'published' ? 'À venda' : ev.status === 'deleted' ? 'Excluído' : 'Rascunho'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4 justify-end">
                                <button onClick={(e)=>{e.stopPropagation(); navigate(`/create-event?eventId=${ev.id}`);}} className="text-indigo-600 hover:text-indigo-800" title="Editar"><Pencil size={18} /></button>
                                <button className="text-slate-400 hover:text-red-600" title="Excluir" onClick={(e)=>{e.stopPropagation(); setDeleteTarget(ev.id);}}><Trash2 size={18} /></button>
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
                <button onClick={openCreateCollection} className="h-[46px] px-6 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm">+ Criar coleção</button>
              </div>
              <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
                {filteredCollections.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-[#E5E7EB] overflow-hidden cursor-pointer bg-white hover:shadow-sm transition" onClick={()=>handleEditCollection(c)}>
                    <div className="h-40 bg-zinc-200 flex items-center justify-center overflow-hidden">
                      {c.bannerImage ? (<img src={c.bannerImage} alt={c.title} className="w-full h-full object-cover" />) : (<span className="text-xs text-zinc-500">Sem banner</span>)}
                    </div>
                    <div className="p-5 flex items-start justify-between">
                      <div>
                        <div className="text-slate-900 font-semibold text-[15px] mb-0.5">{c.title}</div>
                        {c.slug && (<div className="text-[11px] text-indigo-500 font-medium">/{c.slug}</div>)}
                        <div className="flex items-center gap-2 mt-2">
                          {c.published ? (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">Publicado</span>) : (<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-semibold">Rascunho</span>)}
                          {c.slug && c.published && (<button onClick={(e)=>{ e.stopPropagation(); const url = `${window.location.origin}/colecoes/${c.slug}`; try { navigator.clipboard.writeText(url); } catch {}; }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">Copiar link</button>)}
                          <button onClick={(e)=>{ e.stopPropagation(); togglePublish(c); }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">{c.published ? 'Despublicar' : 'Publicar'}</button>
                          {c.slug && c.published && (<button onClick={(e)=>{ e.stopPropagation(); shareCollection(c); }} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">Compartilhar</button>)}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-3"><div className="w-5 h-5 rounded-full bg-zinc-300" /><span>{c.organizerName || 'Nome do organizador'}</span></div>
                        <div className="text-[13px] text-orange-600 mt-3 font-medium">{(c.upcomingCount || 0)} {(c.upcomingCount || 0) === 1 ? 'próximo evento' : 'próximos eventos'}</div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600" title="Excluir" onClick={(e)=>{e.stopPropagation(); handleDeleteCollection(c.id);}}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {filteredCollections.length === 0 && (<div className="text-slate-400">Nenhuma coleção encontrada</div>)}
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
      <CollectionDrawer open={showCollectionDrawer} mode={collectionDrawerMode} initialData={editingCollection} organizationOptions={organizations} onClose={()=> setShowCollectionDrawer(false)} onSaved={handleCollectionSaved} onDelete={async (id)=> handleDeleteCollection(id)} loadEvents={collectionDrawerMode==='edit'? loadCollectionEvents : undefined} allUserEvents={events} onAddEvent={addEventToCollection} onRemoveEvent={removeEventFromCollection} />
    </div>
  );
};

export default OrganizerEvents;
