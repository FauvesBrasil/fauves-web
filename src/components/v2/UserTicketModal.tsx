import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightLeft,
  CircleAlert,
  CheckCircle2,
  ChevronLeft,
  Info,
  Loader2,
  MapPin,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import LogoFauves from '@/components/LogoFauves';
import EventImage from '@/components/EventImage';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { fetchApi } from '@/lib/apiBase';

type UserTicketModalProps = {
  tickets: any[];
  initialTicketId?: string;
  onClose: () => void;
  onTransferred: () => void | Promise<void>;
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
};

type TicketSlideProps = {
  ticket: any;
  onTransfer: (ticket: any) => void;
  scale: number;
};

const TICKET_WIDTH = 420;
const TICKET_HEIGHT = 734;
const VIEWPORT_HORIZONTAL_GUTTER = 56;
const VIEWPORT_VERTICAL_GUTTER = 144;
const TICKET_CLIP_PATH = 'path("M30 0H390C406.569 0 420 13.431 420 30V374C412.268 374 406 380.268 406 388C406 395.732 412.268 402 420 402V704C420 720.569 406.569 734 390 734H30C13.431 734 0 720.569 0 704V402C7.732 402 14 395.732 14 388C14 380.268 7.732 374 0 374V30C0 13.431 13.431 0 30 0Z")';

const ticketGlass = 'backdrop-blur-[32px]';
const ticketGlassStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.052) 0%, rgba(0,0,0,0.20) 46%, rgba(255,255,255,0.028) 100%)',
  WebkitBackdropFilter: 'blur(32px) saturate(145%)',
  backdropFilter: 'blur(32px) saturate(145%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.09), inset 1px 0 0 rgba(255,255,255,.035), inset -1px 0 0 rgba(255,255,255,.035)',
};

function getTicketScale() {
  if (typeof window === 'undefined') return 1;
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth;
  const viewportHeight = viewport?.height || window.innerHeight;
  return Math.max(0.42, Math.min(
    1,
    (viewportWidth - VIEWPORT_HORIZONTAL_GUTTER) / TICKET_WIDTH,
    (viewportHeight - VIEWPORT_VERTICAL_GUTTER) / TICKET_HEIGHT,
  ));
}

