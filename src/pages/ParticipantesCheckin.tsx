import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  CircleAlert,
  List,
  Loader2,
  RotateCcw,
  ScanLine,
  Search,
  SwitchCamera,
  TicketCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import QrScanner from 'qr-scanner';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/apiBase';

type Participant = {
  id: string;
  code: string;
  nome: string;
  email: string;
  ingresso: string;
  used: boolean;
};

type ApiTicket = {
  id: string;
  code?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  guestName?: string | null;
  guestEmail?: string | null;
  ticketType?: { name?: string | null } | null;
  ticketTypeName?: string | null;
  used?: boolean;
};

type ScanFeedback = {
  type: 'success' | 'duplicate' | 'error';
  title: string;
  description: string;
};

type CameraState = 'idle' | 'starting' | 'active' | 'denied' | 'unavailable' | 'error';

function normalizeQrValue(value: string) {
  let normalized = value.trim();
  try { normalized = decodeURIComponent(normalized); } catch { /* valor não codificado */ }

  try {
    const parsed = JSON.parse(normalized);
    return String(parsed.code || parsed.c || parsed.ticketCode || parsed.id || normalized).trim();
  } catch { /* QR simples ou URL */ }

  try {
    const url = new URL(normalized);
    return String(
      url.searchParams.get('code') ||
      url.searchParams.get('ticket') ||
      url.searchParams.get('ticketId') ||
      normalized,
    ).trim();
  } catch { return normalized; }
}

function EmptyGuests({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="relative h-24 w-24 text-zinc-700">
        <svg viewBox="0 0 120 120" className="h-full w-full fill-none stroke-current stroke-[3]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M26 16h68M26 104h68" />
          <path d="M31 16c0 27 13 38 29 44-16 6-29 17-29 44M89 16c0 27-13 38-29 44 16 6 29 17 29 44" />
          <circle cx="46" cy="29" r="4" className="fill-current opacity-50" />
          <circle cx="60" cy="37" r="4" className="fill-current opacity-50" />
          <circle cx="74" cy="29" r="4" className="fill-current opacity-50" />
          <path d="M43 96c6-6 12-9 17-9s11 3 17 9Z" className="fill-current opacity-40" />
        </svg>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-zinc-300">Nenhum convidado encontrado</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {searching ? 'Nenhum convidado corresponde a esta busca.' : 'Compartilhe a página do evento para começar a receber inscrições.'}
      </p>
    </div>
  );
}

