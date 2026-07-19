import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, X } from 'lucide-react';

export interface ClonedEventSummary {
  id?: string;
  name?: string | null;
  image?: string | null;
  location?: string | null;
  locationAddress?: string | null;
  startDate?: string | null;
}

interface CloneEventSuccessModalProps {
  events: ClonedEventSummary[];
  onClose: () => void;
  onOpenEvent: (eventId: string) => void;
}

const eventDateParts = (value?: string | null) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: 'Data não definida', weekday: '', time: '' };
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const isTomorrow = date.getFullYear() === tomorrow.getFullYear()
    && date.getMonth() === tomorrow.getMonth()
    && date.getDate() === tomorrow.getDate();
  return {
    date: isTomorrow ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''),
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
};

export function CloneEventSuccessModal({ events, onClose, onOpenEvent }: CloneEventSuccessModalProps) {
  React.useEffect(() => {
    if (!events.length) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [events.length, onClose]);

  if (typeof document === 'undefined' || !events.length) return null;
  const firstEvent = events[0];
  const cleanName = (firstEvent.name || 'Evento').replace(/\s*\(cópia\)$/i, '');
  const location = firstEvent.locationAddress || firstEvent.location;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        className="fixed inset-0 z-[100001] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-[3px]"
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="clone-success-title"
          initial={{ scale: 0.96, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 12 }}
          className="my-auto max-h-[calc(100dvh-24px)] w-full max-w-[340px] overflow-y-auto rounded-[17px] border border-white/[0.06] bg-[#1b1c1d]/95 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,.62)] backdrop-blur-2xl"
        >
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:text-white" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4dcc43] text-white shadow-[0_8px_24px_rgba(77,204,67,.22)]">
            <Check size={27} strokeWidth={3} />
          </div>
          <h2 id="clone-success-title" className="mt-4 text-center text-[20px] font-bold tracking-[-0.025em]">Evento Clonado</h2>
          <p className="mx-auto mt-2 max-w-[270px] text-center text-[13px] font-medium leading-5 text-zinc-400">
            Criamos seus novos eventos. Você pode abri-los abaixo para fazer mais alterações.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            {firstEvent.image ? (
              <img src={firstEvent.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">{cleanName.charAt(0)}</div>
            )}
            <div className="min-w-0">
              <strong className="block truncate text-[15px]">{cleanName}</strong>
              {location && <span className="block truncate text-[12px] font-semibold text-zinc-500">{location}</span>}
            </div>
          </div>

          <p className="mt-4 text-[14px] font-semibold text-zinc-400">{events.length} {events.length === 1 ? 'Novo Evento' : 'Novos Eventos'}</p>
          <div className="mt-2 max-h-[360px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.035]">
            {events.map((clonedEvent, index) => {
              const formatted = eventDateParts(clonedEvent.startDate);
              return (
                <button
                  key={clonedEvent.id || `${clonedEvent.startDate}-${index}`}
                  type="button"
                  disabled={!clonedEvent.id}
                  onClick={() => clonedEvent.id && onOpenEvent(clonedEvent.id)}
                  className="grid h-[41px] w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-white/[0.06] px-3 text-left last:border-b-0 hover:bg-white/[0.05] disabled:cursor-default"
                >
                  <span className="min-w-0 truncate text-[14px] font-semibold">{formatted.date} <span className="ml-1 text-zinc-500">{formatted.weekday}</span></span>
                  <span className="text-[14px] font-semibold text-zinc-400">{formatted.time}</span>
                  <ExternalLink size={13} className="text-zinc-500" />
                </button>
              );
            })}
          </div>

          <button type="button" onClick={onClose} className="mt-4 h-[38px] w-full rounded-lg bg-white text-[15px] font-bold text-[#191a1b] transition hover:bg-zinc-100">Concluído</button>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
