import AppHeader from "@/components/AppHeader";
import { fetchApi } from "@/lib/apiBase";
import React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { ExternalLink, Users, EyeOff, ArrowRight, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

import CustomCheckbox from "@/components/ui/CustomCheckbox";
import { getEventPath } from '@/lib/eventUrl';
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";

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
  const [organizerOptions, setOrganizerOptions] = React.useState<Array<{id:string; name:string}>>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
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
          setOrganizerId(ev.organizerId || ev.organizationId || "");
          setPublicUrl(getEventPath({ id: ev.id, slug: ev.slug }));
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
      } catch (_) {}
      // Load categories from backend
      try {
  const catRes = await fetchApi('/api/categories');
        if (catRes.ok) {
          const list = await catRes.json();
          setCategories(Array.isArray(list) ? list.map((c: any) => ({ name: c.name, slug: c.slug })) : []);
        }
      } catch (_) {}
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
        }
      } catch (_) {}
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const or = await fetchApi(`/api/organization/user/${uid}`);
          if (or.ok) {
            const list = await or.json();
            setOrganizerOptions((list || []).map((o: any) => ({ id: o.id, name: o.name })));
          }
        }
      } catch (_) {}
    };
    load();
  }, [eventId]);
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
    <div className="min-h-screen w-full bg-white flex">
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
            <h1 className="text-[28px] font-bold text-indigo-950 mb-2">Seu evento está quase pronto para ser publicado</h1>
            <p className="text-[16px] text-indigo-900/80">Revise suas configurações e permita que todos encontrem seu evento.</p>
          </div>
          {/* Grid principal */}
          <div className="w-full flex flex-col gap-8">
            {/* Linha 1: Resumo do evento + tipo/categoria + organizado por */}
            <div className="flex flex-row gap-6 w-full">
              {/* Bloco de resumo do evento */}
              <div className="flex-1 min-w-[350px] max-w-[500px] bg-white rounded-2xl shadow p-6 flex flex-col gap-4 relative" style={{minHeight: 260}}>
                {/* Banner do evento */}
                <div className="w-full aspect-[16/9] rounded-xl mb-2 border border-gray-200 overflow-hidden bg-gray-100">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner do evento" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-indigo-900/60">Sem banner</div>
                  )}
                </div>
                <div className="font-bold text-lg text-[#091747]">{eventName}</div>
                <div className="flex items-center gap-2 text-[#091747] text-sm">
                  <span>📅 {eventDateStr}</span>
                </div>
                {/* Removed textual summary; footer below will show numeric values only */}
                <div className="flex-grow" />
                <div className="flex items-center justify-between text-[#091747] text-sm absolute left-6 right-6 bottom-6">
                  <span className="flex items-center gap-2">
                    <Ticket className="w-[18px] h-[18px] text-[#091747]" />
                    <span className="font-semibold">{formatBRL((minPaidPrice ?? 0))}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-[18px] h-[18px] text-[#091747]" />
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
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2">
                  <label className="text-[18px] text-indigo-900/80 font-bold mb-1">Tipo e categoria de evento</label>
                  <span className="text-xs text-indigo-900/70 mt-1 mb-3">O tipo e a categoria ajudam seu evento a aparecer em mais pesquisas.</span>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2">
                  <label className="text-[18px] text-indigo-900/80 font-medium mb-1">Organizado por</label>
                  <span className="text-xs text-indigo-900/70 mt-1 mb-3">Seu evento aparecerá na página de perfil desta organização.</span>
                  <Select value={organizerId} onValueChange={setOrganizerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizerOptions.length === 0 ? (
                        <SelectItem value="no-options" disabled>Nenhuma organização</SelectItem>
                      ) : (
                        organizerOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Linha 2: Configurações de publicação + dicas */}
            <div className="flex flex-row gap-6 w-full">
              {/* Configurações de publicação */}
              <div className="flex-1 min-w-[350px] bg-white rounded-2xl shadow p-6">
                <div className="font-semibold text-indigo-950 mb-1 text-lg">Configurações de publicação</div>
                <div className="text-indigo-900/80 text-[12px] mb-6">Seu evento é público ou privado?</div>
                <div className="flex gap-4">
                  {/* Card Público */}
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border-2 p-5 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow' : 'border-gray-200 bg-white'}`}
                    onClick={() => setIsPublic(true)}
                  >
                    <Users className={`w-8 h-8 mb-2 ${isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'}`} />
                    <div className={`font-bold text-[16px] mb-1 ${isPublic ? 'text-[#6366F1]' : 'text-[#091747]'}`}>Público</div>
                    <div className="text-[#091747] text-[12px] text-center">Compartilhado na Fauves e nos mecanismos de pesquisa</div>
                  </button>
                  {/* Card Privado */}
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border-2 p-5 flex flex-col items-center transition-all duration-150 cursor-pointer focus:outline-none ${!isPublic ? 'border-[#2A2AD7] bg-indigo-50 shadow' : 'border-gray-200 bg-white'}`}
                    onClick={() => setIsPublic(false)}
                  >
                    <EyeOff className={`w-8 h-8 mb-2 ${!isPublic ? 'text-[#6366F1]' : 'text-[#2A2AD7]'}`} />
                    <div className={`font-bold text-[16px] mb-1 ${!isPublic ? 'text-[#091747]' : 'text-[#091747]'}`}>Privado</div>
                    <div className="text-[#091747] text-[12px] text-center">Visível apenas para quem tiver o link; não listado na Fauves nem indexado</div>
                  </button>
                </div>
              </div>
              {/* Dicas antes de publicar (placeholder) */}
              <div className="flex-1 min-w-[300px] bg-indigo-50 rounded-2xl shadow p-6">
                <div className="font-semibold text-indigo-950 mb-4">Confira essas dicas antes de publicar <span className='ml-1'>💡</span></div>
                <ul className="flex flex-col gap-4">
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group">
                        Crie códigos promocionais para seu evento
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group">
                        Personalizar seu formulário de pedido
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[#2A2AD7] text-[14px] hover:underline transition-colors flex items-center gap-2 group">
                        Desenvolver um plano de segurança para seu evento
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </li>
                </ul>
              </div>
            </div>
            {/* Linha 3: Configurações de pesquisa (coleções) */}
            <div className="w-full bg-white rounded-2xl shadow p-6 mt-2">
              <div className="font-semibold text-indigo-950 mb-1 text-lg">Configurações de pesquisa</div>
              <div className="text-indigo-900/80 text-sm mb-6">Adicione seu evento a uma coleção</div>
              <ul className="flex flex-col gap-4">
                {collectionsMock.map(col => (
                  <li key={col.id}>
                    <label className="flex items-center gap-4 w-full p-4 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all hover:shadow-sm">
                      <CustomCheckbox
                        checked={selected.includes(col.id)}
                        onChange={() => toggle(col.id)}
                        label=""
                      />
                      <span className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                        {/* Placeholder da imagem da coleção */}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-bold text-indigo-950 text-base">{col.name}</span>
                        <span className="text-indigo-900/60 text-sm">{col.count} próximos eventos</span>
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
        <Button
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[45px] w-[180px] rounded-md shadow-lg disabled:opacity-60"
          onClick={handlePublish}
          disabled={publishing || !eventId}
        >
          {publishing ? 'Publicando…' : 'Publicar'}
        </Button>
      </div>
    </div>
    <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 3 ? "Preparando publicação…" : undefined} />
    </>
  );
};

export default PublishDetails;