export default function ParticipantesCheckin() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const participantsRef = useRef<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'checkedin'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraCount, setCameraCount] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [processingScan, setProcessingScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef({ value: '', at: 0 });

  useEffect(() => { participantsRef.current = participants; }, [participants]);

  useEffect(() => {
    let mounted = true;
    if (!eventId) return;
    fetchApi(`/api/event/${eventId}`)
      .then(async response => response.ok ? response.json() : null)
      .then(event => {
        if (!mounted || !event) return;
        setEventName(event.name || event.title || 'Evento');
        if (event.startDate) {
          const date = new Date(event.startDate);
          setEventDate(date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [eventId]);

  const loadParticipants = useCallback(async (silent = false) => {
    if (!eventId) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetchApi(`/api/ticket/event/${eventId}`);
      if (!response.ok) throw new Error('Falha ao carregar convidados');
      const tickets = await response.json();
      const rawTickets: ApiTicket[] = Array.isArray(tickets) ? tickets : tickets?.tickets || [];
      const mapped: Participant[] = rawTickets.map(ticket => ({
        id: String(ticket.id),
        code: String(ticket.code || ''),
        nome: ticket.user?.name || ticket.guestName || ticket.guestEmail?.split('@')[0] || 'Convidado',
        email: ticket.user?.email || ticket.guestEmail || '—',
        ingresso: ticket.ticketType?.name || ticket.ticketTypeName || 'Ingresso',
        used: Boolean(ticket.used),
      }));
      setParticipants(mapped);
    } catch {
      toast.error('Não foi possível carregar os convidados');
    } finally { if (!silent) setLoading(false); }
  }, [eventId]);

  useEffect(() => { void loadParticipants(); }, [loadParticipants]);

  const setTicketCheckin = useCallback(async (participant: Participant, used: boolean) => {
    setParticipants(current => current.map(item => item.id === participant.id ? { ...item, used } : item));
    try {
      const response = await fetchApi(`/api/ticket/${participant.id}/toggle-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ used }),
      });
      if (!response.ok) throw new Error('Falha ao atualizar check-in');
      return true;
    } catch {
      setParticipants(current => current.map(item => item.id === participant.id ? { ...item, used: !used } : item));
      toast.error('Falha ao sincronizar o check-in');
      return false;
    }
  }, []);

  const processScannedValue = useCallback(async (rawValue: string) => {
    if (processingRef.current) return;
    const code = normalizeQrValue(rawValue).toLocaleLowerCase('pt-BR');
    if (!code) return;

    const now = Date.now();
    if (lastScanRef.current.value === code && now - lastScanRef.current.at < 2800) return;
    lastScanRef.current = { value: code, at: now };
    processingRef.current = true;
    setProcessingScan(true);

    const participant = participantsRef.current.find(item =>
      item.code.toLocaleLowerCase('pt-BR') === code || item.id.toLocaleLowerCase('pt-BR') === code,
    );

    if (!participant) {
      setScanFeedback({ type: 'error', title: 'Ingresso não encontrado', description: 'Este QR Code não pertence a este evento.' });
      navigator.vibrate?.([80, 60, 80]);
      processingRef.current = false;
      setProcessingScan(false);
      return;
    }

    if (participant.used) {
      setScanFeedback({ type: 'duplicate', title: 'Check-in já realizado', description: `${participant.nome} já entrou com este ingresso.` });
      navigator.vibrate?.([120, 70, 120]);
      processingRef.current = false;
      setProcessingScan(false);
      return;
    }

    const success = await setTicketCheckin(participant, true);
    setScanFeedback(success
      ? { type: 'success', title: 'Check-in realizado', description: `${participant.nome} · ${participant.ingresso}` }
      : { type: 'error', title: 'Não foi possível confirmar', description: 'Verifique a conexão e tente escanear novamente.' });
    if (success) navigator.vibrate?.(110);
    processingRef.current = false;
    setProcessingScan(false);
  }, [setTicketCheckin]);

  useEffect(() => {
    if (!scannerOpen || !videoRef.current) return;
    let disposed = false;
    setCameraState('starting');
    setScanFeedback(null);

    const scanner = new QrScanner(
      videoRef.current,
      result => { void processScannedValue(result.data); },
      {
        preferredCamera: cameraFacing,
        maxScansPerSecond: 8,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        returnDetailedScanResult: true,
      },
    );
    scannerRef.current = scanner;

    void (async () => {
      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          if (!disposed) setCameraState('unavailable');
          return;
        }
        await scanner.start();
        if (disposed) return;
        setCameraState('active');
        const cameras = await QrScanner.listCameras(true).catch(() => []);
        if (!disposed) setCameraCount(cameras.length);
      } catch (error: unknown) {
        if (disposed) return;
        const cameraError = error as { name?: string; message?: string };
        const denied = cameraError?.name === 'NotAllowedError' || /permission|denied|permissão/i.test(String(cameraError?.message || error));
        setCameraState(denied ? 'denied' : 'error');
      }
    })();

    return () => {
      disposed = true;
      scanner.stop();
      scanner.destroy();
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [cameraFacing, processScannedValue, scannerOpen]);

  const closeScanner = () => {
    setScannerOpen(false);
    setCameraState('idle');
    setScanFeedback(null);
    setManualCode('');
  };

  const switchCamera = () => {
    setCameraFacing(current => current === 'environment' ? 'user' : 'environment');
    setScanFeedback(null);
  };

  const filteredParticipants = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return participants.filter(participant => {
      if (activeTab === 'checkedin' && !participant.used) return false;
      return !term || `${participant.nome} ${participant.email} ${participant.code}`.toLocaleLowerCase('pt-BR').includes(term);
    });
  }, [activeTab, participants, search]);

  const checkedCount = participants.filter(participant => participant.used).length;
  const totalCount = participants.length;
  const progress = totalCount ? Math.round(checkedCount / totalCount * 100) : 0;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#141515] font-sans text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#141515]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[940px] items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => scannerOpen ? closeScanner() : navigate(-1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[.07] hover:text-white" aria-label="Voltar">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold text-white">{eventName}</h1>
            <p className="mt-0.5 text-[12px] font-medium text-zinc-500">{eventDate || 'Check-in de convidados'}</p>
          </div>
          <button
            type="button"
            onClick={() => scannerOpen ? closeScanner() : setScannerOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl bg-white/[.08] px-3.5 text-[13px] font-semibold text-zinc-300 transition hover:bg-white/[.12] hover:text-white"
          >
            {scannerOpen ? <><List size={16} />Lista</> : <><ScanLine size={16} />Escanear</>}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {scannerOpen ? (
          <motion.main key="scanner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto w-full max-w-[940px] flex-1 px-3 py-4 sm:px-6 sm:py-5">
            <div className="relative mx-auto aspect-[4/3] max-h-[min(70vh,690px)] w-full overflow-hidden rounded-2xl border border-white/[.1] bg-[#090a0a] shadow-2xl">
              <video ref={videoRef} muted playsInline className={`h-full w-full object-cover transition-opacity duration-300 ${cameraState === 'active' ? 'opacity-100' : 'opacity-20'}`} />

              {cameraState === 'active' && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 aspect-square w-[min(58%,330px)] -translate-x-1/2 -translate-y-1/2">
                    <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-xl border-l-2 border-t-2 border-white/90" />
                    <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-xl border-r-2 border-t-2 border-white/90" />
                    <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-xl border-b-2 border-l-2 border-white/90" />
                    <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-xl border-b-2 border-r-2 border-white/90" />
                    <motion.span animate={{ top: ['8%', '92%', '8%'] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-x-3 h-px bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,.7)]" />
                  </div>
                  <p className="absolute inset-x-0 bottom-5 text-center text-[12px] font-semibold text-white/70">Posicione o QR Code dentro da área</p>
                </div>
              )}

              {(cameraState === 'starting' || cameraState === 'idle') && (
                <div className="absolute inset-0 grid place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-zinc-400" size={32} /><p className="mt-3 text-sm font-medium text-zinc-500">Iniciando câmera…</p></div></div>
              )}

              {['denied', 'unavailable', 'error'].includes(cameraState) && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[.08] text-zinc-400"><Camera size={25} /></div>
                    <h2 className="mt-4 text-lg font-semibold">{cameraState === 'denied' ? 'Permissão da câmera bloqueada' : cameraState === 'unavailable' ? 'Câmera não encontrada' : 'Não foi possível abrir a câmera'}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{cameraState === 'denied' ? 'Libere o acesso à câmera nas configurações do navegador e recarregue a página.' : 'Você ainda pode informar o código do ingresso manualmente abaixo.'}</p>
                  </div>
                </div>
              )}

              {cameraState === 'active' && cameraCount > 1 && (
                <button type="button" onClick={switchCamera} className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 shadow-xl transition hover:scale-105" aria-label="Trocar câmera">
                  <SwitchCamera size={20} />
                </button>
              )}

              <AnimatePresence>
                {scanFeedback && (
                  <motion.div initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} className={`absolute inset-x-4 top-4 mx-auto flex max-w-md items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${scanFeedback.type === 'success' ? 'border-emerald-400/30 bg-emerald-950/85' : scanFeedback.type === 'duplicate' ? 'border-amber-400/30 bg-amber-950/85' : 'border-red-400/30 bg-red-950/85'}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${scanFeedback.type === 'success' ? 'bg-emerald-400 text-emerald-950' : scanFeedback.type === 'duplicate' ? 'bg-amber-400 text-amber-950' : 'bg-red-400 text-red-950'}`}>
                      {scanFeedback.type === 'success' ? <Check size={20} /> : <CircleAlert size={19} />}
                    </span>
                    <span className="min-w-0 flex-1"><strong className="block text-sm text-white">{scanFeedback.title}</strong><small className="mt-1 block text-xs leading-5 text-white/65">{scanFeedback.description}</small></span>
                    <button type="button" onClick={() => setScanFeedback(null)} className="text-white/45 hover:text-white"><X size={17} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mx-auto mt-4 rounded-2xl border border-white/[.08] bg-white/[.07] p-4">
              <div className="flex items-center justify-between gap-4 text-sm"><strong className="font-semibold text-emerald-400">{checkedCount} check-in{checkedCount === 1 ? '' : 's'} realizado{checkedCount === 1 ? '' : 's'}</strong><span className="font-medium text-zinc-500">{totalCount} confirmado{totalCount === 1 ? '' : 's'}</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[.09]"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-emerald-400" /></div>

              <form onSubmit={event => { event.preventDefault(); if (manualCode.trim()) void processScannedValue(manualCode).then(() => setManualCode('')); }} className="mt-4 flex gap-2 border-t border-white/[.08] pt-4">
                <input value={manualCode} onChange={event => setManualCode(event.target.value)} placeholder="Código do ingresso" className="h-10 min-w-0 flex-1 rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/[.3]" />
                <button type="submit" disabled={!manualCode.trim() || processingScan} className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 disabled:opacity-40">Validar</button>
              </form>
            </div>
          </motion.main>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-1 flex-col">
            <label className="border-b border-white/[.07] bg-white/[.065]">
              <span className="mx-auto flex h-12 w-full max-w-[940px] items-center gap-3 px-4 text-zinc-500 sm:px-6"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar um convidado…" className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600" />{search && <button type="button" onClick={() => setSearch('')}><X size={17} /></button>}</span>
            </label>

            <nav className="border-b border-white/[.07]">
              <div className="mx-auto flex w-full max-w-[940px] gap-6 overflow-x-auto px-4 sm:px-6">
                {([
                  ['all', 'Todos os convidados', ''],
                  ['confirmed', 'Confirmados', String(totalCount)],
                  ['checkedin', 'Check-in feito', String(checkedCount)],
                ] as const).map(([value, label, count]) => (
                  <button key={value} type="button" onClick={() => setActiveTab(value)} className={`relative h-12 shrink-0 text-sm font-semibold transition ${activeTab === value ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {label}{count && <span className="ml-1.5 font-medium text-zinc-600">{count}</span>}
                    {activeTab === value && <motion.span layoutId="checkin-tab" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
            </nav>

            <main className="mx-auto w-full max-w-[940px] flex-1 px-4 py-5 sm:px-6">
              {loading ? (
                <div className="grid min-h-[320px] place-items-center"><Loader2 size={30} className="animate-spin text-zinc-600" /></div>
              ) : filteredParticipants.length ? (
                <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.035]">
                  {filteredParticipants.map((participant, index) => (
                    <div key={participant.id} className={`flex min-h-[64px] items-center gap-3 px-4 py-3 ${index ? 'border-t border-white/[.07]' : ''}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[.08] text-xs font-bold text-zinc-300">{participant.nome.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold text-zinc-200">{participant.nome}</strong><small className="mt-1 block truncate text-xs text-zinc-600">{participant.email} · {participant.ingresso}</small></span>
                      {participant.used ? (
                        <span className="flex shrink-0 items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 sm:flex"><Check size={13} />Check-in feito</span><button type="button" onClick={() => void setTicketCheckin(participant, false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 hover:bg-white/[.07] hover:text-zinc-300" aria-label="Desfazer check-in"><RotateCcw size={15} /></button></span>
                      ) : (
                        <button type="button" onClick={() => void setTicketCheckin(participant, true).then(ok => ok && toast.success(`Check-in de ${participant.nome} realizado`))} className="shrink-0 rounded-xl bg-white/[.08] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white hover:text-zinc-950"><span className="hidden sm:inline">Fazer </span>check-in</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptyGuests searching={Boolean(search)} />}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {!scannerOpen && totalCount > 0 && (
        <button type="button" onClick={() => setScannerOpen(true)} className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-4 flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-zinc-950 shadow-[0_14px_40px_rgba(0,0,0,.5)] transition hover:scale-[1.02] sm:hidden"><TicketCheck size={18} />Escanear</button>
      )}
    </div>
  );
}
