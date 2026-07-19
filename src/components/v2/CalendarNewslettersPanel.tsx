import React from 'react';
import { ArrowRight, BadgeCheck, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveImageUrl } from '@/lib/apiBase';

type Props = {
  calendarId?: string;
  calendarName?: string;
  calendarLogoUrl?: string | null;
};

const EmptyMailbox = () => (
  <svg width="172" height="145" viewBox="0 0 172 145" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="mailbox-body" x1="42" y1="28" x2="128" y2="126" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4b4c4e" />
        <stop offset="1" stopColor="#252627" />
      </linearGradient>
      <linearGradient id="mailbox-side" x1="111" y1="40" x2="148" y2="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#555658" />
        <stop offset="1" stopColor="#303132" />
      </linearGradient>
      <filter id="mailbox-shadow" x="14" y="14" width="150" height="128" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#000" floodOpacity=".34" />
      </filter>
    </defs>
    <g filter="url(#mailbox-shadow)">
      <path d="M30 101V61c0-25 18-42 42-42h35c24 0 42 17 42 42v40H30Z" fill="url(#mailbox-side)" stroke="#5a5b5d" strokeOpacity=".52" />
      <path d="M30 101V58c0-22 15-37 34-37s34 15 34 37v43H30Z" fill="url(#mailbox-body)" stroke="#5b5c5e" strokeOpacity=".48" />
      <path d="M98 101h27c10 0 18 8 18 18v10" stroke="#292a2b" strokeWidth="14" strokeLinecap="round" />
      <path d="M58 43v-8c0-5 4-9 9-9h11" stroke="#303133" strokeWidth="5" strokeLinecap="round" />
      <path d="M61 37h17" stroke="#565759" strokeWidth="3" strokeLinecap="round" opacity=".62" />
    </g>
  </svg>
);

