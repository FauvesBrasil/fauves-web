import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  ArrowRightLeft,
  Printer,
  X,
  ChevronLeft,
  Info,
  Loader2,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowRight,
  Users,
  Check,
  Sparkles
} from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import { EventSidePanel } from '@/components/v2/EventSidePanel';
import FooterV2 from '@/components/v2/FooterV2';
import { useAuth } from '@/context/AuthContext';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import QRCode from 'qrcode';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const getGuestAvatars = (eventId: string) => {
  const images = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&fit=crop',
  ];

  const charCodeSum = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const guestCount = 3 + (charCodeSum % 3); // 3 a 5 convidados
  const selected = [];
  for (let i = 0; i < guestCount; i++) {
    selected.push(images[(charCodeSum + i) % images.length]);
  }

  const remaining = 24 + (charCodeSum % 140);

  return { selected, remaining };
};

const StickyDatePill = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [isStuck, setIsStuck] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setIsStuck(e.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-11px 0px 0px 0px' }
    );
    const current = ref.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div ref={ref} className={`${className} ${isStuck ? 'stuck' : ''}`}>
      {children}
    </div>
  );
};

const Events = () => {
  const { isDark } = useTheme();
  const textColor = isDark ? '#ffffff' : '#131517';
  const mutedTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(19, 21, 23, 0.4)';
  const iconStrokeColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(19, 21, 23, 0.35)';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Side Panel details state
  const [selectedPanelEvent, setSelectedPanelEvent] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch full event details when an event is selected to get 'isExternal' and other detailed fields
  useEffect(() => {
    if (!selectedPanelEvent?.id) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const r = await fetch(apiUrl(`/api/event/${selectedPanelEvent.id}`));
        if (r.ok) {
          const fullData = await r.json();
          if (isMounted) {
            setSelectedPanelEvent(prev => {
              if (!prev) return prev;
              const fullId = fullData.id || fullData._id;
              if (prev.id !== fullId) return prev;

              const place = fullData.locationName || fullData.venue || (fullData.location && fullData.location.split(',')[0]) || '';
              const city = fullData.locationCity || fullData.locationDetails?.city || fullData.city || '';
              const uf = fullData.locationUf || fullData.locationDetails?.uf || fullData.uf || '';

              let displayLocation = prev.location;
              if (place && city && uf) displayLocation = `${place}, ${city} - ${uf}`;
              else if (place && city) displayLocation = `${place}, ${city}`;
              else if (city && uf) displayLocation = `${city} - ${uf}`;
              else if (place) displayLocation = place;

              const bestDescription = fullData.descriptionHtml || fullData.description || fullData.content || fullData.about || fullData.info || fullData.details || prev.description;

              return {
                ...prev,
                ...fullData,
                location: displayLocation,
                fullLocation: fullData.location || displayLocation,
                description: bestDescription,
                category: fullData.category || fullData.type || fullData.categoryName || prev.category,
                isExternal: !!(fullData.isExternal || fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || fullData.registrationType === 'external'),
                externalUrl: fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || ''
              };
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch event details", e);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [selectedPanelEvent?.id]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?redirect=/events');
  }, [authLoading, user, navigate]);

  // Sincroniza a largura máxima do header com o conteúdo abaixo
  useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '820px');
    return () => {
      document.documentElement.style.removeProperty('--page-max-width');
    };
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = user.id ? `userId=${user.id}` : `userEmail=${user.email}`;
      const [ticketsRes, eventsRes] = await Promise.all([
        fetchApi(`/api/my/tickets?${q}&include=event`),
        fetchApi(`/api/events/by-user?userId=${user.id}`)
      ]);

      let ticketsData = [];
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        ticketsData = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
      }

      let eventsData = [];
      if (eventsRes.ok) {
        eventsData = await eventsRes.json();
      }

      setTickets(ticketsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (e) {
      console.error('Error loading events list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Combine and sort events & tickets chronologically
  const getCombinedTimeline = () => {
    const list: any[] = [];

    // 1. Add created/managed events
    events.forEach(e => {
      list.push({
        id: `organized-${e.id}`,
        eventId: e.id,
        name: e.name,
        startDate: e.startDate,
        image: resolveImageUrl(e.image || e.bannerUrl) || '',
        venue: e.venue || 'Local não definido',
        location: e.location || '',
        organizerName: e.organizationName || 'Minha Organização',
        type: 'organized',
        originalEvent: e
      });
    });

    // 2. Add purchased tickets/events
    tickets.forEach(t => {
      const e = t.event;
      list.push({
        id: `purchased-${t.id}`,
        eventId: t.eventId,
        name: t.eventName || e?.name || 'Evento',
        startDate: t.eventStartDate || e?.startDate,
        image: resolveImageUrl(t.eventBannerUrl || e?.image || e?.bannerUrl) || '',
        venue: t.eventVenue || e?.venue || 'Local não definido',
        location: t.eventLocation || e?.location || '',
        organizerName: e?.organizationName || 'Organizador',
        type: 'purchased',
        ticket: t
      });
    });

    // Filter by upcoming vs past
    const now = new Date();
    const filtered = list.filter(item => {
      const date = item.startDate ? new Date(item.startDate) : null;
      if (!date) return false;
      if (timeFilter === 'upcoming') {
        return date >= now;
      } else {
        return date < now;
      }
    });

    // Sort chronologically
    return filtered.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeFilter === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  };

  const combinedTimeline = getCombinedTimeline();

  // Group grouped items by day
  const groupTimelineByDay = (list: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    list.forEach(item => {
      if (!item.startDate) return;
      const d = new Date(item.startDate);
      const dateKey = d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    return grouped;
  };

  const groupedTimeline = groupTimelineByDay(combinedTimeline);

  const toPanelEvent = (item: any) => ({
    ...(item.originalEvent || item.ticket?.event || {}),
    id: item.eventId,
    name: item.name,
    startDate: item.startDate,
    image: item.image,
    venue: item.venue,
    location: item.location,
  });
  const selectedPanelIndex = selectedPanelEvent
    ? combinedTimeline.findIndex((item) => item.eventId === selectedPanelEvent.id)
    : -1;
  const openPanelAtIndex = (index: number) => {
    const item = combinedTimeline[index];
    if (!item) return;
    setSelectedPanelEvent(toPanelEvent(item));
    setIsPanelOpen(true);
  };

  // --- Ticket Modal (Premium V2 Style) ---
  const TicketModal = ({ ticket, onClose }: { ticket: any; onClose: () => void }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
      return acquireDocumentScrollLock();
    }, []);

    useEffect(() => {
      const gen = () => {
        QRCode.toDataURL(JSON.stringify({ c: ticket.code, ts: Date.now() }), { margin: 1, width: 600 })
          .then(setQrDataUrl);
      };
      gen();
      const interval = setInterval(() => { gen(); setRefreshKey(k => k + 1); }, 30000);
      return () => clearInterval(interval);
    }, [ticket.code]);

    const handleTransfer = async () => {
      if (!transferEmail.includes('@')) return;
      setTransferLoading(true);
      try {
        const res = await fetchApi('/api/ticket/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, targetEmail: transferEmail }),
        });
        if (res.ok) {
          toast({ title: 'Sucesso!', description: 'Ingresso transferido com sucesso.' });
          onClose();
          loadData();
        } else {
          toast({ title: 'Erro', description: 'Não foi possível transferir.', variant: 'destructive' });
        }
      } finally { setTransferLoading(false); }
    };

    const startDate = ticket.eventStartDate ? new Date(ticket.eventStartDate) : null;
    const dateFormatted = startDate ? startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não informada';
    const timeFormatted = startDate ? startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h' : '—';
    const locationName = ticket.eventVenue || 'Local não definido';
    const locationAddress = ticket.eventLocation || '';

    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-[#131517]/40 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden"
        style={{ zIndex: 99999 }}
      >
        <div className="absolute inset-0" onClick={onClose} />

        <div className="w-full max-w-[400px] h-fit max-h-[92vh] bg-white dark:bg-neutral-900 rounded-[24px] shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-y-auto overflow-x-hidden relative flex flex-col animate-in zoom-in-95 duration-200" style={{ fontFamily: 'Inter, sans-serif', color: isDark ? '#ffffff' : 'inherit' }}>

          {/* Top Header Row overlaying close button */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
            {!showTransfer ? (
              <Badge className="bg-[#131517] hover:bg-[#131517] text-white border-none px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full">
                {ticket.ticketTypeName || 'Ingresso'}
              </Badge>
            ) : (
              <button
                onClick={() => setShowTransfer(false)}
                className="w-8 h-8 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-all shadow-sm border border-neutral-100 dark:border-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-100 border border-neutral-100 dark:border-neutral-700 shadow-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            {!showTransfer ? (
              <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                {/* Banner image */}
                <div className="relative h-44 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={resolveImageUrl(ticket.eventBannerUrl || ticket.event?.image || ticket.event?.bannerUrl) || ''}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-900 via-transparent to-black/10" />
                </div>

                {/* Body content */}
                <div className="px-6 pb-6 pt-5 flex-1 flex flex-col">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: isDark ? '#ffffff' : '#131517', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                    {ticket.eventName}
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mb-0.5">Data e Horário</p>
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                          {dateFormatted} <span className="text-neutral-500 dark:text-neutral-400 ml-1">• {timeFormatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mb-0.5">Localização</p>
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{locationName}</p>
                        {locationAddress && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{locationAddress}</p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationName} ${locationAddress}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-400 hover:text-neutral-900"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider design */}
                  <div className="relative mb-6 h-6 shrink-0 mx-[-24px]">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t border-dashed border-neutral-100 dark:border-neutral-800" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3.5 w-7 h-7 bg-[#f7f8f9] dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 rounded-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3.5 w-7 h-7 bg-[#f7f8f9] dark:bg-neutral-950 border-l border-neutral-100 dark:border-neutral-800 rounded-full" />
                  </div>

                  {/* QR Code and Actions */}
                  <div className="text-center mt-auto flex flex-col items-center">
                    <div className="relative inline-block mb-4 p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} className="w-40 h-40 dark:invert" key={refreshKey} alt="QR Code" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-300" /></div>
                      )}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-700 text-white text-[9px] font-semibold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                        Seguro • Recarrega automaticamente
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-500 uppercase tracking-widest mb-6">COD: {ticket.code}</p>

                    <div className="grid grid-cols-2 gap-2.5 w-full">
                      <button
                        onClick={() => setShowTransfer(true)}
                        className="flex items-center justify-center gap-2 h-11 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-100 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir
                      </button>
                      <button
                        onClick={() => {
                          const w = window.open('', '_blank');
                          if (w) {
                            w.document.write(`<html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>${ticket.eventName}</h2><p>${ticket.ticketTypeName}</p><img src="${qrDataUrl}" style="width: 80%" /><p>${ticket.code}</p></body></html>`);
                            w.print();
                          }
                        }}
                        className="flex items-center justify-center gap-2 h-11 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-100 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 pt-16 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mb-5">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>

                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">Transferir Ingresso</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  O ingresso deixará de aparecer em sua conta e será enviado instantaneamente para o e-mail informado.
                </p>

                <div className="space-y-5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider ml-1">E-mail do destinatário</label>
                    <input
                      type="email"
                      placeholder="exemplo@amigo.com"
                      value={transferEmail}
                      onChange={e => setTransferEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-200 outline-none font-semibold text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-300 transition-all"
                    />
                  </div>

                  <Card className="p-4 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl">
                    <div className="flex gap-2.5">
                      <Info className="w-4.5 h-4.5 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed text-left">
                        Atenção: esta ação é irreversível. Certifique-se de que o e-mail inserido está correto antes de enviar.
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="mt-auto pt-8 flex flex-col gap-2.5">
                  <button
                    onClick={handleTransfer}
                    disabled={transferLoading || !transferEmail.includes('@')}
                    className="h-11 w-full bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {transferLoading && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar Envio
                  </button>
                  <button
                    onClick={() => setShowTransfer(false)}
                    className="h-10 w-full text-xs font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Cancelar e voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`theme-root ${isDark ? 'dark dark-mode' : 'light'} events-page-v3`} style={{ background: isDark ? 'hsl(var(--background))' : '#f7f8f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderV2 transparent={true} fixed={true} />

      <main className="zm-container px-4" data-header-align style={{
        maxWidth: '820px',
        margin: '0 auto',
        paddingTop: 'var(--page-top-spacing)',
        paddingBottom: '6rem',
        flex: 1,
        width: '100%'
      }}>

        {/* Page Title & Toggle */}
        <div className="events-page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            color: textColor,
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, sans-serif',
            margin: 0
          }}>
            Eventos
          </h1>

          {/* Round V2 Tab Period Switcher */}
          <div className="lux-button-switcher always" style={{ minWidth: 'auto', maxWidth: 'auto', '--option-length': 2 } as React.CSSProperties}>
            <div className="segments">
              <button
                type="button"
                onClick={() => setTimeFilter('upcoming')}
                className={`btn segment flex-center animated nodivider ${timeFilter === 'upcoming' ? 'selected' : ''}`}
              >
                <div>Próximos</div>
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('past')}
                className={`btn segment flex-center animated nodivider ${timeFilter === 'past' ? 'selected' : ''}`}
              >
                <div>Passado</div>
              </button>
              <div
                className="slider animated"
                style={{ left: `calc(100% / 2 * ${timeFilter === 'upcoming' ? 0 : 1})` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Loading State */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '2rem', animation: 'pulse 1.5s infinite linear' }}>
                <div style={{ width: '5.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ height: '12px', bg: 'rgba(19, 21, 23, 0.04)', background: isDark ? 'rgba(255,255,255,0.08)' : '#ebeced', borderRadius: '4px', width: '40px' }} />
                  <div style={{ height: '24px', bg: 'rgba(19, 21, 23, 0.04)', background: isDark ? 'rgba(255,255,255,0.08)' : '#ebeced', borderRadius: '6px', width: '60px' }} />
                </div>
                <div style={{ flex: 1, height: '96px', background: isDark ? 'hsl(var(--card))' : '#fff', borderRadius: '1rem', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(19, 21, 23, 0.04)' }} />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedTimeline).length === 0 ? (
          <div style={{
            background: isDark ? 'hsl(var(--card))' : '#fff',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px dashed rgba(19, 21, 23, 0.1)',
            maxWidth: '520px',
            margin: '2rem auto'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(19, 21, 23, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: mutedTextColor
            }}>
              <Calendar className="w-5 h-5" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: textColor, marginBottom: '0.5rem' }}>
              {timeFilter === 'upcoming' ? "Nenhum evento futuro" : "Nenhum evento passado"}
            </h3>
            <p style={{
              fontSize: '1rem',
              color: mutedTextColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              justifyContent: 'center',
              margin: 0
            }}>
              {timeFilter === 'upcoming'
                ? "Você ainda não possui ingressos ou eventos que gerencia para as próximas datas."
                : "Não encontramos eventos passados registrados na sua conta."
              }
            </p>
            {timeFilter === 'upcoming' && (
              <button
                onClick={() => navigate('/discover')}
                style={{
                  background: isDark ? '#fff' : '#131517',
                  color: isDark ? '#131517' : '#fff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '1.5rem'
                }}
              >
                Explorar Eventos
              </button>
            )}
          </div>
        ) : (
          <div className="events-list">
            {(() => {
              const dateKeys = Object.keys(groupedTimeline).sort((a, b) => {
                const [dayA, monthA, yearA] = a.split('/').map(Number);
                const [dayB, monthB, yearB] = b.split('/').map(Number);
                const timeA = new Date(yearA, monthA - 1, dayA).getTime();
                const timeB = new Date(yearB, monthB - 1, dayB).getTime();
                return timeFilter === 'upcoming' ? timeA - timeB : timeB - timeA;
              });

              return dateKeys.map((dateKey) => {
                const groupItems = groupedTimeline[dateKey];
                const d = new Date(groupItems[0].startDate);

                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                const isToday = d.toDateString() === today.toDateString();
                const isTomorrow = d.toDateString() === tomorrow.toDateString();

                let groupName = '';
                if (isToday) {
                  groupName = 'Hoje';
                } else if (isTomorrow) {
                  groupName = 'Amanhã';
                } else {
                  const day = d.getDate();
                  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                  const month = monthNames[d.getMonth()];
                  groupName = `${day} de ${month}.`;
                }

                const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();

                return (
                  <div key={dateKey} className="events-group-row">

                    {/* Left Column: Date & Weekday (Left-aligned) */}
                    <div className="date-col">
                      <span className="date-main" style={{ color: textColor }}>{groupName}</span>
                      <span className="date-sub" style={{ color: mutedTextColor }}>{weekday}</span>
                    </div>

                    {/* Timeline Bullet Dot */}
                    <div className="timeline-dot" />

                    {/* Right Column: Cards for this Day */}
                    <div className="cards-col">
                      {groupItems.map((item) => {
                        const dateObj = new Date(item.startDate);
                        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div
                            key={item.id}
                            onClick={() => openPanelAtIndex(combinedTimeline.indexOf(item))}
                            className="event-card-v2"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(keyboardEvent) => {
                              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                                keyboardEvent.preventDefault();
                                openPanelAtIndex(combinedTimeline.indexOf(item));
                              }
                            }}
                          >
                            {/* Top Row: Info (Left) & Cover (Right) */}
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>

                              {/* Left Column: Text Info */}
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

                                {/* Time above the title */}
                                <div style={{
                                  fontSize: '0.9375rem',
                                  fontWeight: 500,
                                  color: mutedTextColor,
                                  textAlign: 'left'
                                }}>
                                  {timeStr}
                                </div>



                                {/* Title with Sparkle badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: isDark ? 'rgba(222,49,99,0.15)' : '#ffe4e6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Sparkles className="w-3 h-3 text-[#de3163]" style={{ fill: '#de3163' }} />
                                  </div>
                                  <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    color: textColor,
                                    margin: 0,
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.name}
                                  </h3>
                                </div>

                                {/* Location */}
                                <p style={{
                                  fontSize: '0.875rem',
                                  color: mutedTextColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <MapPin className="w-4 h-4 animate-none" style={{ strokeWidth: 1.5, color: iconStrokeColor }} />
                                  <span className="truncate">{item.venue}</span>
                                </p>

                                {/* Attendees */}
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: mutedTextColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    margin: 0
                                  }}>
                                    <Users className="w-4 h-4" style={{ strokeWidth: 1.5, color: iconStrokeColor }} />
                                    <span>{item.attendeesCount > 0 ? `${item.attendeesCount} ${item.attendeesCount === 1 ? 'convidado' : 'convidados'}` : 'Nenhum convidado'}</span>
                                  </p>
                              </div>

                              {/* Right Column: Cover Thumbnail */}
                              <div className="event-card-cover">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Calendar className="w-8 h-8 text-neutral-300" />
                                )}
                              </div>

                            </div>

                             {/* Bottom Row: Status Badge/Button if confirmed or managed */}
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '0.25rem' }}>
                               {item.type === 'organized' ? (
                                 <span 
                                   className="manage-event-btn v2-secondary-action"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     navigate(`/event/manage/${item.eventId}`);
                                   }}
                                 >
                                   Gerenciar Evento <ArrowRight />
                                 </span>
                               ) : (
                                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                   <span style={{
                                     display: 'inline-flex',
                                     alignItems: 'center',
                                     gap: '4px',
                                     background: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
                                     color: '#059669',
                                     fontSize: '0.75rem',
                                     fontWeight: 600,
                                     padding: '0.25rem 0.625rem',
                                     borderRadius: '100px',
                                     border: isDark ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid #d1fae5'
                                   }}>
                                     <Check className="w-3.5 h-3.5" style={{ strokeWidth: 2.5 }} /> Confirmado
                                   </span>
                                   <button
                                     className="manage-event-btn v2-secondary-action"
                                     style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '100px' }}
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedTicket(item.ticket);
                                     }}
                                   >
                                     Ver Ingresso
                                   </button>
                                 </div>
                               )}
                             </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              });
            })()}
          </div>
        )}

      </main>

      <FooterV2 maxWidth="790px" />

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Event Side Panel */}
      <EventSidePanel
        event={selectedPanelEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNext={() => openPanelAtIndex(selectedPanelIndex + 1)}
        onPrev={() => openPanelAtIndex(selectedPanelIndex - 1)}
        hasNext={selectedPanelIndex >= 0 && selectedPanelIndex < combinedTimeline.length - 1}
        hasPrev={selectedPanelIndex > 0}
      />

      {/* Styling specific to hover states */}
      <style>{`
        /* Luma/Lux Button Switcher V2 styles */
        .lux-button-switcher {
          --border-radius: 0.5rem;
          --segment-bg-color: rgba(19, 21, 23, 0.04);
          --segment-slider-bg-color: #fff;
          --segment-color: rgba(19, 21, 23, 0.45);
          --segment-selected-color: #131517;
          --small-segment-gap: 2px;
          --small-segment-padding: 0.375rem 1rem;
          --small-segment-font-size: 0.8125rem;
          --slider-border-radius: calc(var(--border-radius) - var(--small-segment-gap));

          border-radius: var(--border-radius);
          background-color: var(--segment-bg-color);
          padding: var(--small-segment-gap);
          overflow: hidden;
          position: relative;
          display: inline-block;
        }

        .lux-button-switcher .segments {
          grid-template-columns: repeat(var(--option-length), minmax(0, 1fr));
          display: grid;
          position: relative;
          width: auto;
        }

        .lux-button-switcher .segment {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: var(--small-segment-font-size);
          padding: var(--small-segment-padding);
          color: var(--segment-color);
          border-radius: 0;
          justify-content: center;
          align-items: center;
          display: flex;
          position: relative;
          z-index: 2;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lux-button-switcher .segment.selected {
          color: var(--segment-selected-color);
        }

        .lux-button-switcher .slider {
          pointer-events: none;
          background-color: var(--segment-slider-bg-color);
          width: calc(100% / var(--option-length));
          box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04);
          z-index: 1;
          height: 100%;
          position: absolute;
          top: 0;
          bottom: 0;
          border-radius: var(--slider-border-radius);
          transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-card-v2 {
          box-shadow: none !important;
          border: 1px solid rgba(19, 21, 23, 0.05) !important;
          background: #fff !important;
          transition: border-color 0.2s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.2s cubic-bezier(.4,0,.2,1) !important;
        }

        .event-card-v2:hover {
          border-color: rgba(19, 21, 23, 0.16) !important;
          box-shadow: 0px 28px 17px rgba(0,0,0,.004),
                      0px 12px 12px rgba(0,0,0,.01),
                      0px 3px 7px rgba(0,0,0,.01) !important;
        }

        .manage-event-btn {
          background: rgba(19, 21, 23, 0.04) !important;
          color: rgba(19, 21, 23, 0.64) !important;
          font-family: 'Inter', sans-serif !important;
          font-weight: 500 !important;
          font-size: 0.8125rem !important;
          padding: 0.3125rem 0.625rem !important;
          border-radius: 0.5rem !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.25rem !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
          text-decoration: none !important;
          border: 1px solid transparent !important;
        }
        .manage-event-btn:hover {
          background: rgba(19, 21, 23, 0.08) !important;
          color: rgba(19, 21, 23, 0.9) !important;
          border-color: rgba(19, 21, 23, 0.02) !important;
        }
        .manage-event-btn svg {
          width: 0.875rem !important;
          height: 0.875rem !important;
          stroke-width: 2 !important;
        }

        .organizer-avatar-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .organizer-avatar-container > div {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .organizer-avatar-container:hover > div {
          transform: scale(1.1) !important;
          filter: brightness(1.05) !important;
        }

        .organizer-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) scale(0.9);
          background: #131517;
          color: #fff;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 50;
        }
        .organizer-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: #131517 transparent transparent transparent;
        }
        .organizer-avatar-container:hover .organizer-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        /* Responsive Event Card V2 Styling */
        .event-card-v2 {
          box-shadow: none !important;
          border: 1px solid rgba(19, 21, 23, 0.05) !important;
          background: #fff !important;
          border-radius: 0.75rem !important;
          padding: 0.75rem 0.75rem 0.75rem 1rem !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 1.25rem !important;
          cursor: pointer !important;
          transition: border-color 0.2s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.2s cubic-bezier(.4,0,.2,1) !important;
        }

        .event-card-v2:hover {
          border-color: rgba(19, 21, 23, 0.16) !important;
          box-shadow: 0px 28px 17px rgba(0,0,0,.004),
                      0px 12px 12px rgba(0,0,0,.01),
                      0px 3px 7px rgba(0,0,0,.01) !important;
          /* No translateY on hover */
        }

        .private-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffe4e6;
          margin-right: 0.5rem;
        }

        .private-tooltip {
          position: absolute;
          top: -1.5rem;
          left: 0;
          background: rgba(19,21,23,0.9);
          color: #fff;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .private-indicator:hover .private-tooltip {
          opacity: 1;
        }

        .event-card-cover {
          width: 120px;
          height: 120px;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid rgba(19, 21, 23, 0.04);
          background: #f7f8f9;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1/1;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Unified Timeline Layout */
        .events-list {
          --timeline-title-width: 7rem;
          --timeline-column-gap: 4rem;
          position: relative;
          padding-left: 0;
        }
        .events-list::before {
          content: "";
          position: absolute;
          top: 0.75rem;
          bottom: 0;
          left: calc(var(--timeline-title-width) + var(--timeline-column-gap) / 2);
          border-left: .125rem dashed rgba(19, 21, 23, 0.08);
          z-index: 0;
        }

        /* Group row */
        .events-group-row {
          display: grid;
          grid-template-columns: var(--timeline-title-width) 1fr;
          gap: var(--timeline-column-gap);
          margin-bottom: 3rem;
          position: relative;
        }

        /* Left column for date & weekday */
        .date-col {
          width: var(--timeline-title-width);
          text-align: left;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-top: 0.625rem; /* Aligns perfectly with the time inside the card */
          font-family: 'Inter', sans-serif;
          position: sticky;
          top: 100px;
          height: fit-content;
          align-self: start;
        }

          .date-main {
            font-size: 1rem; /* 16px */
            font-weight: 600;
            color: #131517;
            line-height: 1.2;
          }

          .date-sub {
            font-size: 1rem; /* 16px */
            font-weight: 400;
            color: rgba(19, 21, 23, 0.4);
            margin-top: 4px;
            text-transform: lowercase;
          }

        /* Timeline Dot */
        .timeline-dot {
          position: absolute;
          left: calc(var(--timeline-title-width) + var(--timeline-column-gap) / 2);
          top: 0.75rem; /* Align with card top padding */
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(19, 21, 23, 0.2);
          border: none;
          z-index: 10;
        }

        /* Right column for cards */
        .cards-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .events-list {
            --timeline-title-width: 4rem;
            --timeline-column-gap: 1.5rem;
          }
          .events-group-row {
            margin-bottom: 2rem;
          }
          .date-col {
            padding-top: 0.625rem;
          }
          .date-main {
            font-size: 14px;
            line-height: 1.2;
          }
          .date-sub {
            font-size: 11px;
            margin-top: 2px;
          }
          .timeline-dot {
            top: 1.875rem;
          }
          .event-card-v2 {
            padding: 1rem !important;
            gap: 1rem !important;
            border-radius: 0.625rem !important;
          }
          .event-card-cover {
            width: 80px;
            height: 80px;
            border-radius: 0.375rem;
          }
        }

        @media (max-width: 600px) {
          .events-page-v3 .zm-container { padding-top: var(--page-top-spacing-mobile) !important; }
          .events-page-heading { align-items: flex-start !important; gap: 14px; margin-bottom: 2rem !important; }
          .events-page-heading h1 { font-size: 1.5rem !important; padding-top: 7px; }
          .lux-button-switcher { flex-shrink: 0; }
          .lux-button-switcher .segment { min-height: 40px; padding: .5rem .75rem; }
          .events-list { --timeline-title-width: 100%; --timeline-column-gap: 0; }
          .events-list::before, .timeline-dot { display: none; }
          .events-group-row { grid-template-columns: minmax(0, 1fr); gap: 10px; margin-bottom: 2rem; }
          .date-col {
            position: static;
            width: auto;
            padding: 0 2px;
            flex-direction: row;
            align-items: baseline;
            gap: 6px;
          }
          .date-main { font-size: 14px; }
          .date-sub { font-size: 13px; margin-top: 0; }
          .event-card-v2 { padding: 12px !important; }
          .event-card-v2 > div:first-child { gap: 12px !important; }
          .event-card-cover { width: 72px; height: 72px; }
          .event-card-v2 h3 { font-size: 1rem !important; }
          .event-card-v2 > div:last-child { flex-wrap: wrap; gap: 8px; }
          .manage-event-btn { min-height: 40px !important; padding: 8px 10px !important; }
        }

        @media (max-width: 360px) {
          .events-page-heading { flex-direction: column; }
          .events-page-heading .lux-button-switcher { width: 100%; }
          .events-page-heading .segments { width: 100%; }
          .event-card-cover { width: 64px; height: 64px; }
        }

        /* Dark Theme Overrides at the bottom of stylesheet to ensure priority */
        .theme-root.dark .event-card-v2 {
          background: #202224 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-root.dark .event-card-v2:hover {
          border-color: rgba(255, 255, 255, 0.22) !important;
          box-shadow: none !important;
        }
        .theme-root.dark .manage-event-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .theme-root.dark .manage-event-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }
        .theme-root.dark .lux-button-switcher {
          --segment-bg-color: rgba(255, 255, 255, 0.06);
          --segment-slider-bg-color: rgba(255, 255, 255, 0.1);
          --segment-color: rgba(255, 255, 255, 0.5);
          --segment-selected-color: #ffffff;
        }
        .theme-root.dark .ticket-type-tag {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .theme-root.dark .events-list::before {
          border-left-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-root.dark .timeline-dot {
          background: rgba(255, 255, 255, 0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default Events;
