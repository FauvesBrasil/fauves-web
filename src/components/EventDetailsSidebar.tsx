import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import { useRegisterSidebar } from '@/context/LayoutOffsetsContext';
import { fetchApi } from "@/lib/apiBase";
import { useLocation } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { getEventPath } from '@/lib/eventUrl';
import { ChevronLeft, ChevronDown, ExternalLink, Home, Megaphone, MessageSquare, Users, UserCog, BarChart3, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import './event-sidebar-scrollbar.css';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "active" | "inactive";
  link?: string;
}

type MenuIcon = React.ComponentType<{ className?: string }>;

interface MenuItem {
  title: string;
  hasSubmenu?: boolean;
  icon?: MenuIcon;
}

type EventStatusType = "Rascunho" | "Publicado" | "Encerrado" | "Pausado" | "Excluído" | string;
interface EventDetailsSidebarProps {
  eventName?: string;
  eventDate?: string;
  eventStatus?: EventStatusType;
  steps?: Step[];
  menuItems?: MenuItem[];
  onBack?: () => void;
  onStatusChange?: (status: EventStatusType) => void;
  onViewEvent?: () => void;
  onStepClick?: (stepId: string) => void;
  /** Optional: provide eventId directly (e.g., when using route param instead of query) */
  eventIdOverride?: string | null;
  /** Route to navigate when clicking "Painel" */
  panelRoute?: string;
  /** When true, pins the sidebar to the viewport and makes its content scrollable */
  fixed?: boolean;
  /** Left offset in pixels when fixed (to account for main sidebar) */
  fixedLeft?: number;
  /** Width in pixels when fixed */
  fixedWidth?: number;
  /** Top offset in pixels when fixed (e.g., if you have a global header) */
  fixedTop?: number;
}

const defaultSteps: Step[] = [
  {
    id: "create-page",
    title: "Criar página do evento",
    description: "Adicionar todos os detalhes do seu evento e comunicar aos participantes o que esperar",
    status: "completed"
  },
  {
    id: "configure-ticket",
    title: "Configurar ingresso",
    description: "Usar nossas sugestões para ajudar a vender mais ingressos ou criar manualmente o seu próprio",
    status: "active"
  },
  {
    id: "publish",
    title: "Publicar",
    description: "Revisar a página e as configurações do seu evento e publicá-lo",
    status: "inactive"
  }
];

const defaultMenuItems: MenuItem[] = [
  { title: "Painel", icon: Home },
  { title: "Analytics", icon: TrendingUp },
  { title: "Marketing", hasSubmenu: true, icon: Megaphone },
  { title: "Pesquisa de satisfação", icon: MessageSquare },
  { title: "Participantes", hasSubmenu: true, icon: Users },
  { title: "Gerenciar equipe", icon: UserCog }
];

type CachedEventInfo = {
  name?: string;
  date?: string;
  status?: EventStatusType;
  ticketCount?: number;
};

const eventInfoCache = new Map<string, CachedEventInfo>();
const eventInfoPromises = new Map<string, Promise<CachedEventInfo>>();

const mergeEventCache = (eventId: string, patch: CachedEventInfo) => {
  if (!eventId) return;
  const prev = eventInfoCache.get(eventId) || {};
  eventInfoCache.set(eventId, { ...prev, ...patch });
};

const normalizeStatus = (value: any, fallback: EventStatusType = "Rascunho"): EventStatusType => {
  if (typeof value === 'string') {
    switch (value.toLowerCase()) {
      case 'draft': return 'Rascunho';
      case 'published': return 'Publicado';
      case 'completed': return 'Encerrado';
      case 'paused': return 'Pausado';
      case 'deleted': return 'Excluído';
      default: return value;
    }
  }
  if (typeof value === 'boolean') {
    return value ? 'Publicado' : 'Rascunho';
  }
  return fallback;
};