export function CalendarNewslettersPanel({ calendarId, calendarName = 'Fauves', calendarLogoUrl }: Props) {
  const storageKey = `fauves-calendar-newsletter-verification-${calendarId || 'default'}`;
  const [view, setView] = React.useState<'overview' | 'verification'>('overview');
  const [verified, setVerified] = React.useState(false);
  const [estimatedRecipients, setEstimatedRecipients] = React.useState('100');
  const [eventInformation, setEventInformation] = React.useState('');
  const [guestInformation, setGuestInformation] = React.useState('');
  const [confirmCleanList, setConfirmCleanList] = React.useState(false);
  const [confirmOptIn, setConfirmOptIn] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      setVerified(Boolean(saved?.verified));
      if (saved) {
        setEstimatedRecipients(String(saved.estimatedRecipients || '100'));
        setEventInformation(saved.eventInformation || '');
        setGuestInformation(saved.guestInformation || '');
        setConfirmCleanList(Boolean(saved.confirmCleanList));
        setConfirmOptIn(Boolean(saved.confirmOptIn));
      }
    } catch {
      setVerified(false);
    }
  }, [storageKey]);

  const formIsValid = Number(estimatedRecipients) > 0
    && eventInformation.trim().length >= 20
    && guestInformation.trim().length >= 20
    && confirmCleanList
    && confirmOptIn;

  const submitVerification = () => {
    if (!formIsValid) return;
    const verification = {
      verified: true,
      estimatedRecipients: Number(estimatedRecipients),
      eventInformation: eventInformation.trim(),
      guestInformation: guestInformation.trim(),
      confirmCleanList,
      confirmOptIn,
      verifiedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(storageKey, JSON.stringify(verification)); } catch { /* storage unavailable */ }
    setVerified(true);
    setView('overview');
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
    {view === 'verification' ? (
      <motion.div key="verification" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative -mt-6 min-h-[760px] overflow-hidden px-5 pb-10 pt-8 text-left sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(69,74,145,0.18),transparent_70%)]" />
        <div className="relative max-w-[512px]">
          <h1 className="text-[28px] font-bold tracking-[-0.025em] text-white">Verificar Calendário</h1>
          <p className="mt-2 text-base font-medium leading-6 text-zinc-300">Para aumentar seus limites de convites e newsletters, compartilhe algumas informações sobre seus eventos planejados e contatos.</p>

          <div className="mt-10 flex min-h-[62px] items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.055] px-4 py-3">
            {calendarLogoUrl ? <img src={resolveImageUrl(calendarLogoUrl) || ''} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-xs font-black text-white">F</span>}
            <div><span className="block text-sm font-semibold text-zinc-300">Para o Calendário</span><strong className="block text-base text-white">{calendarName}</strong></div>
          </div>

          <div className="mt-8">
            <label className="block text-base font-bold leading-5 text-white">Para quantas pessoas você gostaria de convidar ou enviar newsletters?</label>
            <p className="mt-1 text-sm font-semibold leading-5 text-zinc-400">Por favor, compartilhe uma estimativa do número de mensagens que você planeja enviar de uma vez.</p>
            <input inputMode="numeric" value={estimatedRecipients} onChange={(event) => setEstimatedRecipients(event.target.value.replace(/\D/g, ''))} className="mt-4 h-10 w-40 rounded-lg border border-white/[0.13] bg-transparent px-3 text-right text-base font-semibold text-zinc-400 outline-none focus:border-white/30" />
          </div>

          <div className="mt-6">
            <label className="block text-base font-bold text-white">Por favor, compartilhe algumas informações sobre seus eventos.</label>
            <p className="mt-1 text-sm font-semibold leading-5 text-zinc-400">Que tipos de eventos você organiza? Com que frequência? Como você os divulga?</p>
            <textarea value={eventInformation} onChange={(event) => setEventInformation(event.target.value)} className="mt-4 h-[86px] w-full resize-none rounded-lg border border-white/[0.13] bg-transparent p-3 text-sm text-white outline-none focus:border-white/30" />
          </div>

          <div className="mt-6">
            <label className="block text-base font-bold text-white">Por favor, compartilhe algumas informações sobre seus convidados.</label>
            <p className="mt-1 text-sm font-semibold leading-5 text-zinc-400">Como você construiu sua lista de contatos? As pessoas optaram por receber e-mails?</p>
            <textarea value={guestInformation} onChange={(event) => setGuestInformation(event.target.value)} className="mt-4 h-[86px] w-full resize-none rounded-lg border border-white/[0.13] bg-transparent p-3 text-sm text-white outline-none focus:border-white/30" />
          </div>

          <label className="mt-7 flex cursor-pointer items-start gap-3 text-base font-semibold leading-6 text-white">
            <input type="checkbox" checked={confirmCleanList} onChange={(event) => setConfirmCleanList(event.target.checked)} className="peer sr-only" />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-white/[0.17] bg-transparent text-zinc-950 peer-checked:border-white peer-checked:bg-white">{confirmCleanList && <Check size={14} strokeWidth={3} />}</span>
            Confirmo que não vou importar ou contatar pessoas com endereços de e-mail inativos ou que cancelaram a inscrição.
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-base font-semibold leading-6 text-white">
            <input type="checkbox" checked={confirmOptIn} onChange={(event) => setConfirmOptIn(event.target.checked)} className="peer sr-only" />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-white/[0.17] bg-transparent text-zinc-950 peer-checked:border-white peer-checked:bg-white">{confirmOptIn && <Check size={14} strokeWidth={3} />}</span>
            Confirmo que enviarei mensagens apenas para pessoas que fizeram opt-in e consentiram em receber e-mails.
          </label>

          <button type="button" disabled={!formIsValid} onClick={submitVerification} className="mt-7 h-11 w-full rounded-lg border-0 bg-white text-base font-bold text-zinc-950 transition-[opacity,transform] enabled:hover:bg-zinc-100 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35">Enviar para Verificação</button>
          <button type="button" onClick={() => setView('overview')} className="mt-2 h-10 w-full rounded-lg border-0 bg-transparent text-sm font-semibold text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white">Cancelar</button>
        </div>
      </motion.div>
    ) : (
    <motion.div key="overview" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }} className="text-left">
      <section>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white">Rascunhos</h2>
        <p className="mt-1 text-base font-medium leading-6 text-zinc-300">Conforme você escreve, seus rascunhos serão salvos automaticamente e aparecerão aqui.</p>

        {!verified && <div className="mt-5 flex min-h-[65px] flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.09] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <BadgeCheck size={16} className="mt-0.5 shrink-0 fill-amber-300 text-amber-300" />
            <div>
              <h3 className="text-base font-bold text-amber-300">Por favor, verifique seu calendário.</h3>
              <p className="mt-1 text-sm font-semibold text-amber-300/90">Compartilhe informações sobre seu calendário para enviar newsletters.</p>
            </div>
          </div>
          <button type="button" onClick={() => setView('verification')} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-end rounded-lg border border-amber-300/80 bg-transparent px-3 text-sm font-bold text-amber-200 transition-[background-color,transform] duration-150 hover:bg-amber-300/10 active:scale-[0.97] sm:self-auto">
            Verificar <ArrowRight size={14} />
          </button>
        </div>}
      </section>

      <div className="my-8 h-px bg-white/[0.10]" />

      <section>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white">Publicados</h2>
        <div className="flex min-h-[365px] flex-col items-center justify-center px-4 pb-8 pt-10 text-center">
          <EmptyMailbox />
          <h3 className="mt-3 text-[21px] font-bold tracking-[-0.02em] text-zinc-500">Nenhuma Newsletter</h3>
          <p className="mt-1 max-w-[570px] text-base font-semibold text-zinc-500">Conte aos seus assinantes sobre seus eventos e o que está acontecendo.</p>
        </div>
      </section>
    </motion.div>
    )}
    </AnimatePresence>
  );
}
