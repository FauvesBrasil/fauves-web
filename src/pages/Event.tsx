import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LeadCapture from "@/components/LeadCapture";
import { getEventPath } from '@/lib/eventUrl';
import { apiUrl, ensureApiBase } from '@/lib/apiBase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TicketSelectionModal from '../components/TicketSelectionModal';
import EventPageSkeleton from "@/components/skeletons/EventPageSkeleton";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/LoginModal';
import FollowersModal from '@/components/FollowersModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';
import InterestButton from '../components/InterestButton';
import { Eye, Users, Flame, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEventHypeLevel, getHypeBadge } from '../lib/hype';
import { fetchApi } from '@/lib/apiBase';

// Modal de denúncia
function ReportModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (reason: string, email: string, description: string) => void }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('Listas de eventos fraudulentos ou golpes');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const reasons = [
    'Listas de eventos fraudulentos ou golpes',
    'Conteúdo nocivo',
    'Conteúdo ou atividades regulamentadas',
    'Spam',
    'Conteúdo sexualmente explícito',
    'Conteúdo odioso',
    'Violência ou extremismo',
    'Evento cancelado',
    'Solicitar reembolso',
    'Violação de direitos autorais ou marcas comerciais',
  ];
  const handleSend = () => {
    setError('');
    if (!email.trim() || !description.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    onSubmit(reason, email, description);
    setStep(1);
    setEmail('');
    setDescription('');
    setReason(reasons[0]);
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
      <div
        className="backdrop-blur-lg bg-white/60 dark:bg-[#0b0b0b]/60 border border-white/40 dark:border-[#1F1F1F] shadow-2xl rounded-2xl p-8 max-w-[540px] w-full relative text-indigo-950 dark:text-white"
        style={{ boxSizing: 'border-box' }}
      >
        <h2 className="text-center text-xl font-semibold text-indigo-950 dark:text-white mb-6">Denunciar evento</h2>
        {step === 1 ? (
          <>
            <div className="text-gray-700 text-base leading-relaxed mb-8">
              <p className="mb-4">Nossas Diretrizes da Comunidade descrevem o tipo de conteúdo que proibimos na Fauves. Se suspeitar que um evento pode estar violando as regras, você poderá denunciá-lo para que possamos investigar.</p>
              <p className="mb-4">Se você tiver alguma dúvida sobre um evento, precisar resolver uma disputa ou quiser solicitar um reembolso, recomendamos que, primeiramente, você entre em contato diretamente com o organizador.</p>
              <p>Se você ou outra pessoa estiver em perigo iminente devido à publicação de um evento, entre em contato com as autoridades locais para obter ajuda.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ minWidth: 180 }}
              >
                Iniciar relatório
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <div className="text-gray-700 text-base leading-relaxed mb-6">
              Ajude a Fauves a investigar este evento fornecendo informações sobre o motivo pelo qual você o está informando.
            </div>
            <div className="mb-5">
              <div className="font-semibold text-indigo-950 dark:text-white mb-2">Razão para denunciar</div>
              <div className="flex flex-col gap-1">
                {reasons.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer text-base text-gray-800">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-indigo-700 w-4 h-4"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-indigo-950 dark:text-white mb-1">
                Endereço de email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-indigo-950 dark:text-white mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
                placeholder="Por que você acredita que esta listagem de eventos é fraudulenta ou não autorizada? Descreva sua relação com o evento e/ou forneça um link para o site autorizado de venda de ingressos."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ minWidth: 180 }}
              >
                Enviar relatório
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white border border-indigo-200 text-indigo-700 dark:text-white text-base font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-all"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
        <button
          onClick={() => { setStep(1); onClose(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

const Event: React.FC = () => {
  // Estados principais devem ser declarados antes de qualquer uso
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [showBottomBar, setShowBottomBar] = useState(false);
  const { user, token } = useAuth();
  const [org, setOrg] = useState<any | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  // Importante: hooks precisam ficar antes de qualquer return condicional para não mudar a ordem entre renders
  const [mainImgErrored, setMainImgErrored] = useState(false);
  const { toast } = useToast();
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  // Tracking pixels integration
  const { trackPageView } = useTrackingPixels(event?.id);

  // Fire page_view when event is loaded
  useEffect(() => {
    if (event?.id && event?.name) {
      trackPageView({
        eventId: event.id,
        eventName: event.name,
        category: event.category,
      });
    }
  }, [event?.id, event?.name, event?.category, trackPageView]);

  // Registrar visualização de link rastreável (utm) ou direto (orgânico)
  useEffect(() => {
    if (!event?.id) return;
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source');
    const alias = utm || 'direct';
    fetch(apiUrl(`/api/marketing-link/track-view`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, alias })
    });
  }, [event?.id]);

  // Incrementar visualização com throttling via localStorage
  useEffect(() => {
    if (!event?.id) return;
    
    const VIEW_KEY = `fauves_view_${event.id}`;
    const lastView = localStorage.getItem(VIEW_KEY);
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (!lastView || (now - parseInt(lastView)) > thirtyMinutes) {
      fetch(apiUrl(`/api/event-metrics/increment/${event.id}`), { method: 'POST' })
        .then(() => {
          localStorage.setItem(VIEW_KEY, now.toString());
          // Opcionalmente: atualizar o estado local se quisermos ver o +1 imediatamente
          if (event.metrics) {
            setEvent((prev: any) => ({
              ...prev,
              metrics: { ...prev.metrics, views: (Number(prev.metrics.views) || 0) + 1 }
            }));
          }
        })
        .catch(err => console.error('Failed to increment view:', err));
    }
  }, [event?.id]);
  // Efeito blur/degradê no topo da tela será definido após checar loading/error/event
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  // Ensure API base is ready before making any requests (run once on mount)
  useEffect(() => {
    ensureApiBase().catch(() => { }); // Warm up API detection
  }, []);

  // Load categories mapping (slug -> display name) so we can show friendly names for event.category
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(apiUrl('/api/categories'));
        if (!r.ok) return;
        const list = await r.json();
        if (!Array.isArray(list)) return;
        const map: Record<string, string> = {};
        for (const c of list) {
          if (!c) continue;
          const slug = c.slug || c.name;
          const name = c.name || c.slug || String(slug || '');
          if (slug) map[slug] = name;
        }
        if (mounted) setCategoriesMap(map);
      } catch (e) {
        // ignore failures, we'll fallback to slug humanization
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carregar ticket types reais quando evento carregado
  useEffect(() => {
    if (!event?.id) return;
    let abort = false;
    const loadTickets = async () => {
      setTicketsLoading(true);
      setTicketsError('');
      try {
        const url = apiUrl(`/api/ticket-type/event/${event.id}/with-stats`);
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) throw new Error('Falha ao carregar tipos de ingresso');

        const data = await r.json();
        if (!Array.isArray(data)) throw new Error('Resposta inválida');

        if (!abort) {
          const norm = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price) || 0,
            available: typeof t.available === 'number' ? t.available : Math.max((t.maxQuantity ?? 0) - (t.sold ?? 0), 0),
            maxQuantity: t.maxQuantity,
            sold: t.sold,
            isHalf: t.isHalf,
            description: t.description,
          }));
          setTicketTypes(norm);
          // Mostrar bottom bar após carregar os ingressos
          setTimeout(() => setShowBottomBar(true), 100);
        }
      } catch (e: any) {
        if (!abort) setTicketsError('Não foi possível carregar ingressos agora. Tente novamente mais tarde.');
      } finally {
        if (!abort) setTicketsLoading(false);
      }
    };
    loadTickets();
    return () => { abort = true; };
  }, [event?.id]);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      setLoading(true);
      setError('');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      try {
        // Try slug first if not UUID, otherwise go straight to ID
        const endpoint = !isUUID
          ? apiUrl(`/api/event/slug/${encodeURIComponent(slugOrId)}`)
          : apiUrl(`/api/event/${encodeURIComponent(slugOrId)}`);

        let r = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });

        // If slug failed with 404, try as ID
        if (!r.ok && !isUUID && r.status === 404) {
          r = await fetch(apiUrl(`/api/event/${encodeURIComponent(slugOrId)}`), {
            headers: { 'Accept': 'application/json' }
          });
        }

        if (!r.ok) throw new Error('Evento não encontrado ou indisponível');

        const data = await r.json();
        setEvent(data);
        try { document.title = `${data.name || 'Evento'} | Fauves`; } catch { }

        // load organization info and followers in parallel
        const orgId = data.organizationId || data.organizerId;
        if (orgId) {
          Promise.all([
            fetch(apiUrl(`/api/organization/${encodeURIComponent(orgId)}`))
              .then(r => r.ok ? r.json() : null)
              .then(o => setOrg(o || null))
              .catch(e => console.warn('org fetch failed', e)),

            fetch(apiUrl(`/api/organization/${encodeURIComponent(orgId)}/followers/count`))
              .then(c => c.ok ? c.json() : null)
              .then(jc => {
                const num = Number(jc?.count ?? jc?.total ?? 0);
                setFollowersCount(num);
              })
              .catch(e => console.warn('followers count failed', e))
          ]);

          // Check follow status if user is logged in
          if (user?.id && token) {
            fetch(apiUrl(`/api/organization/${encodeURIComponent(orgId)}/follow`), {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(f => f.ok ? f.json() : null)
              .then(jf => setFollowing(!!jf?.following))
              .catch(() => { }); // ignore errors
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slugOrId, user?.id, token]);

  function formatLocationForEvent(ev: any) {
    if (!ev) return '';
    const city = ev.locationCity || ev.locationDetails?.city || ev.city;
    const uf = ev.locationUf || ev.locationDetails?.uf || ev.uf;
    if (city && uf) return `${city} - ${uf}`;
    if (typeof ev.location === 'string') {
      const s = ev.location.trim();
      if (!s) return '';
      if (s.includes('Local será anunciado')) {
        const parts = s.split(':').slice(1).join(':').trim();
        if (parts) return parts;
        return '';
      }
      return s;
    }
    return '';
  }

  const handleReport = (reason: string) => {
    setShowReport(false);
    setReportSent(true);
    setTimeout(() => setReportSent(false), 2500);
  };

  const handlePurchase = (selectedTickets: any[]) => {
    setShowTicketModal(false);
    // Here you would typically redirect to a payment page or handle the purchase
    console.log('Selected tickets:', selectedTickets);
    // For demo purposes, just show a success message
    setReportSent(true);
    setTimeout(() => setReportSent(false), 2500);
  };

  if (loading) return <EventPageSkeleton />;
  if (error || !event) {
    return (
      <div className="flex overflow-hidden flex-col pb-20 bg-white rounded-3xl min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-red-600 mb-4">{error || 'Evento não encontrado.'}</span>
            <a href="/" className="text-blue-600 underline">Voltar para a página inicial</a>
          </div>
        </div>
        <LeadCapture source="event-page" />
        <Footer />
      </div>
    );
  }

  // Definir blurImage após garantir que event existe
  const FALLBACK_EVENT_IMAGE = '/fallback-event-banner.png'; // coloque um asset estático em /public
  let blurImage = 'https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/0bfdd4b68cd20daf45d03327e505218f46fc94ad?placeholderIfAbsent=true';
  if (event?.image) {
    if (event.image.startsWith('/uploads/')) {
      blurImage = apiUrl(event.image);
    } else {
      blurImage = event.image;
    }
  }
  const eventMainImage = mainImgErrored ? FALLBACK_EVENT_IMAGE : (event?.image && event.image.startsWith('/uploads/') ? apiUrl(event.image) : (event?.image || blurImage));

  let content: React.ReactNode = null;
  try {
    content = (
      <div
        className="flex flex-col pb-0 max-md:pb-20 bg-white dark:bg-[#0b0b0b] rounded-3xl relative min-h-screen overflow-visible text-indigo-950 dark:text-white"
        style={{ position: 'relative', zIndex: 0 }}
      >
        {/* Efeito blur/degradê no topo: versão clara e escura. Usamos duas divs e alternamos com classes dark:block / dark:hidden */}
        <div
          className="absolute top-0 left-0 w-full h-[320px] z-0 pointer-events-none rounded-t-3xl block dark:hidden"
          style={{
            background: `linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, #fff 90%), url(${blurImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            filter: 'blur(24px) brightness(0.97)',
          }}
        />

        <div
          className="absolute top-0 left-0 w-full h-[320px] z-0 pointer-events-none rounded-t-3xl hidden dark:block"
          style={{
            background: `linear-gradient(to bottom, rgba(11,11,11,0.72) 0%, rgba(11,11,11,0.9) 90%), url(${blurImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            filter: 'blur(24px) brightness(0.6) contrast(0.9)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Header />

          {/* Badge de Evento Encerrado - Desktop apenas */}
          {event?.status === 'ENCERRADO' && (
            <div className="sticky top-[70px] z-50 w-full flex justify-center px-4 mb-6 max-md:hidden">
              <div className="w-full max-w-[1000px] bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-gray-600 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-bold uppercase tracking-wider">Evento Encerrado</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center mx-auto mt-5 max-w-[1000px] max-md:max-w-full max-md:px-4" style={{ marginBottom: 100 }}>
            {/* Alerta de Evento Externo - Versão Sutil */}
            {event?.isExternal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-4"
              >
                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                  <AlertTriangle size={18} className="text-orange-500 shrink-0" />
                  <p className="text-orange-800 dark:text-orange-300 text-[13px] leading-snug">
                    <span className="font-bold">Evento Externo:</span> Este evento não é vendido pela Fauves. Você será redirecionado para o site oficial ao clicar em comprar.
                  </p>
                </div>
              </motion.div>
            )}
            {/* Imagem Mobile (Hero) */}
            <div className="w-full md:hidden mb-6 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={eventMainImage}
                onError={(e) => { if (!mainImgErrored) setMainImgErrored(true); }}
                className="object-cover w-full aspect-video"
                alt={event.name || 'Imagem do evento'}
              />
            </div>

            <div className="flex flex-row gap-8 w-full mt-6 max-md:flex-col max-md:gap-0">
              {/* Coluna Esquerda */}
              <div className="flex flex-col w-[62%] max-md:w-full">
                {(() => {
                  const cats = event?.categories || [];
                  const categoryName = Array.isArray(cats) && cats.length > 0 
                    ? cats[0].name 
                    : (event?.category ? String(event?.category).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Geral');
                  const categorySlug = Array.isArray(cats) && cats.length > 0 
                    ? `/eventos/${cats[0].slug}` 
                    : (event?.category ? `/eventos/${event.category}` : '#');

                  return (
                    <Link 
                      to={categorySlug}
                      className="flex flex-col justify-center px-4 py-1.5 max-md:px-2.5 max-md:py-0.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors rounded-[100px] w-fit"
                    >
                      {categoryName}
                    </Link>
                  );
                })()}
                
                {/* Hype Badge & Metrics */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {(() => {
                    const hypeLevel = getEventHypeLevel(event?.metrics);
                    const hypeBadge = getHypeBadge(hypeLevel);
                    if (!hypeBadge) return null;
                    return (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[11px] font-black uppercase tracking-wider ${hypeBadge.color} shadow-md`}>
                        <span>{hypeBadge.icon}</span>
                        <span>{hypeBadge.label}</span>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-slate-400">
                    <Eye size={16} className="text-gray-400" />
                    <span>{event?.metrics?.views || 0} visualizações</span>
                  </div>
                  
                  {/* Seção de Interesse integrada */}
                  <InterestButton eventId={event.id} variant="detail" />
                </div>
                <div className="mt-2.5 text-4xl max-md:text-3xl font-bold text-indigo-950 dark:text-white leading-tight">
                  {event.name || "Nome do evento"}
                </div>
                <div className="text-lg max-md:text-base font-medium text-indigo-950 dark:text-slate-300 mt-2 max-md:mt-1.5">
                  {event.subtitle || "Subtítulo do evento"}
                </div>


                {/* Data e hora + Localização lado a lado */}
                <div className="flex flex-row gap-4 mt-8 mb-4 w-full max-md:flex-col max-md:gap-3">
                  {/* Data e hora */}
                  <div className="flex flex-col items-start justify-start flex-1 p-6 max-md:p-5 rounded-xl text-indigo-950 dark:text-white bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border border-white/30 dark:border-[#1F1F1F] shadow-md">
                    <span className="mb-2">
                      {/* Ícone calendário */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="#6366f1" fillOpacity="0.12" /><rect x="3" y="5" width="18" height="16" rx="3" stroke="#6366f1" strokeWidth="1.5" /><path d="M16 3v4M8 3v4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" /><path d="M3 9h18" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </span>
                    <div className="text-base max-md:text-sm font-bold mb-1">Data e hora</div>
                    <div className="text-lg max-md:text-[15px] mb-0.5 max-md:leading-snug">
                      {event.startDate
                        ? `${new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : '17 Janeiro 2025 às 20:00'}
                    </div>
                  </div>
                  {/* Localização */}
                  <div className="flex flex-col items-start justify-start flex-1 p-6 max-md:p-5 text-base rounded-xl text-indigo-950 dark:text-white bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border border-white/30 dark:border-[#1F1F1F] shadow-md">
                    <span className="mb-2">
                      {/* Ícone localização */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 21c4.418 0 8-5.373 8-10A8 8 0 0 0 4 11c0 4.627 3.582 10 8 10Z" fill="#f59e42" fillOpacity="0.12" /><path d="M12 21c4.418 0 8-5.373 8-10A8 8 0 0 0 4 11c0 4.627 3.582 10 8 10Z" stroke="#f59e42" strokeWidth="1.5" /><circle cx="12" cy="11" r="3" stroke="#f59e42" strokeWidth="1.5" /></svg>
                    </span>
                    <div className="font-bold mb-1 text-base max-md:text-sm">Localização</div>
                    <div className="text-lg max-md:text-[15px] max-md:leading-snug">{formatLocationForEvent(event) || "Rua do Endereço, bairro do endereço, cidade, estado."}</div>
                  </div>
                </div>

                {/* Line-up Section - moved above 'Sobre este evento' */}
                {event.artists && Array.isArray(event.artists) && event.artists.length > 0 && (
                  <div className="mt-8 max-md:mt-6 w-full">
                    <div className="text-2xl max-md:text-xl font-bold text-indigo-950 dark:text-white mb-5">
                      Line-up
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                      {event.artists
                        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                        .map((ea: any) => {
                          const artist = ea.artist || ea;
                          if (!artist || !artist.name) return null;
                          return (
                            <Link
                              key={artist.id || artist.spotifyId || artist.name}
                              to={`/artista/${artist.slug || artist.id}`}
                              className="flex-shrink-0 w-[140px] max-md:w-[120px] flex flex-col items-center p-4 max-md:p-3 rounded-xl bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border border-white/30 dark:border-[#1F1F1F] shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                            >
                              <div className="w-20 h-20 max-md:w-16 max-md:h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-[#1F1F1F] mb-3">
                                {artist.imageUrl ? (
                                  <img
                                    src={artist.imageUrl}
                                    alt={artist.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-600">
                                    {artist.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-indigo-950 dark:text-white text-center truncate w-full">
                                {artist.name}
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Sobre este evento - hidden if no description */}
                {event.description && (
                  <>
                    <div className="mt-8 max-md:mt-6 text-2xl max-md:text-xl font-bold text-indigo-950 dark:text-white">
                      Sobre este evento
                    </div>
                    <div
                      className="mt-5 max-md:mt-4 text-base max-md:text-[15px] max-md:leading-relaxed text-indigo-950 dark:text-slate-300 w-full max-w-[600px] max-md:max-w-full prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </>
                )}
                {/* Organizador */}
                <div className="flex flex-wrap gap-10 max-md:gap-4 p-5 max-md:p-4 mt-7 max-md:mt-6 rounded-xl bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border border-white/30 dark:border-[#1F1F1F] shadow-md">
                  <div className="flex flex-auto gap-5 text-[16px] font-medium text-indigo-950 dark:text-white items-center">
                    <div className="flex shrink-0">
                      {org?.logoUrl ? (
                        <Avatar className="w-[50px] h-[50px]">
                          <AvatarImage src={org.logoUrl} alt={org.name || 'Organização'} />
                          <AvatarFallback>{(org?.name || 'O')[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex shrink-0 rounded-full bg-zinc-300 h-[50px] w-[50px]" />
                      )}
                    </div>
                    <div className="flex-auto my-auto">
                      <div className="font-semibold text-indigo-950 dark:text-white">{org?.name || 'Organização'}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer" onClick={async () => {
                        if (!org?.id) return;
                        // open followers modal; try to fetch recent followers
                        try {
                          const r = await fetch(`/api/organization/${encodeURIComponent(org.id)}/followers`);
                          if (r.ok) {
                            const j = await r.json();
                            setFollowersList(j || []);
                          } else {
                            setFollowersList([]);
                          }
                        } catch (e) { setFollowersList([]); }
                        setShowFollowersModal(true);
                      }}>{formatFollowers(followersCount)} seguidores</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      className={`px-4 py-2 text-sm font-semibold ${following ? 'bg-white/90 text-indigo-700' : 'bg-[#2A2AD7] text-white'}`}
                      onClick={async () => {
                        if (!org?.id) return;
                        if (!user?.id || !token) {
                          setShowLoginModal(true);
                          return;
                        }
                        if (followLoading) return; // debounce
                        setFollowLoading(true);
                        try {
                          if (following) {
                            const r = await fetch(`/api/organization/${encodeURIComponent(org.id)}/follow`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                            if (r.ok) {
                              setFollowing(false);
                              setFollowersCount((c) => Math.max(0, (c || 0) - 1));
                              toast({ title: 'Deixou de seguir', description: 'Você deixou de seguir a organização.' });
                            } else {
                              const txt = await r.text();
                              toast({ title: 'Erro', description: txt || 'Falha ao deixar de seguir', variant: 'destructive' as any });
                            }
                          } else {
                            const r = await fetch(`/api/organization/${encodeURIComponent(org.id)}/follow`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                            if (r.ok) {
                              setFollowing(true);
                              setFollowersCount((c) => (c || 0) + 1);
                              toast({ title: 'Seguindo', description: 'Agora você segue esta organização.' });
                            } else {
                              const txt = await r.text();
                              toast({ title: 'Erro', description: txt || 'Falha ao seguir', variant: 'destructive' as any });
                            }
                          }
                        } catch (e: any) {
                          console.warn('follow toggle failed', e);
                          toast({ title: 'Erro', description: e?.message || 'Erro ao processar ação', variant: 'destructive' as any });
                        } finally {
                          setFollowLoading(false);
                        }
                      }}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      ) : (following ? 'Seguindo' : 'Seguir')}
                    </Button>
                  </div>
                </div>
                {/* Denunciar evento */}
                <button
                  onClick={() => setShowReport(true)}
                  className="flex gap-2.5 px-6 py-2 mt-10 max-md:mt-8 mx-auto text-[14px] max-md:text-[13px] font-medium bg-white dark:bg-[#242424] rounded-md shadow-lg text-indigo-950 dark:text-white transition-all duration-200 hover:bg-red-50 hover:shadow-2xl hover:-translate-y-1 hover:text-red-700 max-md:px-5 justify-center"
                  style={{ outline: 'none' }}
                >
                  <img
                    src="https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/a76370e49ec4dc6530794cf1bb5a0053e6c60993?placeholderIfAbsent=true"
                    className="object-contain shrink-0 my-auto aspect-[0.93] w-[13px]"
                    alt=""
                  />
                  <div className="basis-auto">Denunciar este evento</div>
                </button>
              </div>
              {/* Coluna Direita */}
              <div className="flex flex-col w-[38%] max-md:w-full ml-5 max-md:ml-0">
                <div className="sticky top-10 flex flex-col gap-4">
                  <div>
                    <div className="w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1b1b1b] hidden md:block">
                      <img
                        src={eventMainImage}
                        onError={(e) => { if (!mainImgErrored) setMainImgErrored(true); }}
                        className="object-cover w-full aspect-square rounded-2xl"
                        style={{
                          filter: event?.status === 'ENCERRADO' ? 'grayscale(100%)' : 'none',
                          opacity: event?.status === 'ENCERRADO' ? 0.7 : 1,
                        }}
                        alt={event.name || 'Imagem do evento'}
                      />
                    </div>
                    {/* Seção de ingressos - escondida quando evento encerrado e no mobile */}
                    {event?.status !== 'ENCERRADO' && (
                      <div className="flex flex-col p-5 w-full rounded-xl border max-md:mt-8 bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border-white/30 dark:border-[#1F1F1F] shadow-md z-20 max-md:hidden mt-4">
                        {ticketsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          </div>
                        ) : (
                          <>
                            <div className="self-center text-lg text-indigo-950 dark:text-white min-h-[28px] flex items-center">
                              {ticketsError && <span className="text-red-600 text-sm">{ticketsError}</span>}
                              {!ticketsError && ticketTypes.length === 0 && !event?.isExternal && 'Nenhum ingresso disponível'}
                              {!ticketsError && ticketTypes.length > 0 && `Ingressos a partir de R$${(Math.min(...ticketTypes.map(t => t.price)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </div>
                            {event?.isExternal ? (
                              <Button 
                                onClick={() => {
                                  if (event.externalUrl) {
                                    window.open(event.externalUrl, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 mt-4"
                              >
                                Comprar no Site Oficial
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </Button>
                            ) : (
                              <button
                                onClick={() => navigate(`/select-tickets/${event.id}`)}
                                className="flex justify-center px-16 py-3.5 mt-5 text-base font-bold text-white bg-[#2A2AD7] rounded-md max-md:px-5 transition-all duration-200 hover:bg-[#2A2AD7] hover:shadow-2xl hover:-translate-y-1 cursor-pointer w-full"
                                disabled={!!ticketsError && ticketTypes.length === 0}
                              >
                                <div>Selecionar ingressos</div>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} onSubmit={handleReport} />
          <TicketSelectionModal
            isOpen={showTicketModal}
            onClose={() => setShowTicketModal(false)}
            eventName={event.name || "Nome do evento"}
            eventDate={event.startDate
              ? `${new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · ${new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : '15 janeiro 2025 · 13:00'
            }
            eventImage={event.image}
            ticketTypes={ticketTypes}
            onPurchase={handlePurchase}
            debug={showTicketModal}
          />
          <FollowersModal open={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followersList} />
          {reportSent && (
            <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: 'white', padding: '12px 24px', borderRadius: 8, zIndex: 2000 }}>
              Denúncia enviada com sucesso!
            </div>
          )}
          <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => { toast({ title: 'Bem-vindo', description: 'Login efetuado' }); }} />

          {/* Mobile Bottom Bar - Evento Encerrado */}
          {event?.status === 'ENCERRADO' && (
            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white p-4 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] border-t-2 border-gray-600">
              <div className="flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base font-bold uppercase tracking-wider">Evento Encerrado</span>
              </div>
            </div>
          )}

          {/* Mobile Sticky Footer for Tickets */}
          {event?.status !== 'ENCERRADO' && showBottomBar && (
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#1b1b1b] border-t border-gray-200 dark:border-[#333] p-4 px-5 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-bottom animate-slide-up">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">A partir de</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-white">
                  {ticketTypes.length > 0
                    ? `R$ ${(Math.min(...ticketTypes.map(t => t.price)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Indisponível'}
                </span>
              </div>
              {event?.isExternal ? (
                <Button 
                  onClick={() => {
                    if (event.externalUrl) {
                      window.open(event.externalUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-[15px] rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  Comprar no Site Oficial
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/select-tickets/${event.id}`)}
                  className="bg-[#2A2AD7] text-white px-6 py-3 text-[15px] rounded-full font-bold shadow-lg hover:bg-[#1f1fcf]"
                  disabled={ticketTypes.length === 0}
                >
                  Comprar Ingressos
                </Button>
              )}
            </div>
          )}

          <LeadCapture source="event-page" />
          <Footer />
        </div>
      </div>
    );
  } catch (err: any) {
    console.error('[Event render] falhou', err);
    return <div style={{ padding: 40 }}><h2>Erro ao renderizar evento</h2><p>Tente recarregar a página.</p></div>;
  }
  return content as any;
};

export default Event;

// helper to format followers count
function formatFollowers(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}