const fetchEventInfo = (eventId: string): Promise<CachedEventInfo> => {
  if (!eventId) return Promise.resolve({});
  if (eventInfoPromises.has(eventId)) return eventInfoPromises.get(eventId)!;

  const promise = (async () => {
    const info: CachedEventInfo = { ...(eventInfoCache.get(eventId) || {}) };
    try {
      const res = await fetchApi(`/api/event/${eventId}`);
      if (res?.ok) {
        const ev = await res.json().catch(() => null);
        if (ev) {
          info.name = ev.name || ev.title || ev.eventName || info.name;
          info.date = ev.startDate ? (ev.startDate + (ev.startTime ? ` às ${ev.startTime}` : '')) : (ev.date || info.date);
          info.status = normalizeStatus(
            typeof ev.isPublished === 'boolean' ? ev.isPublished : ev.status,
            info.status || 'Rascunho'
          );
        }
      }
    } catch { }

    try {
      const ticketRes = await fetchApi(`/api/ticket-type/event/${eventId}`);
      if (ticketRes?.ok) {
        const data = await ticketRes.json().catch(() => null);
        if (Array.isArray(data)) info.ticketCount = data.length;
      }
    } catch { }

    mergeEventCache(eventId, info);
    return info;
  })().finally(() => {
    if (eventInfoPromises.get(eventId) === promise) eventInfoPromises.delete(eventId);
  });

  eventInfoPromises.set(eventId, promise);
  return promise;
};

