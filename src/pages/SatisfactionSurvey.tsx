import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { Star, X, MessageSquare, Calendar as CalendarIcon, User as UserIcon, ExternalLink, ChevronDown, Info, Power } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

export default function SatisfactionSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { totalLeft } = useLayoutOffsets();

  const eventId = id || null;

  // Event data for mobile menus
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  // Aggregated stats from backend
  type Stats = {
    count: number;
    avg: { overall: number; lineup: number; sound: number; venue: number; security: number; accessibility: number };
    comments: Array<{ id: string; comment: string; createdAt: string; overall: number; lineup: number; sound: number; venue: number; security: number; accessibility: number }>;
    page: number;
    limit: number;
    survey?: { isActive: boolean; activatedAt?: string | null };
  };
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [surveyMeta, setSurveyMeta] = useState<{ isActive: boolean; activatedAt?: string | null } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const latestFetchRef = useRef(0);

  // Load event details for mobile menus
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const r = await fetchApi(`/api/event/${id}`);
        if (!r?.ok) return;
        const ev = await r.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart} às ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch { }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function loadTickets() {
      if (!id) return;
      try {
        const res = await fetch(`/api/ticket-type/event/${id}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setTicketTypes(data || []);
      } catch (e) {
        // ignore
      }
    }
    loadTickets();
    return () => { mounted = false; };
  }, [id]);

  const loadStats = useCallback(async () => {
    if (!eventId) {
      setStats(null);
      setSurveyMeta(null);
      return;
    }
    const currentFetchId = ++latestFetchRef.current;
    setLoadingStats(true);
    try {
      const r = await fetchApi(`/api/surveys/stats/${eventId}`);
      if (r?.ok) {
        const j = await r.json();
        if (latestFetchRef.current === currentFetchId) {
          setStats(j);
          setSurveyMeta(j?.survey ? { isActive: !!j.survey.isActive, activatedAt: j.survey.activatedAt || null } : { isActive: false, activatedAt: null });
        }
      } else {
        if (latestFetchRef.current === currentFetchId) {
          setStats(null);
          setSurveyMeta(null);
        }
      }
    } catch {
      if (latestFetchRef.current === currentFetchId) {
        setStats(null);
        setSurveyMeta(null);
      }
    } finally {
      if (latestFetchRef.current === currentFetchId) {
        setLoadingStats(false);
      }
    }
  }, [eventId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const toggleSurvey = useCallback(async (desired: boolean) => {
    if (!eventId) return false;
    setToggleLoading(true);
    let ok = false;
    try {
      const endpoint = desired ? `/api/surveys/${eventId}/activate` : `/api/surveys/${eventId}/deactivate`;
      const r = await fetchApi(endpoint, { method: 'POST' });
      if (!r?.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || 'Não foi possível atualizar a pesquisa.');
      }
      await loadStats();
      toast({
        title: desired ? 'Pesquisa ativada' : 'Pesquisa desativada',
        description: desired
          ? 'Os participantes receberão o formulário automaticamente.'
          : 'Novos envios foram pausados.',
      });
      ok = true;
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar pesquisa',
        description: e?.message || 'Tente novamente em instantes.',
        variant: 'destructive' as any,
      });
    } finally {
      setToggleLoading(false);
    }
    return ok;
  }, [eventId, loadStats, toast]);

  // Banner dismiss persistence
  const bannerKey = useMemo(() => `SAT_SURVEY_BANNER_HIDE_${eventId || 'global'}`, [eventId]);
  const [bannerOpen, setBannerOpen] = useState(true);
  useEffect(() => {
    try {
      const h = localStorage.getItem(bannerKey);
      if (h === '1') setBannerOpen(false);
    } catch { }
  }, [bannerKey]);
  const dismissBanner = () => {
    setBannerOpen(false);
    try { localStorage.setItem(bannerKey, '1'); } catch { }
  };

  // Activate survey modal
  const [activateOpen, setActivateOpen] = useState(false);
  const [eventEndText, setEventEndText] = useState<string | null>(null);

  // Topic details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<{ title: string; emoji: string } | null>(null);
  const openDetails = (title: string, emoji: string) => {
    setActiveTopic({ title, emoji });
    setDetailsOpen(true);
  };
  type TopicKey = keyof Stats['avg'];
  const getTopicKey = (title?: string | null): TopicKey | null => {
    if (!title) return null;
    const t = title.toLowerCase();
    if (t.includes('lineup')) return 'lineup';
    if (t.includes('sound')) return 'sound';
    if (t.includes('local') || t.includes('venue')) return 'venue';
    if (t.includes('segur')) return 'security';
    if (t.includes('acess')) return 'accessibility';
    if (t.includes('geral') || t.includes('satisfa')) return 'overall';
    return null;
  };
  const activeTopicKey = useMemo<TopicKey | null>(() => getTopicKey(activeTopic?.title), [activeTopic]);
  const activeTopicAvg = useMemo(() => {
    if (!activeTopicKey || !stats?.avg) return null;
    const value = stats.avg[activeTopicKey];
    return typeof value === 'number' ? value : null;
  }, [activeTopicKey, stats]);
  const topicComments = useMemo(() => {
    if (!activeTopicKey || !stats?.comments) return [];
    return stats.comments.filter((c) => typeof (c as any)[activeTopicKey] === 'number');
  }, [activeTopicKey, stats]);
  const topicImprovementComments = useMemo(() => {
    if (!activeTopicKey) return [];
    return topicComments.filter((c) => ((c as any)[activeTopicKey] || 0) <= 3);
  }, [activeTopicKey, topicComments]);

  // Try to load event end date for the activation modal timing copy
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) { setEventEndText(null); return; }
      try {
        const r = await fetchApi(`/api/event/${id}`);
        if (!r?.ok) { setEventEndText(null); return; }
        const ev = await r.json();
        if (!mounted) return;
        const end = ev?.endDate || ev?.endsAt || ev?.dateEnd || ev?.end_time;
        if (!end) { setEventEndText(null); return; }
        const endDt = new Date(end);
        if (isNaN(endDt.getTime())) { setEventEndText(null); return; }
        const sendDt = new Date(endDt.getTime() + 34 * 60 * 60 * 1000);
        const text = sendDt.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        setEventEndText(text);
      } catch { setEventEndText(null); }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const getAvgFor = (title: string): number | null => {
    const a = stats?.avg;
    if (!a || !stats?.count) return null;
    const t = (title || '').toLowerCase();
    if (t.includes('lineup')) return a.lineup;
    if (t.includes('sound')) return a.sound;
    if (t.includes('local')) return a.venue;
    if (t.includes('segur')) return a.security;
    if (t.includes('acess')) return a.accessibility;
    if (t.includes('geral') || t.includes('satisfa')) return a.overall;
    return null;
  };

  const TopicCard: React.FC<{ title: string; emoji: string }>
    = ({ title, emoji }) => {
      const average = getAvgFor(title);
      const hasData = !!stats?.count && average != null && stats.count > 0;
      return (
        <button
          className="text-left rounded-2xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] text-slate-900 dark:text-white p-4 max-sm:p-3 w-[185px] max-sm:w-[150px] flex-shrink-0 hover:border-indigo-300 dark:hover:border-indigo-500 transition"
          onClick={() => openDetails(title, emoji)}
        >
          <div className="text-sm max-sm:text-xs font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span>{emoji}</span>
            <span>{title}</span>
          </div>
          <div className="mt-3 text-lg max-sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
            {hasData ? (
              <>
                {average!.toFixed(1)} <span className="text-sm max-sm:text-xs text-slate-500 dark:text-slate-400">/ 5</span>
                <Star className="w-4 h-4 max-sm:w-3 max-sm:h-3 text-amber-400 fill-amber-400" />
              </>
            ) : (
              <span className="text-xs max-sm:text-[10px] font-normal text-slate-500 dark:text-slate-400">Sem dados ainda</span>
            )}
          </div>
          <div className="mt-1 text-[11px] max-sm:text-[9px] text-slate-500 dark:text-slate-400">
            {hasData ? `${stats?.count || 0} resposta${(stats?.count || 0) > 1 ? 's' : ''}` : 'Aguardando respostas'}
          </div>
        </button>
      );
    };

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      {/* Mobile Menus */}
      <MobileTopBar
        isOpen={mobileMenuOpen}
        onMenuOpen={() => setMobileMenuOpen(true)}
      />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
      />

      <EventMobileTopBar
        isOpen={eventMenuOpen}
        onMenuOpen={() => setEventMenuOpen(true)}
        title="Pesquisa de Satisfação"
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
      />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={eventId || ''}
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <SidebarMenu className="max-md:hidden" />
      {eventId && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventIdOverride={eventId}
            onBack={() => navigate(-1)}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
          />
        </div>
      )}
      <AppHeader />
      <OrganizerLayout>

        <div
          style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }}
          className="flex flex-col pl-8 max-md:pl-4 pr-8 max-md:pr-4 pb-16 max-md:pb-8 relative"
        >
          <div className="mt-24 max-md:mt-[140px] max-w-[800px] mx-auto max-md:max-w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap max-md:hidden">
              <h1 className="text-3xl max-sm:text-xl font-bold text-indigo-950 dark:text-white mb-3 max-sm:mb-0">Pesquisa de satisfação</h1>
              <div className="flex items-center gap-2 max-sm:w-full">
                {!bannerOpen && (
                  <Button variant="outline" onClick={() => setBannerOpen(true)} className="flex items-center gap-2 max-sm:text-xs max-sm:px-3">
                    <Info className="w-4 h-4" /> O que é?
                  </Button>
                )}
                {surveyMeta?.isActive ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={toggleLoading}
                        className="min-w-[140px] max-sm:min-w-[120px] justify-between bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-200 dark:bg-emerald-500/20 hover:bg-emerald-500/20 max-sm:text-xs max-sm:px-3"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Ativado
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#121212] dark:border-[#2b2b2b]">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        disabled={toggleLoading}
                        onSelect={async (e) => {
                          e.preventDefault();
                          await toggleSurvey(false);
                        }}
                      >
                        <Power className="w-4 h-4 mr-2" /> Desativar pesquisa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setActivateOpen(true);
                        }}
                      >
                        <Info className="w-4 h-4 mr-2" /> Sobre a pesquisa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button className="bg-indigo-600 hover:bg-indigo-700 max-sm:text-xs max-sm:px-3" disabled={toggleLoading} onClick={() => setActivateOpen(true)}>
                    {toggleLoading ? 'Carregando...' : 'Ativar pesquisa'}
                  </Button>
                )}
              </div>
            </div>
            {/* Botões mobile only */}
            <div className="hidden max-md:flex items-center gap-2 mb-4">
              {!bannerOpen && (
                <Button variant="outline" onClick={() => setBannerOpen(true)} className="flex items-center gap-2 text-xs px-3">
                  <Info className="w-4 h-4" /> O que é?
                </Button>
              )}
              {surveyMeta?.isActive ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={toggleLoading}
                      className="min-w-[120px] justify-between bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-200 dark:bg-emerald-500/20 hover:bg-emerald-500/20 text-xs px-3"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Ativado
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#121212] dark:border-[#2b2b2b]">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      disabled={toggleLoading}
                      onSelect={async (e) => {
                        e.preventDefault();
                        await toggleSurvey(false);
                      }}
                    >
                      <Power className="w-4 h-4 mr-2" /> Desativar pesquisa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setActivateOpen(true);
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" /> Sobre a pesquisa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 text-xs" disabled={toggleLoading} onClick={() => setActivateOpen(true)}>
                  {toggleLoading ? 'Carregando...' : 'Ativar pesquisa'}
                </Button>
              )}
            </div>

            {bannerOpen && (
              <div className="relative rounded-xl max-sm:rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 mt-2">
                <button
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
                  onClick={dismissBanner}
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="bg-black text-white p-8 max-sm:p-4">
                  <div className="text-xl max-sm:text-lg font-semibold">✨ Desbloqueie insights para aprimorar os eventos futuros:</div>
                  <div className="text-sm max-sm:text-xs text-zinc-300 mt-3">
                    Recolha o feedback de participantes e tenha insights para tomar decisões a partir de dados
                    para melhorar a experiência do evento como um todo
                  </div>
                  <div className="mt-5">
                    <Button
                      variant="secondary"
                      className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 gap-2 max-sm:text-xs max-sm:px-3"
                      onClick={() => openDetails('Lineup', '🎸')}
                    >
                      <Info className="w-4 h-4" />
                      Ver exemplo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 max-sm:mt-4">
              <div className="text-sm max-sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Notas por tema</div>
              <div className="flex gap-3 max-sm:gap-2 overflow-x-auto pb-2">
                <TopicCard title="Lineup" emoji="🎸" />
                <TopicCard title="Sound system" emoji="🔊" />
                <TopicCard title="Localização" emoji="📍" />
                <TopicCard title="Segurança" emoji="🛡️" />
                <TopicCard title="Acessibilidade" emoji="♿" />
              </div>
            </div>

            <div className="mt-8 max-sm:mt-4">
              <div className="text-sm max-sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Comentários</div>
              <div className="rounded-xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 max-sm:p-4">
                {stats?.comments?.length ? (
                  <div className="space-y-4">
                    {stats.comments.map((c) => (
                      <div key={c.id}>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            Nota geral: {typeof c.overall === 'number' ? c.overall.toFixed(1) : '—'}/5
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 leading-relaxed">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-300">Sem comentários por enquanto</div>
                )}
              </div>
              {stats?.comments?.length ? (
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-[#1a1a1a]">{stats.page}</span>
                  / {Math.max(1, Math.ceil((stats.count || 0) / (stats.limit || 1)))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </OrganizerLayout>

      {/* Ativar pesquisa */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Ativar pesquisa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* O que será enviado? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <MessageSquare className="w-4 h-4" /> O que será enviado?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Uma pesquisa com 3 pontos: satisfação como um todo, avaliações por temas e um comentário aberto.
              </div>
              <a
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm mt-2"
                href="#"
                onClick={(e) => { e.preventDefault(); setActivateOpen(false); openDetails('Lineup', '🎸'); }}
              >
                Ver a pesquisa <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Nota: as pesquisas são anônimas e não são customizáveis no momento
              </div>
            </div>

            {/* Quando? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <CalendarIcon className="w-4 h-4" /> Quando?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {eventEndText
                  ? <>A pesquisa será enviada por email automaticamente em <span className="font-medium text-slate-900 dark:text-white">{eventEndText}</span>, sendo 34 horas após o encerramento do evento.</>
                  : <>A pesquisa será enviada por email automaticamente 34 horas após o encerramento do evento.</>}
              </div>
            </div>

            {/* Para quem? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <UserIcon className="w-4 h-4" /> Para quem?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Os participantes do seu evento (aqueles que tiveram os ingressos escaneados).
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActivateOpen(false)}>Cancelar</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={toggleLoading}
              onClick={async () => {
                const ok = await toggleSurvey(true);
                if (ok) setActivateOpen(false);
              }}
            >
              {toggleLoading ? 'Ativando...' : 'Ativar a pesquisa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhes da avaliação (Notas por tema) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Detalhes da avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Top card */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
              <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeTopic?.emoji}</span>
                <span>{activeTopic?.title || 'Tópico'}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                {activeTopicAvg != null && stats?.count ? `${activeTopicAvg.toFixed(1)} / 5` : 'Sem dados ainda'}
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => {
                  const filled = activeTopicAvg ? Math.round(activeTopicAvg) : 0;
                  return (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  );
                })}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stats?.count ? `${stats.count} resposta${stats.count > 1 ? 's' : ''}` : 'Sem respostas ainda'}
              </div>
            </div>

            {/* Areas for improvement */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
              <div className="text-base font-semibold text-slate-900 dark:text-white">Áreas para melhoria</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Feedback das pessoas que avaliaram o {activeTopic?.title?.toLowerCase() || 'tópico'} com 1 a 3 estrelas
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {topicImprovementComments.length} resposta{topicImprovementComments.length !== 1 ? 's' : ''}
              </div>

              <div className="mt-4 space-y-3">
                {topicImprovementComments.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-300">Sem feedback negativo ainda.</div>
                ) : (
                  topicImprovementComments.map((c) => {
                    const ratedValue = activeTopicKey ? (c as any)[activeTopicKey] : null;
                    return (
                      <div key={c.id} className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
                        <div className="text-sm text-slate-900 dark:text-slate-100">{c.comment || 'Sem comentário'}</div>
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                          <span>Nota: {ratedValue ?? 0}/5</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
