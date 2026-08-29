import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Printer,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';

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
};

const ticketGlass = 'bg-white/90 dark:bg-[#18191a]/90 backdrop-blur-2xl';

function TicketSlide({ ticket, onTransfer }: TicketSlideProps) {
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
  const bannerUrl = resolveImageUrl(ticket.eventBannerUrl || ticket.event?.image || ticket.event?.bannerUrl) || '';

  const printTicket = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif"><h2>${ticket.eventName || ticket.event?.name || 'Evento'}</h2><p>${ticket.ticketTypeName || 'Ingresso'}</p><img src="${qrDataUrl}" style="width:min(80vw,520px)"/><p>${ticket.code}</p></body></html>`);
    printWindow.print();
  };

  return (
    <article className="ticket-slide-scrollbar h-fit max-h-[calc(100dvh-2rem)] w-full shrink-0 snap-center overflow-y-auto overflow-x-hidden rounded-[28px] text-[#131517] shadow-[0_24px_80px_rgba(0,0,0,.28)] ring-1 ring-white/30 dark:text-white dark:ring-white/10">
      <div className="relative h-44 overflow-hidden rounded-t-[28px] bg-neutral-200 dark:bg-neutral-800">
        {bannerUrl ? (
          <img src={bannerUrl} className="h-full w-full object-cover" alt={`Imagem de ${ticket.eventName || ticket.event?.name || 'evento'}`} />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-[#2A2AD7] to-[#111827] text-white/80">
            <TicketIcon className="h-11 w-11" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <span className={`absolute bottom-4 left-5 inline-flex min-h-7 items-center rounded-full px-3 text-[11px] font-semibold shadow-sm backdrop-blur-xl ${ticketIsUsed ? 'bg-emerald-500/90 text-white' : 'bg-black/55 text-white ring-1 ring-white/20'}`}>
          {ticketIsUsed ? 'Check-in realizado' : ticket.ticketTypeName || 'Ingresso'}
        </span>
      </div>

      <section className={`${ticketGlass} px-6 pb-3 pt-5`}>
        <h2 className="pr-12 text-xl font-semibold leading-snug tracking-[-0.02em]">
          {ticket.eventName || ticket.event?.name || 'Evento'}
        </h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/[.045] text-neutral-500 ring-1 ring-black/[.05] dark:bg-white/[.07] dark:text-neutral-300 dark:ring-white/[.08]">
              <Calendar className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Data e horário</p>
              <p className="mt-0.5 text-sm font-semibold capitalize text-neutral-900 dark:text-neutral-100">{dateFormatted} · {timeFormatted}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/[.045] text-neutral-500 ring-1 ring-black/[.05] dark:bg-white/[.07] dark:text-neutral-300 dark:ring-white/[.08]">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Local</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{locationName}</p>
              {locationAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationName} ${locationAddress}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-neutral-500 transition hover:text-[#2A2AD7] dark:text-neutral-400"
                >
                  <span className="truncate">{locationAddress}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        className={`relative h-7 ${ticketGlass}`}
        style={{
          WebkitMaskImage: 'radial-gradient(circle 14px at 0 50%, transparent 13px, #000 14px), radial-gradient(circle 14px at 100% 50%, transparent 13px, #000 14px)',
          WebkitMaskComposite: 'source-in',
          maskImage: 'radial-gradient(circle 14px at 0 50%, transparent 13px, #000 14px), radial-gradient(circle 14px at 100% 50%, transparent 13px, #000 14px)',
          maskComposite: 'intersect',
        }}
        aria-hidden="true"
      >
        <span className="absolute left-6 right-6 top-1/2 border-t border-dashed border-black/10 dark:border-white/10" />
      </div>

      <section className={`${ticketGlass} rounded-b-[28px] px-6 pb-6 pt-3`}>
        <div className="flex flex-col items-center text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={ticketIsUsed ? 'used' : 'available'}
              initial={{ opacity: 0, scale: 0.96, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`grid h-44 w-44 place-items-center rounded-2xl border p-3 ${ticketIsUsed ? 'border-emerald-300/60 bg-emerald-50/80 dark:border-emerald-700/60 dark:bg-emerald-950/40' : 'border-black/[.06] bg-white dark:border-white/10'}`}
            >
              {ticketIsUsed ? (
                <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                  <motion.div initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                    <CheckCircle2 className="h-14 w-14" strokeWidth={1.6} />
                  </motion.div>
                  <p className="mt-3 text-sm font-semibold">Check-in realizado</p>
                  <p className="mt-1 text-xs opacity-75">{ticket.usedAt ? new Date(ticket.usedAt).toLocaleString('pt-BR') : 'Ingresso utilizado'}</p>
                </div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} className="h-40 w-40" alt="QR Code do ingresso" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Código do ingresso</p>
            <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">{ticket.code}</p>
          </div>

          {!ticketIsUsed ? (
            <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onTransfer(ticket)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[.07] bg-black/[.035] px-3 text-sm font-semibold text-neutral-800 transition hover:bg-black/[.07] active:scale-[.98] dark:border-white/10 dark:bg-white/[.07] dark:text-neutral-100 dark:hover:bg-white/[.11]"
              >
                <ArrowRightLeft className="h-4 w-4" />Transferir
              </button>
              <button
                type="button"
                onClick={printTicket}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[.07] bg-black/[.035] px-3 text-sm font-semibold text-neutral-800 transition hover:bg-black/[.07] active:scale-[.98] dark:border-white/10 dark:bg-white/[.07] dark:text-neutral-100 dark:hover:bg-white/[.11]"
              >
                <Printer className="h-4 w-4" />Imprimir
              </button>
            </div>
          ) : (
            <p className="mt-5 w-full rounded-xl bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300">
              Este ingresso já foi validado e não pode ser transferido.
            </p>
          )}
        </div>
      </section>
    </article>
  );
}

export function UserTicketModal({ tickets, initialTicketId, onClose, onTransferred, toast }: UserTicketModalProps) {
  const safeTickets = tickets.length ? tickets : [];
  const initialIndex = Math.max(0, safeTickets.findIndex(ticket => ticket.id === initialTicketId));
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const [transferTicket, setTransferTicket] = React.useState<any | null>(null);
  const [transferEmail, setTransferEmail] = React.useState('');
  const [transferLoading, setTransferLoading] = React.useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const scrollFrameRef = React.useRef<number | null>(null);

  React.useEffect(() => acquireDocumentScrollLock(), []);

  React.useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !carousel.clientWidth) return;
    carousel.scrollTo({ left: initialIndex * carousel.clientWidth, behavior: 'auto' });
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const handleCarouselScroll = () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const carousel = carouselRef.current;
      if (!carousel?.clientWidth) return;
      setActiveIndex(Math.max(0, Math.min(safeTickets.length - 1, Math.round(carousel.scrollLeft / carousel.clientWidth))));
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#131517]/55 p-4 backdrop-blur-xl sm:p-6">
      <motion.button
        type="button"
        aria-label="Fechar ingressos"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar ingressos"
          className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/65 active:scale-95"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {transferTicket ? (
            <motion.section
              key="transfer"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              className={`${ticketGlass} flex max-h-[calc(100dvh-2rem)] min-h-[520px] flex-col overflow-y-auto rounded-[28px] p-6 text-[#131517] shadow-2xl ring-1 ring-white/30 dark:text-white dark:ring-white/10`}
            >
              <button
                type="button"
                onClick={() => { setTransferTicket(null); setTransferEmail(''); }}
                className="grid h-10 w-10 place-items-center rounded-full border border-black/[.07] bg-black/[.035] text-neutral-600 transition hover:bg-black/[.07] dark:border-white/10 dark:bg-white/[.07] dark:text-neutral-200"
                aria-label="Voltar ao ingresso"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>

              <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#2A2AD7]/10 text-[#2A2AD7]">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Transferir ingresso</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                O ingresso será removido da sua conta e enviado ao e-mail informado.
              </p>

              <label className="mt-7 text-sm font-medium text-neutral-700 dark:text-neutral-200" htmlFor="ticket-transfer-email">E-mail do novo titular</label>
              <input
                id="ticket-transfer-email"
                type="email"
                value={transferEmail}
                onChange={event => setTransferEmail(event.target.value)}
                placeholder="nome@exemplo.com"
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white/65 px-4 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#2A2AD7] focus:ring-2 focus:ring-[#2A2AD7]/15 dark:border-white/10 dark:bg-black/20 dark:text-white"
              />

              <div className="mt-5 flex gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
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
                <button type="button" onClick={() => { setTransferTicket(null); setTransferEmail(''); }} className="min-h-11 rounded-xl text-sm font-medium text-neutral-500 transition hover:bg-black/[.04] dark:text-neutral-400 dark:hover:bg-white/[.06]">Cancelar</button>
              </div>
            </motion.section>
          ) : (
            <motion.div key="tickets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
                style={{ touchAction: 'pan-x pan-y' }}
                aria-label="Ingressos do evento"
              >
                {safeTickets.map(ticket => (
                  <TicketSlide key={ticket.id} ticket={ticket} onTransfer={setTransferTicket} />
                ))}
              </div>

              {safeTickets.length > 1 && (
                <div className="pointer-events-none absolute inset-x-0 -bottom-6 flex justify-center gap-1.5" aria-hidden="true">
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