export const EventDetailsSidebar: React.FC<EventDetailsSidebarProps> = ({
  eventName = "Nome do evento",
  eventDate = "15 janeiro 2025 às 18:30",
  eventStatus = "Rascunho",
  steps = defaultSteps,
  menuItems = defaultMenuItems,
  onBack,
  onStatusChange,
  onViewEvent,
  onStepClick,
  eventIdOverride,
  panelRoute: panelRouteProp,
  fixed = false,
  fixedLeft = 70,
  fixedWidth = 300,
  // default top offset to account for global header height so sidebar doesn't sit under the header
  fixedTop = 64
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Confetti canvas ref
  const confettiCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  // Keep previous status to detect transition
  const prevStatusRef = React.useRef<typeof eventStatus | null>(null);
  // Registrar somente quando estiver fixed (faz parte do layout lateral)
  useRegisterSidebar('detail', containerRef, fixed);
  // Resolve eventId from multiple possible sources: explicit override, route params (id/slugOrId/eventId), or query string
  const routeParams = useParams();
  const eventId = React.useMemo(() => {
    if (eventIdOverride) return eventIdOverride;
    // route params commonly used: id, slugOrId, eventId
    const candidate = (routeParams as any).id || (routeParams as any).slugOrId || (routeParams as any).eventId;
    if (candidate) return candidate;
    const params = new URLSearchParams(location.search);
    return params.get("eventId");
  }, [location.search, eventIdOverride, routeParams]);

  const { toast } = useToast();

  // Tooltip to explain why Publish is disabled when there are no tickets
  const [showPublishTooltip, setShowPublishTooltip] = React.useState<boolean>(false);
  const [publishTooltipPos, setPublishTooltipPos] = React.useState<{ left: number; top: number } | null>(null);
  const publishBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const [statusLocal, setStatusLocal] = React.useState<EventStatusType>(eventStatus);
  React.useEffect(() => setStatusLocal(eventStatus), [eventStatus]);

  // Local copies of event name/date so the sidebar can fetch and display details
  const [nameLocal, setNameLocal] = React.useState<string | undefined>(eventName);
  const [dateLocal, setDateLocal] = React.useState<string | undefined>(eventDate);
  const [ticketCount, setTicketCount] = React.useState<number | null>(null);
  // Track if event data has been loaded for smooth entry animation
  // Use lazy initialization to check cache immediately and avoid flash on navigation
  const [isLoaded, setIsLoaded] = React.useState(() => {
    if (!eventId) return true;
    return eventInfoCache.has(eventId);
  });
  React.useEffect(() => setNameLocal(eventName), [eventName]);
  React.useEffect(() => setDateLocal(eventDate), [eventDate]);

  // Memoize applyEventInfo to prevent unnecessary effect re-runs
  const applyEventInfo = React.useCallback((info: CachedEventInfo) => {
    if (!info) return;
    if (info.name) setNameLocal(info.name);
    if (info.date) setDateLocal(info.date);
    if (info.status) setStatusLocal(info.status);
    if (typeof info.ticketCount === 'number') setTicketCount(info.ticketCount);
  }, []);

  React.useEffect(() => {
    if (!eventId) {
      setIsLoaded(true);
      return;
    }

    // Opt-out of fetching if we already have the data provided via props
    if (eventName !== "Nome do evento" && typeof ticketCount === 'number') {
      setIsLoaded(true);
      // Still update cache for other components
      mergeEventCache(eventId, { name: eventName, date: eventDate, status: eventStatus as EventStatusType, ticketCount });
      return;
    }

    let cancelled = false;
    const cached = eventInfoCache.get(eventId);
    if (cached) {
      applyEventInfo(cached);
      // If we have cached data, show immediately without loading flash
      setIsLoaded(true);
    }
    fetchEventInfo(eventId).then((info) => {
      if (!cancelled) {
        applyEventInfo(info);
        setIsLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [eventId, applyEventInfo, eventName, eventDate, eventStatus, ticketCount]);

  // internal publish/unpublish handler if parent didn't provide one
  const internalChangeStatus = React.useCallback(async (newStatus: EventStatusType) => {
    if (!eventId) return false;
    try {
      const body: any = { isPublished: newStatus === 'Publicado', status: newStatus };
      const res = await fetchApi(`/api/event/${eventId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        let msg = `Falha ao atualizar status (${res.status})`;
        try {
          const j = await res.json().catch(() => null);
          if (j && (j.error || j.message)) msg = j.error || j.message;
        } catch { }
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' });
        return false;
      }
      // Confirm by reloading the event and updating local state
      try {
        const getRes = await fetchApi(`/api/event/${eventId}`);
        if (getRes.ok) {
          const ev = await getRes.json().catch(() => null);
          const published = !!(ev && ev.isPublished);
          const statusValue: EventStatusType = normalizeStatus(ev?.status, published ? 'Publicado' : 'Rascunho');
          setStatusLocal(statusValue);
          mergeEventCache(eventId, { status: statusValue });
          toast?.({ title: published ? 'Evento publicado' : 'Evento despublicado' });
          // dispatch a window event so parent pages can listen and refresh
          try { window.dispatchEvent(new CustomEvent('fauves:eventStatusChanged', { detail: { eventId, isPublished: published } })); } catch { }
          return true;
        }
      } catch (e) {
        // ignore get error, still show success
      }
      toast?.({ title: newStatus === 'Publicado' ? 'Evento publicado' : 'Evento despublicado' });
      setStatusLocal(newStatus);
      mergeEventCache(eventId, { status: newStatus });
      try { window.dispatchEvent(new CustomEvent('fauves:eventStatusChanged', { detail: { eventId, isPublished: newStatus === 'Publicado' } })); } catch { }
      return true;
    } catch (e) {
      toast?.({ title: 'Erro', description: 'Erro de conexão ao atualizar status', variant: 'destructive' });
      return false;
    }
  }, [eventId, toast]);

  // Paths base de cada etapa (sem query string) para detectar etapa ativa
  const stepPaths: Record<string, string> = {
    "create-page": "/create-event",
    "configure-ticket": "/create-tickets",
    "publish": "/publish-details",
  };
  // Rotas completas para navegação (anexando eventId quando disponível)
  const stepRoutes: Record<string, string> = {
    // when we already have an eventId, take the user to the edit page instead of public event page
    // (we don't want 'Criar página do evento' to navigate to the public event page and allow accidental edits)
    "create-page": eventId ? `/create-event?eventId=${eventId}` : "/create-event",
    "configure-ticket": eventId ? `/create-tickets?eventId=${eventId}` : "/create-tickets",
    "publish": eventId ? `/publish-details?eventId=${eventId}` : "/publish-details",
  };

  // Descobre qual step está ativo pela rota atual (comparando apenas pathname)
  const currentStepId = Object.keys(stepPaths).find(
    key => location.pathname.startsWith(stepPaths[key])
  );

  const handleStepClick = (stepId: string, disabled?: boolean) => {
    if (disabled) return;
    const route = stepRoutes[stepId];
    if (route) navigate(route);
  };

  // Show event menus only if we have a valid eventId
  const showEventMenus = !!eventId;

  // Memoize route checks to prevent recalculation on every render
  const routeState = React.useMemo(() => {
    const pathname = location.pathname;
    const isOnCreate = pathname.startsWith('/create-event');
    const isOnTickets = pathname.startsWith('/create-tickets');
    const isOnPublish = pathname.startsWith('/publish-details');
    const isOnMarketing = pathname.startsWith('/marketing');
    const isOnParticipants = pathname.startsWith('/participantes/pedidos') ||
      pathname.startsWith('/participantes/lista') ||
      pathname.startsWith('/participantes/checkin') ||
      pathname.includes('/ingressos-emitidos');
    const isOnSatisfaction = pathname.startsWith('/pesquisa-satisfacao');
    const isOnEquipe = pathname.startsWith('/gerenciar-equipe');
    const isOnAnalytics = pathname.includes('/analytics');
    const isPanelActive = !(isOnCreate || isOnTickets || isOnPublish || isOnMarketing || isOnParticipants || isOnEquipe || isOnSatisfaction || isOnAnalytics);

    return { isOnCreate, isOnTickets, isOnPublish, isOnMarketing, isOnParticipants, isOnSatisfaction, isOnEquipe, isOnAnalytics, isPanelActive };
  }, [location.pathname]);

  const { isOnCreate, isOnTickets, isOnPublish, isOnMarketing, isOnParticipants, isOnSatisfaction, isOnEquipe, isOnAnalytics, isPanelActive } = routeState;

  // Optimized: use routeState values instead of recalculating
  const displaySteps: Step[] = React.useMemo(() => {
    // Completed logic independent of current route (editing keeps check)
    const isCreateCompleted = !!eventId; // criou evento => ok
    const isTicketsCompleted = !!eventId && (ticketCount ?? 0) > 0; // tem ao menos 1 ingresso => ok
    const isPublishCompleted = statusLocal === 'Publicado';

    const createStatus: Step['status'] = isCreateCompleted ? 'completed' : (isOnCreate ? 'active' : 'inactive');
    const ticketsStatus: Step['status'] = isTicketsCompleted ? 'completed' : (!eventId ? 'inactive' : (isOnTickets ? 'active' : 'inactive'));
    const publishStatus: Step['status'] = isPublishCompleted ? 'completed' : (isOnPublish ? 'active' : (!eventId ? 'inactive' : 'inactive'));

    return [
      {
        id: 'create-page',
        title: isCreateCompleted ? 'Editar página do evento' : 'Criar página do evento',
        description: 'Adicionar todos os detalhes do seu evento e comunicar aos participantes o que esperar',
        status: createStatus,
      },
      {
        id: 'configure-ticket',
        title: isTicketsCompleted ? 'Ingressos' : 'Configurar ingresso',
        description: 'Usar nossas sugestões para ajudar a vender mais ingressos ou criar manualmente o seu próprio',
        status: ticketsStatus,
      },
      {
        id: 'publish',
        title: isPublishCompleted ? 'Configurações do evento' : 'Publicar',
        description: 'Revisar a página e as configurações do seu evento e publicá-lo',
        status: publishStatus,
      },
    ];
  }, [eventId, ticketCount, isOnCreate, isOnTickets, isOnPublish, statusLocal]);

  // Always route 'Painel' to painel-evento when we have an eventId
  // Optimized: only recalculate when eventId or panelRouteProp changes (not on every pathname change)
  const panelRoute = React.useMemo(() => {
    if (eventId) return `/painel-evento/${eventId}`;
    return panelRouteProp || location.pathname;
  }, [panelRouteProp, eventId, location.pathname]);

  // Format the event date string into a localized pt-BR short weekday + day + short month + year, then time.
  // Examples handled: "2025-11-22 às 10:00", "2025-11-22 10:00", or any parseable date string.
  // Normalize event date/time display across the app to: "DD MMM YYYY às HH:MM" (e.g. "15 jan 2025 às 18:30").
  // Memoized with useCallback to prevent recreation on every render
  const formatEventDate = React.useCallback((input?: string) => {
    if (!input) return '';
    // Try to match ISO-like inputs first: "YYYY-MM-DD às HH:MM" or "YYYY-MM-DD HH:MM" or "YYYY-MM-DD"
    const isoLike = /(?:(\d{4}-\d{2}-\d{2}))(?:\s*(?:às)?\s*(\d{2}:\d{2}))?/i;
    const m = input.match(isoLike);
    let dateObj: Date | null = null;
    if (m) {
      const datePart = m[1];
      const timePart = m[2] || '00:00';
      const iso = `${datePart}T${timePart}:00`;
      dateObj = new Date(iso);
    } else {
      const parsed = Date.parse(input);
      if (!isNaN(parsed)) dateObj = new Date(parsed);
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      // If we can't parse, return the original input to avoid hiding information
      return input;
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthsShort = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = monthsShort[dateObj.getMonth()] || '';
    const year = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} às ${hh}:${mm}`;
  }, []);

  // Submenu state (which top-level menu is expanded)
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);

  // Auto-expand Marketing submenu when current route is a marketing page
  // Optimized: use memoized route state to prevent unnecessary effect runs
  React.useEffect(() => {
    if (isOnMarketing) {
      setExpandedMenu('Marketing');
    } else if (isOnParticipants) {
      setExpandedMenu('Participantes');
    } else if (isOnEquipe) {
      setExpandedMenu(null);
    }
  }, [isOnMarketing, isOnParticipants, isOnEquipe]);

  const handleMenuClick = (itemTitle: string) => {
    // Toggle expand only for items that have submenus
    if (!itemTitle) return;
    setExpandedMenu(prev => prev === itemTitle ? null : itemTitle);
  };

  // Trigger confetti when eventStatus transitions to 'Publicado'
  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = statusLocal;
    if (prev === 'Publicado') return; // already published before
    if (statusLocal !== 'Publicado') return;

    // Launch confetti animation
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      const parent = canvas.parentElement as HTMLElement | null;
      if (!parent) return;
      canvas.width = Math.floor(parent.clientWidth * DPR);
      canvas.height = Math.floor(parent.clientHeight * DPR);
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; vr: number };
    const colors = ['#FF7A00', '#FFD700', '#2AD2D7', '#7C3AED', '#FF4D6D', '#33CC66'];
    const particles: Particle[] = [];
    const count = 80;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - (Math.PI / 2);
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * (w * 0.5),
        y: h * 0.15 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }

    const gravity = 0.12;
    const drag = 0.998;

    const start = performance.now();
    const duration = 2500; // ms

    function render(now: number) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of particles) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (elapsed < duration || particles.some(p => p.y < h + 50)) {
        raf = requestAnimationFrame(render);
      } else {
        // clear once finished
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    raf = requestAnimationFrame(render);

    // stop after a while and cleanup
    const cleanupTimeout = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, duration + 500);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      clearTimeout(cleanupTimeout);
      try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch (e) { /**/ }
    };
  }, [statusLocal]);

  // Update statusLocal when other parts of the app dispatch the global event status change
  React.useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const d = ce.detail as { eventId?: string; isPublished?: boolean } | undefined;
        if (!d) return;
        if (!eventId) return;
        if (d.eventId && String(d.eventId) !== String(eventId)) return;
        if (typeof d.isPublished === 'boolean') {
          setStatusLocal(d.isPublished ? 'Publicado' : 'Rascunho');
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('fauves:eventStatusChanged', handler as EventListener);
    return () => window.removeEventListener('fauves:eventStatusChanged', handler as EventListener);
  }, [eventId]);
  return (
    <div
      ref={containerRef}
      className="rounded-none overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent event-sidebar-scrollbar"
      style={fixed ? { position: 'fixed', top: fixedTop, left: fixedLeft, width: fixedWidth, height: '100vh', zIndex: 30 } : { height: '100vh', maxWidth: 280 }}
      data-sidebar-detail={fixed ? 'true' : undefined}
    >
      <AnimatePresence mode="wait">
        {isLoaded && (
          <motion.div
            key="sidebar-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pb-[100px] w-full bg-gray-50 dark:bg-[#0b0b0b] border-r border-gray-100 dark:border-[#1F1F1F]"
          >
            {/* Header */}
            <div className="flex gap-4 items-center px-3.5 py-4 text-sm text-indigo-700 dark:text-white bg-gray-50 dark:bg-[#0b0b0b] border-b border-neutral-300 dark:border-[#1F1F1F] min-h-[59px]">
              <div className="object-contain shrink-0 self-stretch my-auto aspect-[0.56] w-[5px]">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <button
                className="self-stretch my-auto hover:text-indigo-900 transition-colors"
                onClick={() => navigate('/organizer-events')}
              >
                Voltar para eventos
              </button>
            </div>

            <div className="flex flex-col px-3 mt-3 w-full text-indigo-950 dark:text-white">
              {/* Event Card */}
              <div className="flex flex-col items-start px-7 py-7 w-full bg-white dark:bg-[#242424] rounded-xl min-h-[218px] shadow-[4px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="max-w-full w-[159px]">
                  <div className="text-xl font-semibold dark:text-white">
                    {nameLocal}
                  </div>
                  <div className="flex gap-2.5 items-center mt-7 w-full text-xs">
                    <div className="self-stretch my-auto">
                      {formatEventDate(dateLocal)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-10 items-center mt-8 text-sm font-semibold whitespace-nowrap">
                  <div className="self-stretch my-auto rounded-[100px] w-[137px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          ref={publishBtnRef}
                          onMouseEnter={() => {
                            // show tooltip if disabled
                            if ((ticketCount ?? 0) === 0) {
                              const r = publishBtnRef.current?.getBoundingClientRect();
                              if (r) setPublishTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
                              setShowPublishTooltip(true);
                            }
                          }}
                          onMouseLeave={() => setShowPublishTooltip(false)}
                          className="relative flex items-center justify-between px-5 py-3 border border-stone-300 rounded-full bg-white dark:bg-[#242424] text-sm font-semibold text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500 transition-all w-[137px]"
                        >
                          <span>{statusLocal}</span>
                          <ChevronDown className="w-5 h-5 text-indigo-700 dark:text-white ml-2" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                        {statusLocal === 'Publicado' ? (
                          <DropdownMenuItem onSelect={async () => {
                            // always attempt internal API update to ensure persistence
                            try { if (onStatusChange) onStatusChange('Rascunho'); } catch (e) { }
                            const ok = await internalChangeStatus('Rascunho');
                            if (ok) setStatusLocal('Rascunho');
                          }}>Despublicar evento</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className={(ticketCount ?? 0) === 0 ? 'opacity-60 cursor-not-allowed' : ''}
                            onSelect={async () => {
                              // prevent publishing if there are no tickets
                              if ((ticketCount ?? 0) === 0) {
                                setShowPublishTooltip(true);
                                return;
                              }
                              try { if (onStatusChange) onStatusChange('Publicado'); } catch (e) { }
                              const ok = await internalChangeStatus('Publicado');
                              if (ok) setStatusLocal('Publicado');
                            }}
                          >Publicar evento</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button
                    onClick={async () => {
                      // open public event path in a new tab using slug when available
                      try {
                        if (!eventId) return;
                        // try to fetch event to get slug
                        let slug: string | undefined;
                        try {
                          const r = await fetchApi(`/api/event/${eventId}`);
                          if (r.ok) {
                            const ev = await r.json().catch(() => null);
                            if (ev && ev.slug) slug = ev.slug;
                          }
                        } catch (e) {
                          // ignore fetch error and fallback to id
                        }
                        const path = getEventPath({ id: String(eventId) as any, slug: slug ?? undefined } as any);
                        const origin = window.location.origin || '';
                        window.open(origin + path, '_blank', 'noopener,noreferrer');
                      } catch (e) { /* ignore */ }
                    }}
                    className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px] hover:opacity-70 transition-opacity"
                    title="Ver evento"
                  >
                    <ExternalLink className="w-[18px] h-[18px] text-orange-600" />
                  </button>
                </div>
              </div>

              {/* Steps Label */}
              <div className="self-start mt-11 ml-3.5 text-xs font-semibold">
                Etapas
              </div>
            </div>

            {/* Steps */}
            <div className="mt-2.5">
              {displaySteps.map((step, index) => {
                const isActive = step.id === currentStepId;
                // Regras: se não há eventId, desabilita 'configure-ticket' e 'publish'
                // Além disso, bloqueia o passo 'publish' quando não houver ingressos
                const isDisabled = (!eventId && (step.id === 'configure-ticket' || step.id === 'publish')) || (step.id === 'publish' && (ticketCount ?? 0) === 0);
                const isCompleted = step.status === 'completed';
                return (
                  <div
                    key={step.id}
                    className={
                      `flex flex-col justify-center items-start px-6 py-7 w-full min-h-[70px] transition ` +
                      (isDisabled ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-[#0b0b0b]' : (isActive ? 'cursor-pointer bg-white dark:bg-[#242424]' : 'cursor-pointer bg-gray-50 dark:bg-[#0b0b0b] hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]'))
                    }
                    onClick={() => handleStepClick(step.id, isDisabled)}
                    onMouseEnter={(e) => {
                      if (step.id === 'publish' && (ticketCount ?? 0) === 0) {
                        const el = e.currentTarget as HTMLElement;
                        const r = el.getBoundingClientRect();
                        setPublishTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
                        setShowPublishTooltip(true);
                      }
                    }}
                    onMouseLeave={() => { if (step.id === 'publish') setShowPublishTooltip(false); }}
                    tabIndex={0}
                    role={isDisabled ? undefined : "button"}
                  >
                    <div className="flex gap-2 items-center">
                      {/* Círculo do step */}
                      <div className={
                        `flex items-center justify-center rounded-full border h-[16px] w-[16px] transition-all ` +
                        (isCompleted ? 'border-indigo-700 bg-white dark:bg-[#64CB9E]/20 text-indigo-700 dark:text-[#64CB9E] dark:border-[#64CB9E]' : (isActive ? 'border-indigo-700 bg-white dark:bg-[#242424]' : 'border-indigo-700 bg-white dark:bg-[#242424]'))
                      }>
                        {isCompleted ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isActive ? (
                          <div className="bg-indigo-700 rounded-full h-[10px] w-[10px]" />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={
                          `self-stretch my-auto text-sm font-semibold transition-colors ` +
                          (isCompleted ? 'text-indigo-700 dark:text-white' : (isActive ? 'text-indigo-700 dark:text-white' : (isDisabled ? 'text-indigo-950/60 dark:text-slate-400' : 'text-indigo-950 dark:text-slate-300')))
                        }>
                          {step.title}
                        </div>
                        {step.id === 'configure-ticket' && ticketCount !== null && (
                          <span className="inline-flex items-center justify-center text-[11px] font-bold px-2 py-[2px] rounded-full bg-indigo-100 text-indigo-700 select-none">
                            {ticketCount}
                          </span>
                        )}
                      </div>
                    </div>
                    {step.description && step.id === currentStepId && (
                      <div className={`mt-2 text-xs w-[220px] text-indigo-700 dark:text-slate-300`}>
                        {step.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="shrink-0 w-full h-px border border-solid border-indigo-950 border-opacity-10" />

            {/* Menu: only visible when published */}
            {showEventMenus && (
              <div className="-mb-6 w-full text-sm font-semibold text-indigo-950 dark:text-white">
                {menuItems.map((item, index) => {
                  const IconComp = item.icon;
                  const active = (item.title === 'Painel' && isPanelActive) || (item.title === 'Gerenciar equipe' && isOnEquipe) || (item.title === 'Analytics' && isOnAnalytics);
                  const isPanelItem = item.title === 'Painel';
                  const isAnalytics = item.title === 'Analytics';
                  const isMarketing = item.title === 'Marketing';
                  const isSatisfaction = item.title === 'Pesquisa de satisfação';
                  const isEquipe = item.title === 'Gerenciar equipe';
                  return (
                    <div key={index}>
                      {item.hasSubmenu ? (
                        <div>
                          <div
                            className={`flex gap-10 justify-between items-center p-6 w-full whitespace-nowrap min-h-[65px] ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'bg-gray-50 dark:bg-[#0b0b0b]'} cursor-pointer`}
                            onClick={() => handleMenuClick(item.title)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="self-stretch my-auto flex items-center gap-3">
                              {IconComp && <IconComp className="w-4 h-4" />}
                              <span>{item.title}</span>
                            </div>
                            <ChevronDown className={`object-contain shrink-0 self-stretch my-auto w-5 h-5 transition-transform ${expandedMenu === item.title ? 'rotate-180' : ''}`} />
                          </div>
                          {/* Submenu items (only for Marketing right now) */}
                          {expandedMenu === item.title && isMarketing && (
                            <div className="bg-white dark:bg-[#242424] border-t border-gray-100 dark:border-[#1F1F1F]">
                              {(() => {
                                const linkActive = location.pathname.startsWith('/marketing/link-rastreamento');
                                const pixelsActive = location.pathname.startsWith('/marketing/pixels');
                                const ambassadorsActive = location.pathname.startsWith('/marketing/embaixadores');
                                return (
                                  <>
                                    <div
                                      className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${linkActive ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                      onClick={() => navigate(eventId ? `/marketing/link-rastreamento/${eventId}` : '/marketing/link-rastreamento')}
                                    >
                                      Link de rastreamento
                                    </div>
                                    <div
                                      className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${pixelsActive ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                      onClick={() => navigate(eventId ? `/marketing/pixels/${eventId}` : '/marketing/pixels')}
                                    >
                                      Pixels de rastreamento
                                    </div>
                                    <div
                                      className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center${ambassadorsActive ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                      onClick={() => navigate(eventId ? `/marketing/embaixadores/${eventId}` : '/marketing/embaixadores')}
                                    >
                                      Embaixadores
                                    </div>
                                    <div
                                      className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${location.pathname.startsWith('/marketing/cupons') ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                      onClick={() => navigate(eventId ? `/marketing/cupons/${eventId}` : '/marketing/cupons')}
                                    >
                                      Cupons de desconto
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {/* Submenu items for Participantes */}
                          {expandedMenu === item.title && item.title === 'Participantes' && (
                            <div className="bg-white dark:bg-[#242424] border-t border-gray-100 dark:border-[#1F1F1F]">
                              <div
                                className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${location.pathname.includes('/ingressos-emitidos') ? ' bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : ' hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                onClick={() => navigate(eventId ? `/ingressos-emitidos/${eventId}` : '/participantes/pedidos')}
                              >
                                Ingressos Emitidos
                              </div>
                              <div
                                className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${location.pathname.startsWith('/participantes/pedidos') ? ' bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : ' hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                onClick={() => navigate(eventId ? `/participantes/pedidos/${eventId}` : '/participantes/pedidos')}
                              >
                                Gerenciar pedidos
                              </div>
                              <div
                                className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${location.pathname.startsWith('/participantes/lista') ? ' bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : ' hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                onClick={() => navigate(eventId ? `/participantes/lista/${eventId}` : '/participantes/lista')}
                              >
                                Lista de Convidados
                              </div>
                              <div
                                className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${location.pathname.startsWith('/participantes/checkin') ? ' bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : ' hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-[#1F1F1F] dark:hover:text-white'}`}
                                onClick={() => navigate(eventId ? `/participantes/checkin/${eventId}` : '/participantes/checkin')}
                              >
                                Check-in
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`flex gap-2.5 items-center p-6 w-full min-h-[65px] transition-colors ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1F1F1F] dark:text-white' : 'bg-gray-50 dark:bg-[#0b0b0b]'} ${isPanelItem ? (eventId ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]' : 'opacity-60 cursor-not-allowed') : ''} ${isAnalytics ? (eventId ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]' : 'opacity-60 cursor-not-allowed') : ''} ${isEquipe ? (eventId ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]' : 'opacity-60 cursor-not-allowed') : ''} ${isSatisfaction ? (eventId ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]' : 'opacity-60 cursor-not-allowed') : ''}`}
                          onClick={() => {
                            console.log('[EventSidebar] Clicked:', item.title, 'eventId:', eventId, 'isAnalytics:', isAnalytics);
                            if (isPanelItem && eventId) navigate(panelRoute);
                            else if (isAnalytics && eventId) navigate(`/painel-evento/${eventId}/analytics`);
                            else if (isEquipe && eventId) navigate(`/gerenciar-equipe/${eventId}`);
                            else if (isSatisfaction && eventId) navigate(`/pesquisa-satisfacao/${eventId}`);
                          }}
                          role={(isPanelItem && eventId) || (isAnalytics && eventId) || (isEquipe && eventId) ? 'button' : undefined}
                          tabIndex={(isPanelItem && eventId) || (isAnalytics && eventId) || (isEquipe && eventId) ? 0 : -1}
                        >
                          <div className="self-stretch my-auto flex items-center gap-3">
                            {IconComp && <IconComp className="w-4 h-4" />}
                            <span>{item.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Floating tooltip rendered via portal when publish is disabled */}
            {showPublishTooltip && publishTooltipPos && createPortal(
              <div
                role="tooltip"
                style={{ position: 'fixed', left: publishTooltipPos.left, top: publishTooltipPos.top, transform: 'translate(-50%, -100%)' }}
                className="z-50 max-w-[320px] w-[260px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
              >
                Você precisa criar ao menos 1 ingresso antes de publicar o evento.
              </div>,
              document.body
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailsSidebar;


