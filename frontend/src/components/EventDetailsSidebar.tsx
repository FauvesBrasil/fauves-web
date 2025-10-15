import React from "react";
import { useRegisterSidebar } from '@/context/LayoutOffsetsContext';
import { fetchApi } from "@/lib/apiBase";
import { useLocation } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { getEventPath } from '@/lib/eventUrl';
import { ChevronLeft, ChevronDown, ExternalLink } from "lucide-react";
import './event-sidebar-scrollbar.css';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "active" | "inactive";
  link?: string;
}

interface MenuItem {
  title: string;
  hasSubmenu?: boolean;
}

interface EventDetailsSidebarProps {
  eventName?: string;
  eventDate?: string;
  eventStatus?: "Rascunho" | "Publicado";
  steps?: Step[];
  menuItems?: MenuItem[];
  onBack?: () => void;
  onStatusChange?: (status: "Rascunho" | "Publicado") => void;
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
  { title: "Painel" },
  { title: "Marketing", hasSubmenu: true },
  { title: "Gerenciar participantes", hasSubmenu: true },
  { title: "Gerenciar equipe" },
  { title: "Relatórios", hasSubmenu: true }
];

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
  fixedTop = 0
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

  // Paths base de cada etapa (sem query string) para detectar etapa ativa
  const stepPaths: Record<string, string> = {
    "create-page": "/create-event",
    "configure-ticket": "/create-tickets",
    "publish": "/publish-details",
  };
  // Rotas completas para navegação (anexando eventId quando disponível)
  const stepRoutes: Record<string, string> = {
    // when we already have an eventId, take the user to the public event page
    "create-page": eventId ? getEventPath({ id: String(eventId) }) : "/create-event",
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

  // Compute dynamic step statuses to show checkmarks when completed
  const [ticketCount, setTicketCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    const run = async () => {
      if (!eventId) { setTicketCount(null); return; }
      try {
  const res = await fetchApi(`/api/ticket-type/event/${eventId}/count`);
        if (!res.ok) return;
        const data = await res.json();
        setTicketCount(typeof data.count === 'number' ? data.count : 0);
      } catch (_) { /* ignore */ }
    };
    run();
  }, [eventId]);

  const displaySteps: Step[] = React.useMemo(() => {
    const isOnCreate = location.pathname.startsWith('/create-event');
    const isOnTickets = location.pathname.startsWith('/create-tickets');
    const isOnPublish = location.pathname.startsWith('/publish-details');

    // Completed logic independent of current route (editing keeps check)
    const isCreateCompleted = !!eventId; // criou evento => ok
    const isTicketsCompleted = !!eventId && (ticketCount ?? 0) > 0; // tem ao menos 1 ingresso => ok
    const isPublishCompleted = eventStatus === 'Publicado';

    const createStatus: Step['status'] = isCreateCompleted ? 'completed' : (isOnCreate ? 'active' : 'inactive');
    const ticketsStatus: Step['status'] = isTicketsCompleted ? 'completed' : (!eventId ? 'inactive' : (isOnTickets ? 'active' : 'inactive'));
    const publishStatus: Step['status'] = isPublishCompleted ? 'completed' : (isOnPublish ? 'active' : (!eventId ? 'inactive' : 'inactive'));

    return [
      {
        id: 'create-page',
        title: 'Criar página do evento',
        description: 'Adicionar todos os detalhes do seu evento e comunicar aos participantes o que esperar',
        status: createStatus,
      },
      {
        id: 'configure-ticket',
        title: 'Configurar ingresso',
        description: 'Usar nossas sugestões para ajudar a vender mais ingressos ou criar manualmente o seu próprio',
        status: ticketsStatus,
      },
      {
        id: 'publish',
        title: 'Publicar',
        description: 'Revisar a página e as configurações do seu evento e publicá-lo',
        status: publishStatus,
      },
    ];
  }, [eventId, ticketCount, location.pathname, eventStatus]);

  // Show event menus only if we have a valid eventId
  const showEventMenus = !!eventId;
  // Consider "Painel" active when not on the create/publish/tickets routes
  const isOnCreate = location.pathname.startsWith('/create-event');
  const isOnTickets = location.pathname.startsWith('/create-tickets');
  const isOnPublish = location.pathname.startsWith('/publish-details');
  const isOnMarketing = location.pathname.startsWith('/marketing');
  // Panel is active when we're not on the create/tickets/publish flows and not on marketing pages
  const isOnParticipants = location.pathname.startsWith('/participantes/pedidos') || location.pathname.startsWith('/participantes/lista') || location.pathname.startsWith('/participantes/checkin');
  const isOnEquipe = location.pathname.startsWith('/gerenciar-equipe');
  const isPanelActive = !(isOnCreate || isOnTickets || isOnPublish || isOnMarketing || isOnParticipants || isOnEquipe);
  // Always route 'Painel' to painel-evento when we have an eventId
  const panelRoute = React.useMemo(() => {
    if (eventId) return `/painel-evento/${eventId}`;
    return panelRouteProp || location.pathname;
  }, [panelRouteProp, location.pathname, eventId]);

  // Format the event date string into a localized pt-BR short weekday + day + short month + year, then time.
  // Examples handled: "2025-11-22 às 10:00", "2025-11-22 10:00", or any parseable date string.
  // Normalize event date/time display across the app to: "DD MMM YYYY às HH:MM" (e.g. "15 jan 2025 às 18:30").
  const formatEventDate = (input?: string) => {
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
  };

  // Submenu state (which top-level menu is expanded)
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);

  // Auto-expand Marketing submenu when current route is a marketing page
  React.useEffect(() => {
    try {
      if (location.pathname.startsWith('/marketing')) {
        setExpandedMenu('Marketing');
      } else if (
        location.pathname.startsWith('/participantes/pedidos') ||
        location.pathname.startsWith('/participantes/lista') ||
        location.pathname.startsWith('/participantes/checkin')
      ) {
        setExpandedMenu('Gerenciar participantes');
      } else if (location.pathname.startsWith('/gerenciar-equipe')) {
        setExpandedMenu(null);
      }
    } catch (e) {
      // ignore
    }
  }, [location.pathname]);

  const handleMenuClick = (itemTitle: string) => {
    // Toggle expand only for items that have submenus
    if (!itemTitle) return;
    setExpandedMenu(prev => prev === itemTitle ? null : itemTitle);
  };

  // Trigger confetti when eventStatus transitions to 'Publicado'
  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = eventStatus;
    if (prev === 'Publicado') return; // already published before
    if (eventStatus !== 'Publicado') return;

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
  }, [eventStatus]);
  return (
  <div
    ref={containerRef}
    className="rounded-none overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent event-sidebar-scrollbar"
    style={fixed ? { position: 'fixed', top: fixedTop, left: fixedLeft, width: fixedWidth, height: '100vh', zIndex: 30 } : { height: '100vh', maxWidth: 280 }}
    data-sidebar-detail={fixed ? 'true' : undefined}
  >
      <div className="pb-32 w-full bg-gray-50 border-r border-gray-100">
        {/* Header */}
        <div className="flex gap-4 items-center px-3.5 py-4 text-sm text-indigo-700 bg-gray-50 border-b border-neutral-300 min-h-[59px]">
          <div className="object-contain shrink-0 self-stretch my-auto aspect-[0.56] w-[5px]">
            <ChevronLeft className="w-[13px]" />
          </div>
          <button 
            className="self-stretch my-auto hover:text-indigo-900 transition-colors"
            onClick={() => navigate('/organizer-events')}
          >
            Voltar para eventos
          </button>
        </div>

        <div className="flex flex-col px-3 mt-3 w-full text-indigo-950">
          {/* Event Card */}
          <div className="flex flex-col items-start px-7 py-7 w-full bg-white rounded-xl min-h-[218px] shadow-[4px_4px_10px_rgba(0,0,0,0.05)]">
            <div className="max-w-full w-[159px]">
              <div className="text-xl font-semibold">
                {eventName}
              </div>
              <div className="flex gap-2.5 items-center mt-7 w-full text-xs">
                <div className="self-stretch my-auto">
                  {formatEventDate(eventDate)}
                </div>
              </div>
            </div>
            <div className="flex gap-10 items-center mt-8 text-sm font-semibold whitespace-nowrap">
              <div className="self-stretch my-auto rounded-[100px] w-[137px]">
                <div className="relative flex items-center px-0 py-0 min-h-[42px]">
                  <select
                    value={eventStatus}
                    onChange={(e) => onStatusChange?.(e.target.value as "Rascunho" | "Publicado")}
                    className="appearance-none pl-5 pr-10 py-3 border border-stone-300 rounded-full bg-white text-sm font-semibold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all w-[137px]"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Publicado">Publicado</option>
                  </select>
                  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 flex items-center">
                    <ChevronDown className="w-4 h-4 text-indigo-700" />
                  </span>
                </div>
              </div>
              <button 
                onClick={onViewEvent}
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
            const isDisabled = !eventId && (step.id === 'configure-ticket' || step.id === 'publish');
            const isCompleted = step.status === 'completed';
            return (
              <div
                key={step.id}
                className={
                  `flex flex-col justify-center items-start px-6 py-7 w-full min-h-[70px] transition ` +
                  (isDisabled ? 'cursor-not-allowed opacity-60 bg-gray-50' : (isActive ? 'cursor-pointer bg-white' : 'cursor-pointer bg-gray-50 hover:bg-indigo-50'))
                }
                onClick={() => handleStepClick(step.id, isDisabled)}
                tabIndex={0}
                role={isDisabled ? undefined : "button"}
              >
                <div className="flex gap-2 items-center">
                  {/* Círculo do step */}
                  <div className={
                    `flex items-center justify-center rounded-full border h-[16px] w-[16px] transition-all ` +
                    (isCompleted ? 'border-indigo-700 bg-white' : (isActive ? 'border-indigo-700 bg-white' : 'border-indigo-700 bg-white'))
                  }>
                    {isCompleted ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#2A2AD7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isActive ? (
                      <div className="bg-indigo-700 rounded-full h-[10px] w-[10px]" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={
                      `self-stretch my-auto text-sm font-semibold transition-colors ` +
                      (isCompleted ? 'text-indigo-700' : (isActive ? 'text-indigo-700' : (isDisabled ? 'text-indigo-950/60' : 'text-indigo-950')))
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
                  <div className={`mt-2 text-xs w-[220px] text-indigo-700`}>
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
          <div className="-mb-6 w-full text-sm font-semibold text-indigo-950">
            {menuItems.map((item, index) => {
              const active = (item.title === 'Painel' && isPanelActive) || (item.title === 'Gerenciar equipe' && isOnEquipe);
              const isPanelItem = item.title === 'Painel';
              const isMarketing = item.title === 'Marketing';
              const isEquipe = item.title === 'Gerenciar equipe';
              return (
                <div key={index}>
                  {item.hasSubmenu ? (
                    <div>
                      <div
                        className={`flex gap-10 justify-between items-center p-6 w-full whitespace-nowrap min-h-[65px] ${active ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50'} cursor-pointer`}
                        onClick={() => handleMenuClick(item.title)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="self-stretch my-auto">{item.title}</div>
                        <ChevronDown className={`object-contain shrink-0 self-stretch my-auto w-2 aspect-[1.6] transition-transform ${expandedMenu === item.title ? 'rotate-180' : ''}`} />
                      </div>
                      {/* Submenu items (only for Marketing right now) */}
                      {expandedMenu === item.title && isMarketing && (
                        <div className="bg-white border-t border-gray-100">
                          {(() => {
                            const linkActive = location.pathname.startsWith('/marketing/link-rastreamento');
                            const pixelsActive = location.pathname.startsWith('/marketing/pixels');
                            return (
                              <>
                                <div
                                  className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${linkActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-indigo-50'}`}
                                  onClick={() => navigate(eventId ? `/marketing/link-rastreamento/${eventId}` : '/marketing/link-rastreamento')}
                                >
                                  Link de rastreamento
                                </div>
                                <div
                                  className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center ${pixelsActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-indigo-50'}`}
                                  onClick={() => navigate(eventId ? `/marketing/pixels/${eventId}` : '/marketing/pixels')}
                                >
                                  Pixels de rastreamento
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {/* Submenu items for Gerenciar participantes */}
                      {expandedMenu === item.title && item.title === 'Gerenciar participantes' && (
                        <div className="bg-white border-t border-gray-100">
                          <div
                            className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center${location.pathname.startsWith('/participantes/pedidos') ? ' bg-indigo-50 text-indigo-700' : ' hover:bg-indigo-50'}`}
                            onClick={() => navigate(eventId ? `/participantes/pedidos/${eventId}` : '/participantes/pedidos')}
                          >
                            Gerenciar pedidos
                          </div>
                          <div
                            className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center${location.pathname.startsWith('/participantes/lista') ? ' bg-indigo-50 text-indigo-700' : ' hover:bg-indigo-50'}`}
                            onClick={() => navigate(eventId ? `/participantes/lista/${eventId}` : '/participantes/lista')}
                          >
                            Lista de Participantes
                          </div>
                          <div
                            className={`pl-8 pr-6 py-6 min-h-[65px] cursor-pointer flex items-center${location.pathname.startsWith('/participantes/checkin') ? ' bg-indigo-50 text-indigo-700' : ' hover:bg-indigo-50'}`}
                            onClick={() => navigate(eventId ? `/participantes/checkin/${eventId}` : '/participantes/checkin')}
                          >
                            Check-in
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`flex gap-2.5 items-center p-6 w-full min-h-[65px] transition-colors ${active ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50'} ${isPanelItem ? (eventId ? 'cursor-pointer hover:bg-indigo-100' : 'opacity-60 cursor-not-allowed') : ''} ${isEquipe ? (eventId ? 'cursor-pointer hover:bg-indigo-100' : 'opacity-60 cursor-not-allowed') : ''}`}
                      onClick={
                        isPanelItem ? (eventId ? () => navigate(panelRoute) : undefined)
                        : isEquipe ? (eventId ? () => navigate(`/gerenciar-equipe/${eventId}`) : undefined)
                        : undefined
                      }
                      role={(isPanelItem && eventId) || (isEquipe && eventId) ? 'button' : undefined}
                      tabIndex={(isPanelItem && eventId) || (isEquipe && eventId) ? 0 : -1}
                    >
                      <div className="self-stretch my-auto">{item.title}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailsSidebar;
