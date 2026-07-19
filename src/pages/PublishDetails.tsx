import AppHeader from "@/components/AppHeader";
import { fetchApi } from "@/lib/apiBase";
import React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from "react-router-dom";
import { ExternalLink, Users, EyeOff, ArrowRight, Ticket, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

import CustomCheckbox from "@/components/ui/CustomCheckbox";
import { getEventPath } from '@/lib/eventUrl';
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";
import { useToast } from '@/hooks/use-toast';
import { PageLoadingWrapper } from "@/components/PageLoadingWrapper";

const collectionsMock = [
  { id: '1', name: 'Nome da coleção', count: 5 },
  { id: '2', name: 'Nome da coleção', count: 2 },
];

const PublishDetails: React.FC = () => {
  // Removido useEffect que depende de organizerId para evitar erro de inicialização
  // DEBUG: log visual da organização carregada
  const [debugOrg, setDebugOrg] = React.useState<any>(null);
  // DEBUG: log visual do evento carregado
  const [debugEvent, setDebugEvent] = React.useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isPublic, setIsPublic] = React.useState(true);
  const [eventName, setEventName] = React.useState("Nome do evento");
  const [eventDateStr, setEventDateStr] = React.useState("15 janeiro 2025 às 18:30");
  // Banner URL é montada igual à página do evento
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [publicUrl, setPublicUrl] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("");
  const [categories, setCategories] = React.useState<Array<{ name: string; slug?: string }>>([]);
  const [organizerId, setOrganizerId] = React.useState<string | "">("");
  const [organizerOptions, setOrganizerOptions] = React.useState<Array<{ id: string; name: string; logoUrl?: string | null }>>([]);
  // Organization name and logo are set from event payload or fetched org
  const [eventOrganizerName, setEventOrganizerName] = React.useState<string | null>(null);
  const [eventOrganizerLogo, setEventOrganizerLogo] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [collectionsList, setCollectionsList] = React.useState<Array<any>>([]);
  const toggle = (id: string) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const eventId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("eventId");
  }, [location.search]);
  const [eventStatus, setEventStatus] = React.useState<"Rascunho" | "Publicado">("Rascunho");
  const [publishing, setPublishing] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [minPaidPrice, setMinPaidPrice] = React.useState<number | null>(null);
  const [totalAudience, setTotalAudience] = React.useState<number | null>(null);
  // Step overlay if coming from CreateTickets
  const [flowVisible, setFlowVisible] = React.useState(!!(location.state as any)?.stepFlow?.visible);
  const [flowStep] = React.useState<1 | 2 | 3>((location.state as any)?.stepFlow?.step || 3);
  React.useEffect(() => {
    if (flowVisible) {
      const t = setTimeout(() => setFlowVisible(false), 1200);
      return () => clearTimeout(t);
    }
  }, [flowVisible]);

  const { toast } = useToast();
  const { user } = useAuth();

  // Mobile menu states
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [eventMenuOpen, setEventMenuOpen] = React.useState(false);

  // Ticket types for completion status
  const [ticketTypes, setTicketTypes] = React.useState<any[]>([]);

  // Track original values for change detection (mobile save button)
  const [originalValues, setOriginalValues] = React.useState<any>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Keep an initial snapshot of relevant fields so we can detect "dirty" changes
  const initialSnapshotRef = React.useRef<null | { category: string; isPublic: boolean; organizerId: string; bannerUrl: string | null; selected: string[] }>(null);

  // Guard: if no eventId, redirect back to create-event
  React.useEffect(() => {
    if (!eventId) {
      navigate('/create');
    }
  }, [eventId, navigate]);

  // Load ticket types for completion status
  React.useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchApi(`/api/ticket-type/event/${eventId}`);
        if (res?.ok && mounted) {
          const data = await res.json();
          setTicketTypes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        // ignore errors, keep empty array
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  // Detect changes for mobile save button (only when published)
  React.useEffect(() => {
    if (!eventId || eventStatus !== 'Publicado') {
      setHasUnsavedChanges(false);
      return;
    }

    // Only check if we have loaded original values (check if object is not empty)
    if (!originalValues || Object.keys(originalValues).length === 0) {
      setHasUnsavedChanges(false);
      return;
    }

    const selectedStr = JSON.stringify([...selected].sort());
    const originalSelectedStr = JSON.stringify([...(originalValues.selected || [])].sort());

    const hasChanges =
      category !== originalValues.category ||
      isPublic !== originalValues.isPublic ||
      organizerId !== originalValues.organizerId ||
      selectedStr !== originalSelectedStr;

    setHasUnsavedChanges(hasChanges);
  }, [eventId, eventStatus, originalValues, category, isPublic, organizerId, selected]);

  // Load event details and organizer options
  React.useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        // Fetch event and categories in parallel to ensure we can normalize category data
        const [resEvent, resCats] = await Promise.all([
          fetchApi(`/api/event/${eventId}`),
          fetchApi('/api/categories')
        ]);

        let loadedCategories: Array<{ name: string; slug?: string }> = [];
        if (resCats.ok) {
          const list = await resCats.json();
          loadedCategories = Array.isArray(list) ? list.map((c: any) => ({ name: c.name, slug: c.slug })) : [];
          setCategories(loadedCategories);
        }

        if (resEvent.ok) {
          const ev = await resEvent.json();
          setDebugEvent(ev);
          setEventName(ev.name || 'Nome do evento');
          setEventStatus(ev.isPublished ? 'Publicado' : 'Rascunho');

          if (ev.image) {
            if (ev.image.startsWith('/uploads/')) {
              setBannerUrl(`${import.meta.env.VITE_API_BASE || ''}${ev.image}`);
            } else {
              setBannerUrl(ev.image);
            }
          } else if (ev.bannerUrl) {
            setBannerUrl(ev.bannerUrl);
          } else {
            setBannerUrl(null);
          }

          // Normalize Category: prefer slug if available in list
          let normalizedCategory = ev.category || "";
          if (normalizedCategory) {
            // Try to find by slug first
            const bySlug = loadedCategories.find(c => (c.slug === normalizedCategory));
            if (bySlug) {
              // perfect match
            } else {
              // Try to find by name
              const byName = loadedCategories.find(c => c.name.toLowerCase() === normalizedCategory.toLowerCase());
              if (byName && byName.slug) {
                normalizedCategory = byName.slug;
              }
            }
          }
          setCategory(normalizedCategory);

          setIsPublic(ev.privacy ? ev.privacy !== 'private' : true);
          setOrganizerId(ev.organizerId || ev.organizationId || "");

          setPublicUrl(getEventPath({ id: ev.id, slug: ev.slug }));

          const preSelected = Array.isArray(ev.collections) ? ev.collections.map((c: any) => c.id) : (Array.isArray(ev.collectionIds) ? ev.collectionIds : []);
          if (preSelected && preSelected.length) setSelected(preSelected);

          // Prepare snapshot with normalized values
          const snapshot = {
            category: normalizedCategory,
            isPublic: ev.privacy ? ev.privacy !== 'private' : true,
            organizerId: ev.organizerId || ev.organizationId || "",
            bannerUrl: ev.image || null,
            selected: preSelected
          };
          initialSnapshotRef.current = snapshot;
          setOriginalValues(snapshot);

          // Organization logic
          let orgName = '';
          let orgLogo = null;
          // ... existing org logic preserved below ...
          if (ev.organization && ev.organization.name) {
            orgName = ev.organization.name;
            orgLogo = ev.organization.logoUrl || ev.organization.logo || null;
          } else if (ev.organizationName) {
            orgName = ev.organizationName;
          } else if (ev.organizerName) {
            orgName = ev.organizerName;
          }
          if (orgName) setEventOrganizerName(orgName);
          if (orgLogo) setEventOrganizerLogo(orgLogo);

          // Fetch org if missing name/logo
          if (!orgName || !orgLogo) {
            const evOrgId = ev.organizerId || ev.organizationId || '';
            if (evOrgId) {
              try {
                const orgRes = await fetchApi(`/api/organization/${evOrgId}`);
                if (orgRes && orgRes.ok) {
                  const orgObj = await orgRes.json();
                  if (orgObj?.name) setEventOrganizerName(orgObj.name);
                  if (orgObj?.logoUrl || orgObj?.logo) setEventOrganizerLogo(orgObj.logoUrl || orgObj.logo);
                }
              } catch { }
            } else {
              setEventOrganizerName('');
              setEventOrganizerLogo(null);
            }
          }

          // Add to options
          const finalOrgId = ev.organizerId || ev.organizationId || '';
          if (orgName && finalOrgId) {
            setOrganizerOptions(prev => {
              if (prev.find(p => p.id === finalOrgId)) return prev;
              return [...prev, { id: finalOrgId, name: orgName, logoUrl: orgLogo || null }];
            });
          }

          // Fetch full org details if needed
          if (finalOrgId) {
            try {
              const orgRes = await fetchApi(`/api/organization/${finalOrgId}`);
              if (orgRes && orgRes.ok) {
                const orgObj = await orgRes.json();
                setDebugOrg(orgObj);
                // Update options with potentially better data
                setOrganizerOptions(prev => {
                  if (prev.find(p => p.id === orgObj.id)) return prev;
                  return [...prev, { id: orgObj.id, name: orgObj.name, logoUrl: orgObj.logoUrl || orgObj.logo || null }];
                });
              }
            } catch { }
          }

          // Date formatting
          if (ev.startDate) {
            const d = new Date(ev.startDate);
            const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = months[d.getMonth()];
            const ano = d.getFullYear();
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            setEventDateStr(`${dia} ${mes} ${ano} às ${hh}:${mi}`);
          }
        }
      } catch (err) {
        // no-op
      }

      // Load collections
      try {
        // ... (collections logic) ...
        const colsRes = await fetchApi('/api/collections'); // Simplified fallback
        if (colsRes && colsRes.ok) {
          const list = await colsRes.json();
          setCollectionsList(Array.isArray(list) ? list : []);
        }
      } catch (e) { }

      // Load ticket types
      try {
        const ttRes = await fetchApi(`/api/ticket-type/event/${eventId}`);
        if (ttRes.ok) {
          const list = await ttRes.json();
          if (Array.isArray(list)) {
            const paid = list.filter((t: any) => Number(t.price) > 0);
            const min = paid.length > 0 ? Math.min(...paid.map((t: any) => Number(t.price))) : null;
            setMinPaidPrice(Number.isFinite(min as number) ? (min as number) : null);
            const total = list.reduce((acc: number, t: any) => acc + (Number(t.maxQuantity) || 0), 0);
            setTotalAudience(total || null);
          }
        }
      } catch (err) { }

      // Load user orgs
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const or = await fetchApi(`/api/organization/user/${uid}`);
          if (or.ok) {
            const list = await or.json();
            setOrganizerOptions((prev) => {
              // Merge to avoid duplicates
              const newOpts = (list || []).map((o: any) => ({ id: o.id, name: o.name, logoUrl: o.logoUrl || o.logo || null }));
              const ids = new Set(prev.map(p => p.id));
              const filtered = newOpts.filter((n: any) => !ids.has(n.id));
              return [...prev, ...filtered];
            });
          }
        }
      } catch (err) { }

      setPageLoading(false);
    };
    load();
  }, [eventId]);

  // Re-fetch collections when organizerId changes (e.g. if user switches organization on this page)
  React.useEffect(() => {
    let mounted = true;
    const loadByOrg = async () => {
      if (!organizerId) return;
      try {
        const colsRes = await fetchApi(`/api/organization/${organizerId}/collections`);
        if (!mounted) return;
        if (colsRes && colsRes.ok) {
          const list = await colsRes.json();
          setCollectionsList(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        // ignore – keep existing list or fall back to mock
      }
    };
    loadByOrg();
    return () => { mounted = false; };
  }, [organizerId]);

  const isDirty = React.useMemo(() => {
    const init = initialSnapshotRef.current;
    if (!init) return false; // don't mark dirty until initial snapshot loaded
    if (init.category !== (category || '')) return true;
    if (Boolean(init.isPublic) !== Boolean(isPublic)) return true;
    if ((init.organizerId || '') !== (organizerId || '')) return true;
    if ((init.bannerUrl || null) !== (bannerUrl || null)) return true;
    return false;
  }, [category, isPublic, organizerId, bannerUrl]);

  const handleSaveChanges = async () => {
    if (!eventId) return;
    setPublishing(true);
    try {
      const res = await fetchApi(`/api/event/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: true,
          status: 'Publicado',
          privacy: isPublic ? 'public' : 'private',
          category: category || undefined,
          organizerId: organizerId || undefined,
          collectionIds: selected && selected.length ? selected : undefined,
        }),
      });
      if (!res.ok) throw new Error('Falha ao salvar alterações');
      // update snapshot to current values
      initialSnapshotRef.current = { category: category || '', isPublic: Boolean(isPublic), organizerId: organizerId || '', bannerUrl: bannerUrl || null, selected: selected || [] };
      toast?.({ title: 'Alterações salvas', description: 'As alterações no evento foram salvas.', variant: 'default' });
      // no full-page overlay here; keep UX inline for 'Salvar alterações'
    } catch (e: any) {
      toast?.({ title: 'Erro', description: e?.message || 'Erro ao salvar alterações', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };
  const organizerName = React.useMemo(() => {
    return organizerOptions.find(o => o.id === organizerId)?.name || (eventOrganizerName || '');
  }, [organizerOptions, organizerId, eventOrganizerName]);
  const foundOrg = React.useMemo(() => organizerOptions.find(o => o.id === organizerId) || null, [organizerOptions, organizerId]);
  const organizerInitials = React.useMemo(() => {
    if (!organizerName) return '';
    return organizerName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  }, [organizerName]);
  const formatBRL = React.useCallback((n: number) => {
    if (Number.isNaN(n)) n = 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
      .format(n)
      .replace(/\s/g, '');
  }, []);
  const handlePublish = async () => {
    if (!eventId) {
      return;
    }
    setPublishing(true);
    // Show overlay step 3 while publishing
    if (!flowVisible) {
      (window as any).requestAnimationFrame?.(() => setFlowVisible(true));
    }
    try {
      const res = await fetchApi(`/api/event/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: true,
          status: 'Publicado',
          privacy: isPublic ? 'public' : 'private',
          category: category || undefined,
          organizerId: organizerId || undefined,
          collectionIds: selected && selected.length ? selected : undefined,
        }),
      });
      if (!res.ok) throw new Error('Falha ao publicar evento');
      setEventStatus('Publicado');
      // pequena pausa para o overlay ser percebido
      await new Promise(r => setTimeout(r, 800));
      navigate(`/event/manage/${eventId}`);
    } catch (e) {
      // fallback: esconder overlay e manter na página
      setTimeout(() => setFlowVisible(false), 300);
    } finally {
      setPublishing(false);
    }
  };
  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex">
        {/* Mobile Menus */}
        <MobileTopBar
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          user={user}
        />

        <EventMobileTopBar
          onMenuOpen={() => setEventMenuOpen(true)}
          title="Publicar"
        />
        <EventMobileDrawer
          isOpen={eventMenuOpen}
          onClose={() => setEventMenuOpen(false)}
          currentPath={location.pathname}
          eventId={eventId || ''}
          eventName={eventName}
          eventDate={eventDateStr}
          eventStatus={eventStatus}
          hasTickets={ticketTypes.length > 0}
          isPublished={eventStatus === 'Publicado'}
        />

        {/* Desktop Sidebars - Hidden on mobile */}
        <SidebarMenu className="max-md:hidden" />
        <div className="fixed top-0 left-[70px] h-screen z-10 max-md:hidden">
          <EventDetailsSidebar
            eventName={eventName}
            eventDate={eventDateStr}
            eventStatus={eventStatus}
            onBack={() => navigate("/organizer-events")}
            onStatusChange={() => { }}
            onViewEvent={() => { }}
          />
        </div>
        <div className="flex-1 flex flex-col ml-[350px] max-md:ml-0">
          <AppHeader />
          <OrganizerLayout>
            <PageLoadingWrapper loading={pageLoading} variant="form" minLoadTime={300}>
              <div className="flex flex-col items-start w-full max-w-[800px] mx-auto max-md:ml-0 mt-[100px] max-md:mt-[140px] max-md:px-4">
                {/* Título e subtítulo - Hidden on mobile */}
                <div className="mb-6 max-sm:mb-4 max-md:hidden">
                  <h1 className="text-[28px] max-sm:text-xl font-bold text-indigo-950 dark:text-white mb-2">Seu evento está quase pronto para ser publicado</h1>
                  <p className="text-[16px] max-sm:text-sm text-indigo-900/80 dark:text-slate-300">Revise suas configurações e permita que todos encontrem seu evento.</p>
                </div>
                {/* Grid principal */}
                <div className="w-full flex flex-col gap-8 max-sm:gap-4">
                  {/* Linha 1: Resumo do evento + tipo/categoria + organizado por */}
                  <div className="flex flex-row max-md:flex-col gap-6 max-sm:gap-4 w-full">
                    {/* Bloco de resumo do evento */}
                    <div className="flex-1 min-w-[350px] max-md:min-w-0 max-w-[500px] max-md:max-w-full bg-white dark:bg-[#242424] rounded-2xl max-sm:rounded-xl shadow p-6 max-sm:p-4 flex flex-col gap-4 max-sm:gap-3 relative" style={{ minHeight: 260 }}>
                      {/* Banner do evento */}
                      <div className="w-full aspect-[16/9] rounded-xl max-sm:rounded-lg mb-2 border border-gray-200 dark:border-[#1F1F1F] overflow-hidden bg-gray-100 dark:bg-[#1F1F1F]">
                        {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner do evento" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm max-sm:text-xs text-indigo-900/60 dark:text-slate-300">Sem banner</div>
                        )}
                      </div>
                      <div className="font-bold text-lg max-sm:text-base text-[#091747] dark:text-white">{eventName}</div>
                      <div className="flex items-center gap-2 text-[#091747] text-sm max-sm:text-xs mb-4 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                        <span>{eventDateStr}</span>
                      </div>
                      {/* Removed textual summary; footer below will show numeric values only */}
                      <div className="flex-grow" />
                      <div className="flex items-center justify-between text-[#091747] text-sm max-sm:text-xs absolute left-6 max-sm:left-4 right-6 max-sm:right-4 bottom-6 max-sm:bottom-4 dark:text-white">
                        <span className="flex items-center gap-2 max-sm:gap-1">
                          <Ticket className="w-[18px] h-[18px] max-sm:w-4 max-sm:h-4 text-[#091747] dark:text-white" />
                          <span className="font-semibold">{formatBRL((minPaidPrice ?? 0))}</span>
                        </span>
                        <span className="flex items-center gap-2 max-sm:gap-1">
                          <Users className="w-[18px] h-[18px] max-sm:w-4 max-sm:h-4 text-[#091747] dark:text-white" />
                          <span className="font-semibold">{typeof totalAudience === 'number' ? totalAudience : 0}</span>
                        </span>
                        {publicUrl && (
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-medium flex items-center gap-1 max-sm:text-[10px]" style={{ color: '#EF4118' }}>
                            <span className="max-sm:hidden">Página do evento</span>
                            <ExternalLink className="w-[18px] h-[18px] max-sm:w-4 max-sm:h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Coluna tipo/categoria e organizado por */}
                    <div className="flex flex-col gap-4 max-sm:gap-3 flex-1 min-w-[300px] max-md:min-w-0">
                      <div className="bg-white rounded-2xl max-sm:rounded-xl shadow p-6 max-sm:p-4 flex flex-col gap-2 dark:bg-[#242424]">
                        <label className="text-[18px] max-sm:text-base text-indigo-900/80 font-bold mb-1 dark:text-white">Tipo e categoria de evento</label>
                        <span className="text-xs max-sm:text-[10px] text-indigo-900/70 mt-1 mb-3 max-sm:mb-2 dark:text-slate-300">O tipo e a categoria ajudam seu evento a aparecer em mais pesquisas.</span>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="w-full dark:bg-[#121212] dark:border-transparent dark:text-white">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                            {categories.length === 0 ? (
                              <SelectItem value="no-cat" disabled>Nenhuma categoria disponível</SelectItem>
                            ) : (
                              categories.map((c) => (
                                <SelectItem key={c.slug || c.name} value={(c.slug || c.name) as string}>{c.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-white rounded-2xl max-sm:rounded-xl shadow p-6 max-sm:p-4 flex flex-col gap-2 dark:bg-[#242424]">
                        <label className="text-[18px] max-sm:text-base text-indigo-900/80 font-medium mb-1 dark:text-white">Organizado por</label>
                        {/* Show the already-selected organization (no dropdown) */}
                        <div className="flex items-center gap-3 max-sm:gap-2 mt-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#1F1F1F] flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-white">
                            {eventOrganizerLogo ? (
                              <img src={eventOrganizerLogo} alt={eventOrganizerName || 'Organização'} className="w-full h-full object-cover" />
                            ) : (
                              <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{eventOrganizerName ? eventOrganizerName[0] : '??'}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="font-medium text-indigo-950 dark:text-white">{eventOrganizerName || 'Organização não selecionada'}</div>
                            {!eventOrganizerName && <div className="text-xs text-indigo-900/70 dark:text-slate-300">Nenhuma organização selecionada.</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Linha 2: Configurações de publicação + dicas */}
                  <div className="flex flex-row max-md:flex-col gap-6 max-sm:gap-4 w-full">
                    {/* Configurações de publicação */}
                    <div className="flex-1 min-w-[350px] max-md:min-w-0 bg-white dark:bg-[#242424] rounded-2xl max-sm:rounded-xl shadow p-6 max-sm:p-4">
                      <div className="font-semibold text-indigo-950 mb-1 text-lg max-sm:text-base dark:text-white">Configurações de publicação</div>
                      <div className="text-indigo-900/80 text-[12px] max-sm:text-[10px] mb-6 max-sm:mb-4 dark:text-slate-300">Seu evento é público ou privado?</div>
                      <div className="flex max-sm:flex-col gap-4 max-sm:gap-3">
                        {/* Card Público */}
                        <button
                          type="button"
                          className={`flex-1 rounded-xl max-sm:rounded-lg border-2 p-5 max-sm:p-4 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow dark:bg-[#1F1F1F] dark:border-[#2A2AD7]' : 'border-gray-200 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]'}`}
                          onClick={() => setIsPublic(true)}
                        >
                          <Users className={`w-8 h-8 max-sm:w-6 max-sm:h-6 mb-2 ${isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'} dark:text-white`} />
                          <div className={`font-bold text-[16px] max-sm:text-sm mb-1 ${isPublic ? 'text-[#6366F1]' : 'text-[#091747]'} dark:text-white`}>Público</div>
                          <div className="text-[#091747] text-[12px] max-sm:text-[10px] text-center dark:text-slate-300">Compartilhado na Fauves e nos mecanismos de pesquisa</div>
                        </button>
                        {/* Card Privado */}
                        <button
                          type="button"
                          className={`flex-1 rounded-xl max-sm:rounded-lg border-2 p-5 max-sm:p-4 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${!isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow dark:bg-[#1F1F1F] dark:border-[#2A2AD7]' : 'border-gray-200 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]'}`}
                          onClick={() => setIsPublic(false)}
                        >
                          <EyeOff className={`w-8 h-8 max-sm:w-6 max-sm:h-6 mb-2 ${!isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'} dark:text-white`} />
                          <div className={`font-bold text-[16px] max-sm:text-sm mb-1 dark:text-white`}>Privado</div>
                          <div className="text-[#091747] text-[12px] max-sm:text-[10px] text-center dark:text-slate-300">Visível apenas para quem tiver o link; não listado na Fauves nem indexado</div>
                        </button>
                      </div>
                    </div>
                    {/* Dicas antes de publicar (placeholder) */}
                    <div className="flex-1 min-w-[300px] max-md:min-w-0 bg-indigo-50 rounded-2xl max-sm:rounded-xl shadow p-6 max-sm:p-4 dark:bg-[#242424]">
                      <div className="font-semibold text-indigo-950 mb-4 max-sm:mb-3 max-sm:text-base dark:text-white">Confira essas dicas antes de publicar <span className='ml-1'>💡</span></div>
                      <ul className="flex flex-col gap-4 max-sm:gap-3">
                        <li>
                          <a href="#" className="text-[#2A2AD7] text-[14px] max-sm:text-xs hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                            Crie códigos promocionais para seu evento
                            <ArrowRight className="w-4 h-4 max-sm:w-3 max-sm:h-3 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-[#2A2AD7] text-[14px] max-sm:text-xs hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                            Personalizar seu formulário de pedido
                            <ArrowRight className="w-4 h-4 max-sm:w-3 max-sm:h-3 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-[#2A2AD7] text-[14px] max-sm:text-xs hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                            Desenvolver um plano de segurança para seu evento
                            <ArrowRight className="w-4 h-4 max-sm:w-3 max-sm:h-3 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* Espaço extra para não cobrir conteúdo pelo botão fixo */}
                  <div className="mb-32 max-md:mb-20" />
                </div>
                {/* Espaço extra para não cobrir conteúdo pelo botão fixo */}
                <div className="mb-32 max-md:mb-4" />
              </div>
            </PageLoadingWrapper>
          </OrganizerLayout>
          {/* Bottom bar fixa - Desktop only - Shows only when there are changes or event not published */}
          <AnimatePresence>
            {(eventStatus !== 'Publicado' || hasUnsavedChanges) && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-[370px] right-0 z-[999] max-md:hidden"
              >
                <div className="h-20 bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#1F1F1F] shadow-lg flex items-center justify-center px-8">
                  {eventStatus === 'Publicado' ? (
                    <Button
                      className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[200px] rounded-lg shadow-md disabled:opacity-60 px-6 flex items-center justify-center gap-2 whitespace-nowrap transition-all hover:shadow-xl"
                      onClick={handleSaveChanges}
                      disabled={publishing || !eventId || !hasUnsavedChanges}
                    >
                      {publishing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando…
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[200px] rounded-lg shadow-md disabled:opacity-60 px-6 flex items-center justify-center gap-2 whitespace-nowrap transition-all hover:shadow-xl"
                      onClick={handlePublish}
                      disabled={publishing || !eventId}
                    >
                      {publishing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Publicando…
                        </>
                      ) : (
                        <>
                          Publicar
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile bottom bar - shows for unpublished events or when there are changes */}
          {(eventStatus !== 'Publicado' || hasUnsavedChanges) && (
            <div className="hidden max-md:block fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0b0b0b] border-t border-slate-200 dark:border-[#1F1F1F] shadow-lg">
              <div className="px-4 py-3">
                {eventStatus === 'Publicado' ? (
                  <Button
                    onClick={async () => {
                      await handleSaveChanges();
                      // Update original values after save
                      setOriginalValues({
                        category,
                        isPublic,
                        organizerId,
                        selected: [...selected]
                      });
                      setHasUnsavedChanges(false);
                    }}
                    disabled={publishing || !eventId || !isDirty}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <span>{publishing ? 'Salvando…' : 'Salvar alterações'}</span>
                    {!publishing && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || !eventId}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <span>{publishing ? 'Publicando…' : 'Publicar'}</span>
                    {!publishing && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 3 ? "Preparando publicação…" : undefined} />
    </>
  );
};

export default PublishDetails;