function TicketSlide({ ticket, onTransfer, scale }: TicketSlideProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const ticketIsUsed = Boolean(ticket.used || ticket.status === 'USED');

  React.useEffect(() => {
    if (ticketIsUsed) {
      setQrDataUrl(null);
      return;
    }

    let active = true;
    const generateQrCode = () => {
      QRCode.toDataURL(JSON.stringify({ c: ticket.code, ts: Date.now() }), { margin: 1, width: 600 })
        .then(url => { if (active) setQrDataUrl(url); });
    };

    generateQrCode();
    const interval = window.setInterval(generateQrCode, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [ticket.code, ticketIsUsed]);

  const startDateValue = ticket.eventStartDate || ticket.event?.startDate;
  const startDate = startDateValue ? new Date(startDateValue) : null;
  const dateFormatted = startDate
    ? startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : 'Data não informada';
  const timeFormatted = startDate
    ? `${startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`
    : '—';
  const locationName = ticket.eventVenue || ticket.event?.venue || 'Local não definido';
  const locationAddress = ticket.eventLocation || ticket.event?.location || '';
  const locationDisplay = locationAddress && !locationName.toLocaleLowerCase('pt-BR').includes(locationAddress.toLocaleLowerCase('pt-BR'))
    ? `${locationName}, ${locationAddress}`
    : locationName;
  const hasBanner = Boolean(ticket.eventBannerUrl || ticket.bannerUrl || ticket.banner || ticket.image || ticket.event?.image || ticket.event?.bannerUrl);

  const printTicket = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif"><h2>${ticket.eventName || ticket.event?.name || 'Evento'}</h2><p>${ticket.ticketTypeName || 'Ingresso'}</p><img src="${qrDataUrl}" style="width:min(80vw,520px)"/><p>${ticket.code}</p></body></html>`);
    printWindow.print();
  };

  const month = startDate ? startDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase() : '—';
  const day = startDate ? startDate.toLocaleDateString('pt-BR', { day: '2-digit' }) : '—';

  return (
    <div
      data-ticket-slide
      className="shrink-0 snap-center"
      style={{ width: TICKET_WIDTH * scale, height: TICKET_HEIGHT * scale }}
    >
    <article
      className="relative h-[734px] w-[420px] overflow-hidden text-white"
      style={{
        clipPath: TICKET_CLIP_PATH,
        WebkitClipPath: TICKET_CLIP_PATH,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
      }}
    >
      <div className="relative h-[170px] overflow-hidden rounded-t-[30px] bg-[#d9d9d9]">
        {hasBanner ? (
          <EventImage event={ticket} className="h-full w-full object-cover" alt={`Imagem de ${ticket.eventName || ticket.event?.name || 'evento'}`} />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-[#2A2AD7] to-[#111827] text-white/80">
            <TicketIcon className="h-11 w-11" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <span className={`absolute bottom-5 left-6 inline-flex h-7 items-center rounded-full px-[15px] text-xs font-semibold shadow-sm backdrop-blur-xl ${ticketIsUsed ? 'bg-emerald-500/90 text-white' : 'bg-black/20 text-white ring-1 ring-white/10'}`}>
          {ticketIsUsed ? 'Check-in realizado' : ticket.ticketTypeName || 'Ingresso'}
        </span>
      </div>

      <section className={`${ticketGlass} flex h-[218px] flex-col px-[25px] pb-5 pt-5`} style={ticketGlassStyle}>
        <h2 className="text-xl font-bold leading-snug tracking-[-0.02em] text-white">
          {ticket.eventName || ticket.event?.name || 'Evento'}
        </h2>

        <div className="mt-5 space-y-3.5">
          <div className="flex items-center gap-[9px]">
            <span className="flex h-[38px] w-[38px] shrink-0 flex-col items-center overflow-hidden rounded-[10px] bg-white/10 text-[#9b9b9b]">
              <span className="flex h-[13px] w-full items-center justify-center rounded-t-[10px] bg-white/10 text-[8px] font-bold leading-none">{month}</span>
              <span className="mt-0.5 text-base font-medium leading-5">{day}</span>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#707070]">Data e horário</p>
              <p className="mt-[3px] truncate text-sm font-semibold capitalize text-white">{dateFormatted} · {timeFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-[9px]">
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-white/10 text-[#9b9b9b] ring-1 ring-inset ring-white/10">
              <MapPin className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#707070]">Local</p>
              {locationAddress ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationName} ${locationAddress}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-[3px] block truncate text-sm font-semibold text-white transition hover:text-white/75"
                >
                  {locationDisplay}
                </a>
              ) : (
                <p className="mt-[3px] truncate text-sm font-semibold text-white">{locationDisplay}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={`${ticketGlass} relative h-[346px] border-t border-white/10 px-[25px] pb-[23px] pt-[23px]`} style={ticketGlassStyle}>
        <div className="flex flex-col items-center gap-[26px] text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={ticketIsUsed ? 'used' : 'available'}
              initial={{ opacity: 0, scale: 0.96, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`flex h-[227px] w-[208px] flex-col items-center rounded-[18px] border px-[6px] pb-[10px] pt-[7px] ${ticketIsUsed ? 'justify-center border-emerald-300/60 bg-emerald-50' : 'border-white bg-white'}`}
            >
              {ticketIsUsed ? (
                <div className="flex flex-col items-center text-emerald-600">
                  <motion.div initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                    <CheckCircle2 className="h-14 w-14" strokeWidth={1.6} />
                  </motion.div>
                  <p className="mt-3 text-sm font-semibold">Check-in realizado</p>
                  <p className="mt-1 text-xs opacity-75">{ticket.usedAt ? new Date(ticket.usedAt).toLocaleString('pt-BR') : 'Ingresso utilizado'}</p>
                </div>
              ) : qrDataUrl ? (
                <>
                  <img src={qrDataUrl} className="h-[194px] w-[195px]" alt="QR Code do ingresso" />
                  <p className="mt-auto font-mono text-xs font-semibold leading-none text-[#282829]">{ticket.code}</p>
                </>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
              )}
            </motion.div>
          </AnimatePresence>

          {!ticketIsUsed ? (
            <div className="grid h-11 w-full grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onTransfer(ticket)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-white/[.08] px-3 text-sm font-semibold text-white/65 transition-all duration-300 hover:bg-white/65 hover:text-[#131517] active:scale-[.98]"
              >
                Transferir
              </button>
              <button
                type="button"
                onClick={printTicket}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-white/[.08] px-3 text-sm font-semibold text-white/65 transition-all duration-300 hover:bg-white/65 hover:text-[#131517] active:scale-[.98]"
              >
                Imprimir
              </button>
            </div>
          ) : (
            <p className="flex h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-amber-200/80">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              Ingresso utilizado · transferência indisponível
            </p>
          )}
        </div>
      </section>
    </article>
    </div>
  );
}

export function UserTicketModal({ tickets, initialTicketId, onClose, onTransferred, toast }: UserTicketModalProps) {
  const safeTickets = tickets.length ? tickets : [];
  const initialIndex = Math.max(0, safeTickets.findIndex(ticket => ticket.id === initialTicketId));
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const [transferTicket, setTransferTicket] = React.useState<any | null>(null);
  const [transferEmail, setTransferEmail] = React.useState('');
  const [transferLoading, setTransferLoading] = React.useState(false);
  const [ticketScale, setTicketScale] = React.useState(getTicketScale);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const scrollFrameRef = React.useRef<number | null>(null);

  React.useEffect(() => acquireDocumentScrollLock(), []);

  React.useEffect(() => {
    const updateScale = () => setTicketScale(getTicketScale());
    const viewport = window.visualViewport;
    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    viewport?.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
      viewport?.removeEventListener('resize', updateScale);
    };
  }, []);

  React.useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !carousel.clientWidth) return;
    const slide = carousel.querySelectorAll<HTMLElement>('[data-ticket-slide]')[initialIndex];
    if (slide) {
      carousel.scrollTo({
        left: slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2,
        behavior: 'auto',
      });
    }
    setActiveIndex(initialIndex);
  }, [initialIndex, ticketScale]);

  React.useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const handleCarouselScroll = () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const carousel = carouselRef.current;
      if (!carousel?.clientWidth) return;
      const viewportCenter = carousel.scrollLeft + carousel.clientWidth / 2;
      const slides = Array.from(carousel.querySelectorAll<HTMLElement>('[data-ticket-slide]'));
      const closestIndex = slides.reduce((bestIndex, slide, index) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const bestSlide = slides[bestIndex];
        const bestCenter = bestSlide ? bestSlide.offsetLeft + bestSlide.clientWidth / 2 : Number.POSITIVE_INFINITY;
        return Math.abs(slideCenter - viewportCenter) < Math.abs(bestCenter - viewportCenter) ? index : bestIndex;
      }, 0);
      setActiveIndex(closestIndex);
    });
  };

  const handleTransfer = async () => {
    if (!transferTicket || !transferEmail.includes('@')) return;
    setTransferLoading(true);
    try {
      const response = await fetchApi('/api/ticket/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: transferTicket.id, targetEmail: transferEmail.trim() }),
      });
      if (!response.ok) throw new Error('Falha ao transferir');
      toast({ title: 'Ingresso transferido', description: 'O ingresso foi enviado para o novo titular.' });
      await onTransferred();
      onClose();
    } catch {
      toast({ title: 'Não foi possível transferir', description: 'Confira o e-mail e tente novamente.', variant: 'destructive' });
    } finally {
      setTransferLoading(false);
    }
  };

  if (!safeTickets.length) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden backdrop-blur-[28px]"
      style={{
        background: 'radial-gradient(circle at 18% 12%, rgba(88,88,145,.16), transparent 34%), radial-gradient(circle at 82% 88%, rgba(65,91,82,.13), transparent 36%), rgba(17,18,19,.86)',
        WebkitBackdropFilter: 'blur(28px) saturate(125%)',
        backdropFilter: 'blur(28px) saturate(125%)',
      }}
    >
      <motion.button
        type="button"
        aria-label="Fechar ingressos"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pb-2 pt-[max(12px,env(safe-area-inset-top))] sm:px-8">
        <LogoFauves
          variant="white"
          width={88}
          className="opacity-90 drop-shadow-[0_2px_12px_rgba(0,0,0,.3)]"
          title="Fauves"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar ingressos"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.07] text-white/75 shadow-lg backdrop-blur-xl transition-all duration-200 hover:bg-white/[.14] hover:text-white active:scale-95"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-screen max-w-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          {transferTicket ? (
            <motion.section
              key="transfer"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              className={`${ticketGlass} relative mx-auto flex w-[min(420px,calc(100vw-32px))] flex-col overflow-y-auto rounded-[28px] p-6 text-white shadow-2xl ring-1 ring-white/10`}
              style={{
                ...ticketGlassStyle,
                maxHeight: 'calc(100dvh - 7rem)',
                minHeight: 'min(520px, calc(100dvh - 7rem))',
              }}
            >
              <button
                type="button"
                onClick={() => { setTransferTicket(null); setTransferEmail(''); }}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.07] text-neutral-200 transition hover:bg-white/[.12]"
                aria-label="Voltar ao ingresso"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>

              <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#2A2AD7]/10 text-[#2A2AD7]">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Transferir ingresso</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                O ingresso será removido da sua conta e enviado ao e-mail informado.
              </p>

              <label className="mt-7 text-sm font-medium text-neutral-200" htmlFor="ticket-transfer-email">E-mail do novo titular</label>
              <input
                id="ticket-transfer-email"
                type="email"
                value={transferEmail}
                onChange={event => setTransferEmail(event.target.value)}
                placeholder="nome@exemplo.com"
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base text-white outline-none transition placeholder:text-neutral-500 focus:border-[#5b5bf0] focus:ring-2 focus:ring-[#5b5bf0]/20"
              />

              <div className="mt-5 flex gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Confira o endereço antes de confirmar. A transferência não pode ser desfeita por esta tela.</p>
              </div>

              <div className="mt-auto grid gap-2.5 pt-8">
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferEmail.includes('@')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2A2AD7] px-5 text-sm font-semibold text-white transition hover:bg-[#2222b8] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {transferLoading && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar transferência
                </button>
                <button type="button" onClick={() => { setTransferTicket(null); setTransferEmail(''); }} className="min-h-11 rounded-xl text-sm font-medium text-neutral-400 transition hover:bg-white/[.06] hover:text-white">Cancelar</button>
              </div>
            </motion.section>
          ) : (
            <motion.div key="tickets" className="relative w-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="scrollbar-hide flex w-screen snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain py-3 sm:gap-[50px]"
                style={{
                  touchAction: 'pan-x pan-y',
                  paddingInline: `max(28px, calc((100vw - ${TICKET_WIDTH * ticketScale}px) / 2))`,
                  scrollPaddingInline: `max(28px, calc((100vw - ${TICKET_WIDTH * ticketScale}px) / 2))`,
                }}
                aria-label="Ingressos do evento"
              >
                {safeTickets.map(ticket => (
                  <TicketSlide key={ticket.id} ticket={ticket} onTransfer={setTransferTicket} scale={ticketScale} />
                ))}
              </div>

              {safeTickets.length > 1 && (
                <div className="pointer-events-none absolute inset-x-0 -bottom-4 flex justify-center gap-1.5" aria-hidden="true">
                  {safeTickets.map((ticket, index) => (
                    <span key={ticket.id} className={`h-1.5 rounded-full transition-all duration-200 ${index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
