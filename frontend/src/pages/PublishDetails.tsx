import AppHeader from "@/components/AppHeader";
import { fetchApi } from "@/lib/apiBase";
import React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { ExternalLink, Users, EyeOff, ArrowRight, Ticket, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

import CustomCheckbox from "@/components/ui/CustomCheckbox";
import { getEventPath } from '@/lib/eventUrl';
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";
import { useToast } from '@/hooks/use-toast';

const collectionsMock = [
  { id: '1', name: 'Nome da coleção', count: 5 },
  { id: '2', name: 'Nome da coleção', count: 2 },
];

const PublishDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPublic, setIsPublic] = React.useState(true);
  const [eventName, setEventName] = React.useState("Nome do evento");
  const [eventDateStr, setEventDateStr] = React.useState("15 janeiro 2025 às 18:30");
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [publicUrl, setPublicUrl] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("");
  const [categories, setCategories] = React.useState<Array<{ name: string; slug?: string }>>([]);
  const [organizerId, setOrganizerId] = React.useState<string | "">("");
  const [organizerOptions, setOrganizerOptions] = React.useState<Array<{id:string; name:string; logoUrl?: string | null}>>([]);
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
  // Keep an initial snapshot of relevant fields so we can detect "dirty" changes
  const initialSnapshotRef = React.useRef<null | { category: string; isPublic: boolean; organizerId: string; bannerUrl: string | null; selected: string[] }>(null);

  // Guard: if no eventId, redirect back to create-event
  React.useEffect(() => {
    if (!eventId) {
      navigate('/create-event');
    }
  }, [eventId, navigate]);
  // Load event details and organizer options
  React.useEffect(() => {
    const load = async () => {
      if (!eventId) return;
  try {
  const res = await fetchApi(`/api/event/${eventId}`);
    if (res.ok) {
          const ev = await res.json();
          setEventName(ev.name || 'Nome do evento');
          setEventStatus(ev.isPublished ? 'Publicado' : 'Rascunho');
          setBannerUrl(ev.image || null);
          setCategory(ev.category || "");
          setIsPublic(ev.privacy ? ev.privacy !== 'private' : true);
          const evOrgId = ev.organizerId || ev.organizationId || '';
          setOrganizerId(evOrgId || "");
          setPublicUrl(getEventPath({ id: ev.id, slug: ev.slug }));
          // store initial snapshot for dirty checking
          initialSnapshotRef.current = { category: ev.category || "", isPublic: ev.privacy ? ev.privacy !== 'private' : true, organizerId: ev.organizerId || ev.organizationId || "", bannerUrl: ev.image || null, selected: Array.isArray(ev.collections) ? ev.collections.map((c: any) => c.id) : (Array.isArray(ev.collectionIds) ? ev.collectionIds : []) };
          // If event already includes collections, pre-select them
          const preSelected = Array.isArray(ev.collections) ? ev.collections.map((c: any) => c.id) : (Array.isArray(ev.collectionIds) ? ev.collectionIds : []);
          if (preSelected && preSelected.length) setSelected(preSelected);
          // If the event payload directly includes the organization name, add it now
          const evOrgName = ev.organization?.name || ev.organizationName || ev.organizerName || '';
          const evOrgLogo = ev.organization?.logoUrl || ev.organization?.logo || ev.logoUrl || ev.logo || '';
          if (evOrgName) setEventOrganizerName(evOrgName);
          if (evOrgLogo) setEventOrganizerLogo(evOrgLogo || null);
          if (evOrgName && evOrgId) {
            setOrganizerOptions(prev => {
              if (prev.find(p => p.id === evOrgId)) return prev;
              return [...prev, { id: evOrgId, name: evOrgName, logoUrl: evOrgLogo || null }];
            });
          }
          // Also try fetching the organization directly so we always have name/logo available
          try {
            const oid = evOrgId;
            if (oid) {
              const orgRes = await fetchApi(`/api/organization/${oid}`);
              if (orgRes && orgRes.ok) {
                const orgObj = await orgRes.json();
                if (orgObj && orgObj.id) {
                  setOrganizerOptions(prev => {
                    if (prev.find(p => p.id === orgObj.id)) return prev;
                    return [...prev, { id: orgObj.id, name: orgObj.name, logoUrl: orgObj.logoUrl || orgObj.logo || null }];
                  });
                }
              }
            }
          } catch (_) {}
          if (ev.startDate) {
            const d = new Date(ev.startDate);
            const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
            const dia = String(d.getDate()).padStart(2,'0');
            const mes = months[d.getMonth()];
            const ano = d.getFullYear();
            const hh = String(d.getHours()).padStart(2,'0');
            const mi = String(d.getMinutes()).padStart(2,'0');
            setEventDateStr(`${dia} ${mes} ${ano} às ${hh}:${mi}`);
          }
        }
      } catch (err) {
        console.error('[PublishDetails(frontend)] failed to load event', { eventId, err });
      }
      // Load categories from backend
      try {
  const catRes = await fetchApi('/api/categories');
        if (catRes.ok) {
          const list = await catRes.json();
          setCategories(Array.isArray(list) ? list.map((c: any) => ({ name: c.name, slug: c.slug })) : []);
        } else {
          console.error('[PublishDetails(frontend)] /api/categories responded with', { status: catRes.status });
        }
      } catch (err) {
        console.error('[PublishDetails(frontend)] failed to load categories', { err });
      }
      // Load collections owned by the event's organization (preferred) or fallback to global collections
      try {
        const orgId = organizerId || '';
        let colsRes;
        if (orgId) {
          colsRes = await fetchApi(`/api/organization/${orgId}/collections`);
        } else {
          colsRes = await fetchApi('/api/collections');
        }
        if (colsRes && colsRes.ok) {
          const list = await colsRes.json();
          setCollectionsList(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        // silent fail – we'll fall back to collectionsMock
      }

      // Load ticket types to compute price-from and audience
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
        } else {
          console.error('[PublishDetails(frontend)] /api/ticket-type/event responded with', { status: ttRes.status });
        }
      } catch (err) {
        console.error('[PublishDetails(frontend)] failed to load ticket types', { err });
      }
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const or = await fetchApi(`/api/organization/user/${uid}`);
          if (or.ok) {
            const list = await or.json();
            setOrganizerOptions((list || []).map((o: any) => ({ id: o.id, name: o.name, logoUrl: o.logoUrl || o.logo || null })));
          } else {
            console.error('[PublishDetails(frontend)] /api/organization/user responded with', { status: or.status });
          }
        }
      } catch (err) {
        console.error('[PublishDetails(frontend)] failed to load organizations for user', { err });
      }
      // If organizer for the event isn't present in organizerOptions, try fetching it by id
      try {
        const oid = (typeof organizerId === 'string' && organizerId) ? organizerId : null;
        if (oid) {
          const exists = (organizerOptions || []).find(o => o.id === oid);
          if (!exists) {
            const orgRes = await fetchApi(`/api/organization/${oid}`);
            if (orgRes && orgRes.ok) {
              const orgObj = await orgRes.json();
              if (orgObj && orgObj.id) {
                setOrganizerOptions(prev => {
                  if (prev.find(p => p.id === orgObj.id)) return prev;
                  return [...prev, { id: orgObj.id, name: orgObj.name, logoUrl: orgObj.logoUrl || orgObj.logo || null }];
                });
              }
            } else {
              try {
                const text = await orgRes.text();
                console.error('[PublishDetails(frontend)] /api/organization/:id non-ok response', { oid, status: orgRes.status, body: text });
              } catch (e) {
                console.error('[PublishDetails(frontend)] /api/organization/:id non-ok response (failed reading body)', { oid, status: orgRes.status, err: e });
              }
            }
          }
        }
      } catch (err) {
        console.error('[PublishDetails(frontend)] failed to fetch organization by id', { organizerId, err });
      }
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
    return organizerName.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
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
  navigate(`/painel-evento/${eventId}`);
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
      <SidebarMenu />
      <div className="fixed top-0 left-[70px] h-screen z-10">
        <EventDetailsSidebar
          eventName={eventName}
          eventDate={eventDateStr}
          eventStatus={eventStatus}
          onBack={() => navigate("/organizer-dashboard")}
          onStatusChange={() => {}}
          onViewEvent={() => {}}
        />
      </div>
      <div className="flex-1 flex flex-col ml-[350px]">
        <AppHeader />
  <div className="flex flex-col items-start w-full max-w-[800px] ml-20 mt-[100px]">
          {/* Título e subtítulo */}
          <div className="mb-6">
            <h1 className="text-[28px] font-bold text-indigo-950 dark:text-white mb-2">Seu evento está quase pronto para ser publicado</h1>
            <p className="text-[16px] text-indigo-900/80 dark:text-slate-300">Revise suas configurações e permita que todos encontrem seu evento.</p>
          </div>
          {/* Grid principal */}
          <div className="w-full flex flex-col gap-8">
            {/* Linha 1: Resumo do evento + tipo/categoria + organizado por */}
            <div className="flex flex-row gap-6 w-full">
              {/* Bloco de resumo do evento */}
              <div className="flex-1 min-w-[350px] max-w-[500px] bg-white dark:bg-[#242424] rounded-2xl shadow p-6 flex flex-col gap-4 relative" style={{minHeight: 260}}>
                {/* Banner do evento */}
                <div className="w-full aspect-[16/9] rounded-xl mb-2 border border-gray-200 dark:border-[#1F1F1F] overflow-hidden bg-gray-100 dark:bg-[#1F1F1F]">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner do evento" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-indigo-900/60 dark:text-slate-300">Sem banner</div>
                  )}
                </div>
                <div className="font-bold text-lg text-[#091747] dark:text-white">{eventName}</div>
                <div className="flex items-center gap-2 text-[#091747] text-sm mb-4 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                  <span>{eventDateStr}</span>
                </div>
                {/* Removed textual summary; footer below will show numeric values only */}
                <div className="flex-grow" />
                <div className="flex items-center justify-between text-[#091747] text-sm absolute left-6 right-6 bottom-6 dark:text-white">
                  <span className="flex items-center gap-2">
                    <Ticket className="w-[18px] h-[18px] text-[#091747] dark:text-white" />
                    <span className="font-semibold">{formatBRL((minPaidPrice ?? 0))}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-[18px] h-[18px] text-[#091747] dark:text-white" />
                    <span className="font-semibold">{typeof totalAudience === 'number' ? totalAudience : 0}</span>
                  </span>
                  {publicUrl && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-medium flex items-center gap-1" style={{ color: '#EF4118' }}>
                      Página do evento
                      <ExternalLink className="w-[18px] h-[18px]" />
                    </a>
                  )}
                </div>
              </div>
              {/* Coluna tipo/categoria e organizado por */}
              <div className="flex flex-col gap-4 flex-1 min-w-[300px]">
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2 dark:bg-[#242424]">
                  <label className="text-[18px] text-indigo-900/80 font-bold mb-1 dark:text-white">Tipo e categoria de evento</label>
                  <span className="text-xs text-indigo-900/70 mt-1 mb-3 dark:text-slate-300">O tipo e a categoria ajudam seu evento a aparecer em mais pesquisas.</span>
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
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2 dark:bg-[#242424]">
                  <label className="text-[18px] text-indigo-900/80 font-medium mb-1 dark:text-white">Organizado por</label>
                  {/* Show the already-selected organization (no dropdown) */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#1F1F1F] flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-white">
                      {(foundOrg?.logoUrl || eventOrganizerLogo) ? (
                        <img src={(foundOrg?.logoUrl || eventOrganizerLogo) as string} alt={organizerName || 'org'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm font-semibold text-zinc-700 dark:text-white">{organizerInitials || '??'}</div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium text-indigo-950 dark:text-white">{organizerName || 'Organização não selecionada'}</div>
                      {/* keep a small hint if none selected */}
                      {!organizerName && <div className="text-xs text-indigo-900/70 dark:text-slate-300">Nenhuma organização selecionada.</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Linha 2: Configurações de publicação + dicas */}
            <div className="flex flex-row gap-6 w-full">
              {/* Configurações de publicação */}
              <div className="flex-1 min-w-[350px] bg-white dark:bg-[#242424] rounded-2xl shadow p-6">
                <div className="font-semibold text-indigo-950 mb-1 text-lg dark:text-white">Configurações de publicação</div>
                <div className="text-indigo-900/80 text-[12px] mb-6 dark:text-slate-300">Seu evento é público ou privado?</div>
                <div className="flex gap-4">
                  {/* Card Público */}
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border-2 p-5 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow dark:bg-[#1F1F1F] dark:border-[#2A2AD7]' : 'border-gray-200 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]'}`}
                    onClick={() => setIsPublic(true)}
                  >
                    <Users className={`w-8 h-8 mb-2 ${isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'} dark:text-white`} />
                    <div className={`font-bold text-[16px] mb-1 ${isPublic ? 'text-[#6366F1]' : 'text-[#091747]'} dark:text-white`}>Público</div>
                    <div className="text-[#091747] text-[12px] text-center dark:text-slate-300">Compartilhado na Fauves e nos mecanismos de pesquisa</div>
                  </button>
                  {/* Card Privado */}
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border-2 p-5 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${!isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow dark:bg-[#1F1F1F] dark:border-[#2A2AD7]' : 'border-gray-200 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]'}`}
                    onClick={() => setIsPublic(false)}
                  >
                    <EyeOff className={`w-8 h-8 mb-2 ${!isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'} dark:text-white`} />
                    <div className={`font-bold text-[16px] mb-1 dark:text-white`}>Privado</div>
                    <div className="text-[#091747] text-[12px] text-center dark:text-slate-300">Visível apenas para quem tiver o link; não listado na Fauves nem indexado</div>
                  </button>
                </div>
              </div>
              {/* Dicas antes de publicar (placeholder) */}
              <div className="flex-1 min-w-[300px] bg-indigo-50 rounded-2xl shadow p-6 dark:bg-[#242424]">
                <div className="font-semibold text-indigo-950 mb-4 dark:text-white">Confira essas dicas antes de publicar <span className='ml-1'>💡</span></div>
                <ul className="flex flex-col gap-4">
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                        Crie códigos promocionais para seu evento
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                        Personalizar seu formulário de pedido
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group dark:text-[#EF4118]">
                        Desenvolver um plano de segurança para seu evento
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                </ul>
              </div>
            </div>
            {/* Linha 3: Configurações de pesquisa (coleções) */}
            <div className="w-full bg-white dark:bg-[#242424] rounded-2xl shadow p-6 mt-2">
              <div className="font-semibold text-indigo-950 mb-1 text-lg dark:text-white">Configurações de pesquisa</div>
              <div className="text-indigo-900/80 text-sm mb-6 dark:text-slate-300">Adicione seu evento a uma coleção</div>
              <ul className="flex flex-col gap-4">
                {(collectionsList && collectionsList.length ? collectionsList : collectionsMock).map(col => (
                  <li key={col.id}>
                    <label className="flex items-center gap-4 w-full p-4 rounded-xl border border-gray-200 bg-white dark:bg-[#242424] dark:border-[#1F1F1F] cursor-pointer transition-all hover:shadow-sm">
                      <CustomCheckbox
                        checked={selected.includes(col.id)}
                        onChange={() => toggle(col.id)}
                        label=""
                      />
                      <span className="w-10 h-10 rounded bg-gray-200 dark:bg-[#1F1F1F] flex items-center justify-center">
                        {/* Placeholder da imagem da coleção */}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-bold text-indigo-950 text-base dark:text-white">{col.name}</span>
                        <span className="text-indigo-900/60 text-sm dark:text-slate-300">{col.count} próximos eventos</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Espaço extra para não cobrir conteúdo pelo botão fixo */}
          <div className="mb-32" />
        </div>
      </div>
      {/* Botão fixo Publicar */}
      <div className="fixed bottom-6 right-6 z-50">
        {eventStatus === 'Publicado' ? (
          <Button
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[180px] rounded-md shadow-lg disabled:opacity-60 px-4 flex items-center justify-center whitespace-nowrap"
            onClick={handleSaveChanges}
            disabled={publishing || !eventId || !isDirty}
          >
            {publishing ? 'Salvando…' : (
              <span className="flex items-center justify-center gap-2">Salvar alterações</span>
            )}
          </Button>
        ) : (
          <Button
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[180px] rounded-md shadow-lg disabled:opacity-60 px-4 flex items-center justify-center whitespace-nowrap"
            onClick={handlePublish}
            disabled={publishing || !eventId}
          >
            {publishing ? 'Publicando…' : (
              <span className="flex items-center justify-center gap-2">Publicar <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
            )}
          </Button>
        )}
      </div>
    </div>
    <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 3 ? "Preparando publicação…" : undefined} />
    </>
  );
};

export default PublishDetails;
