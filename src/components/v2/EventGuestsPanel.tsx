import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  MoreHorizontal,
  Pencil,
  QrCode,
  Search,
  ScanLine,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Ticket,
  UserRoundPen,
  UsersRound,
  X,
} from 'lucide-react';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';

type GuestStatus = 'confirmed' | 'invited' | 'declined' | 'waitlist' | 'pending' | 'checkedin';

type Guest = {
  id: string;
  code: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  ticketTypeName: string;
  status: string;
  guestStatus?: string;
  createdAt: string;
  used: boolean;
  isCourtesy?: boolean;
};

type GuestHistory = {
  ticket?: Guest & { eventName?: string };
  events?: GuestHistoryEvent[];
};

type GuestHistoryEvent = {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
};

type Props = {
  eventId: string;
  eventName?: string;
  onInvite: () => void;
  onGuestListSettings: () => void;
};

const statusInfo: Record<GuestStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmado', color: '#6ddd60', bg: 'rgba(70, 190, 66, .16)' },
  invited: { label: 'Convidado', color: '#76a9ff', bg: 'rgba(47, 119, 246, .16)' },
  checkedin: { label: 'Check-in realizado', color: '#6ddd60', bg: 'rgba(70, 190, 66, .16)' },
  declined: { label: 'Não vai', color: '#ff7b72', bg: 'rgba(248, 81, 73, .14)' },
  waitlist: { label: 'Lista de espera', color: '#d8a8ff', bg: 'rgba(172, 92, 219, .16)' },
  pending: { label: 'Pendente', color: '#d7b66f', bg: 'rgba(205, 151, 52, .15)' },
};

function normalizeStatus(guest: Guest): GuestStatus {
  if (guest.used) return 'checkedin';
  const raw = String(guest.guestStatus || guest.status || '').toUpperCase();
  if (raw === 'ISSUED' || raw === 'CONFIRMED' || raw === 'ACTIVE') return 'confirmed';
  if (raw === 'CANCELED' || raw === 'DECLINED' || raw === 'NOT_GOING') return 'declined';
  if (raw.includes('WAIT')) return 'waitlist';
  if (raw === 'PENDING') return 'pending';
  return 'invited';
}

function firstName(value?: string, email?: string) {
  const clean = (value || '').trim();
  if (clean) return clean.split(/\s+/)[0];
  const emailName = (email || '').split('@')[0];
  return emailName && !/^guest/i.test(emailName) ? emailName : 'Anônimo';
}

function dateLabel(value?: string, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', withTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

function GuestAvatar({ guest, size = 34 }: { guest: Guest; size?: number }) {
  const src = guest.avatarUrl ? resolveImageUrl(guest.avatarUrl) : '';
  if (src) return <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const name = firstName(guest.userName, guest.userEmail);
  const hue = Array.from(guest.userEmail || name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <span className="grid shrink-0 place-items-center rounded-full text-[11px] font-bold text-white/90" style={{ width: size, height: size, background: `linear-gradient(145deg, hsl(${hue} 72% 68%), hsl(${(hue + 24) % 360} 66% 48%))` }}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function IconAction({ label, onClick, children, href }: { label: string; onClick?: () => void; children: React.ReactNode; href?: string }) {
  const className = 'group relative grid h-8 w-8 place-items-center rounded-lg border-0 bg-white/[.08] text-white/[.62] transition-colors duration-200 hover:bg-white/[.08] hover:text-white/[.92]';
  const content = <>{children}<span className="pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 z-30 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-[#151719] opacity-0 shadow-[0_8px_24px_rgba(0,0,0,.28)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-white">{label}</span></>;
  return href ? <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}>{content}</a> : <button type="button" aria-label={label} onClick={onClick} className={className}>{content}</button>;
}

function ActionCard({ variant, icon, title, description, onClick }: { variant: 'blue' | 'emerald' | 'amber'; icon: React.ReactNode; title: string; description?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rich-button flex variant-color-${variant}`}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const glow = event.currentTarget.querySelector('.rich-button-glow-bg') as HTMLElement | null;
        if (glow) {
          const mask = `radial-gradient(160px at ${x}px ${y}px, rgb(255, 255, 255), rgba(255, 255, 255, 0))`;
          glow.style.maskImage = mask;
          glow.style.webkitMaskImage = mask;
        }
      }}
    >
      <div className="underlay" />
      <div className="glow-wrapper"><div className="background rich-button-glow-bg" /></div>
      <div className="overlay" />
      <div className="flex-center animated content flex-1">
        <div className="icon flex-center-center">{icon}</div>
        <div className="flex-1 reduced-line-height text-left">
          <div className="name animated text-ellipses">{title}</div>
          {description && <div className="desc text-ellipses">{description}</div>}
        </div>
      </div>
    </button>
  );
}

export default function EventGuestsPanel({ eventId, eventName, onInvite, onGuestListSettings }: Props) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | GuestStatus>('all');
  const [sort, setSort] = React.useState<'created' | 'name' | 'email' | 'status'>('created');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Guest | null>(null);
  const [history, setHistory] = React.useState<GuestHistory | null>(null);
  const [statusGuest, setStatusGuest] = React.useState<Guest | null>(null);
  const [newStatus, setNewStatus] = React.useState<Exclude<GuestStatus, 'checkedin'>>('confirmed');
  const [notifyGuest, setNotifyGuest] = React.useState(true);
  const [message, setMessage] = React.useState('');
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkEmails, setBulkEmails] = React.useState('');
  const [bulkStatus, setBulkStatus] = React.useState<Exclude<GuestStatus, 'checkedin'>>('confirmed');
  const [timelineMenuId, setTimelineMenuId] = React.useState<string | null>(null);
  const [emailPreview, setEmailPreview] = React.useState<GuestHistoryEvent | null>(null);
  const [checkinPickerOpen, setCheckinPickerOpen] = React.useState(false);

  const loadGuests = React.useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await fetchApi(`/api/ticket/event/${eventId}/tickets?limit=500`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) throw new Error('Falha ao carregar convidados');
      const data = await response.json();
      setGuests(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (error: any) {
      toast({ title: 'Não foi possível carregar os convidados', description: error?.message || 'Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }, [eventId, token, toast]);

  React.useEffect(() => { void loadGuests(); }, [loadGuests]);

  React.useEffect(() => {
    if (!selected) { setHistory(null); return; }
    let active = true;
    fetchApi(`/api/ticket/${selected.id}/history`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (active) setHistory(data); })
      .catch(() => { if (active) setHistory(null); });
    return () => { active = false; };
  }, [selected, token]);

  const visibleGuests = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return guests
      .filter(guest => filter === 'all' || normalizeStatus(guest) === filter)
      .filter(guest => !term || `${guest.userName} ${guest.userEmail} ${guest.ticketTypeName}`.toLocaleLowerCase('pt-BR').includes(term))
      .sort((a, b) => {
        if (sort === 'name') return firstName(a.userName, a.userEmail).localeCompare(firstName(b.userName, b.userEmail), 'pt-BR');
        if (sort === 'email') return a.userEmail.localeCompare(b.userEmail, 'pt-BR');
        if (sort === 'status') return statusInfo[normalizeStatus(a)].label.localeCompare(statusInfo[normalizeStatus(b)].label, 'pt-BR');
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [guests, search, filter, sort]);

  const confirmed = guests.filter(guest => ['confirmed', 'checkedin'].includes(normalizeStatus(guest))).length;
  const invited = guests.filter(guest => ['invited', 'pending', 'waitlist'].includes(normalizeStatus(guest))).length;
  const activeTotal = confirmed + invited;
  const confirmedWidth = activeTotal ? confirmed / activeTotal * 100 : 0;
  const invitedWidth = activeTotal ? invited / activeTotal * 100 : 0;

  const updateGuestStatus = async (guest: Guest, status: Exclude<GuestStatus, 'checkedin'>, notify = false, customMessage = '') => {
    const response = await fetchApi(`/api/ticket/${guest.id}/guest-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status, notify, message: customMessage }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Não foi possível atualizar o status');
  };

  const saveStatus = async () => {
    if (!statusGuest) return;
    setSavingStatus(true);
    try {
      await updateGuestStatus(statusGuest, newStatus, notifyGuest, message);
      await loadGuests();
      const next = { ...statusGuest, guestStatus: newStatus, used: false };
      if (selected?.id === statusGuest.id) setSelected(next);
      setStatusGuest(null);
      toast({ title: 'Status atualizado' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error?.message || 'Tente novamente.' });
    } finally { setSavingStatus(false); }
  };

  const openStatusEditor = (guest: Guest) => {
    const current = normalizeStatus(guest);
    setNewStatus(current === 'checkedin' ? 'confirmed' : current);
    setNotifyGuest(true);
    setMessage('');
    setStatusGuest(guest);
  };

  const saveBulkStatus = async () => {
    const emails = bulkEmails.split(/[\n,;]+/).map(value => value.trim().toLowerCase()).filter(Boolean);
    const targets = guests.filter(guest => emails.includes(guest.userEmail.toLowerCase()));
    if (!emails.length || !targets.length) {
      toast({ title: 'Nenhum convidado correspondente', description: 'Cole os e-mails que já fazem parte deste evento.' });
      return;
    }
    setSavingStatus(true);
    try {
      await Promise.all(targets.map(guest => updateGuestStatus(guest, bulkStatus)));
      await loadGuests();
      setBulkOpen(false);
      setBulkEmails('');
      toast({ title: `${targets.length} status atualizado${targets.length > 1 ? 's' : ''}` });
    } catch (error: any) { toast({ title: 'Erro ao atualizar convidados', description: error?.message }); }
    finally { setSavingStatus(false); }
  };

  const exportCsv = () => {
    const rows = [['Nome', 'E-mail', 'Status', 'Ingresso', 'Check-in', 'Hora de Cadastro'], ...visibleGuests.map(guest => [firstName(guest.userName, guest.userEmail), guest.userEmail, statusInfo[normalizeStatus(guest)].label, guest.ticketTypeName, guest.used ? 'Sim' : 'Não', new Date(guest.createdAt).toLocaleString('pt-BR')])];
    const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `convidados-${eventName || eventId}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const selectedIndex = selected ? visibleGuests.findIndex(guest => guest.id === selected.id) : -1;
  const navigateGuest = (direction: -1 | 1) => {
    if (!visibleGuests.length) return;
    const next = (selectedIndex + direction + visibleGuests.length) % visibleGuests.length;
    setSelected(visibleGuests[next]);
  };

  return (
    <div className="pb-12 text-left">
      <section>
        <h2 className="m-0 text-[20px] font-semibold leading-6 text-white/[.92]">Visão Geral</h2>
        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-2">
          <div className="flex items-baseline gap-1.5 text-[#62d654]"><span className="h-2 w-2 rounded-full bg-current" /><strong className="text-[30px] font-medium leading-none">{confirmed}</strong><span className="text-[16px] font-medium">Confirmado{confirmed === 1 ? '' : 's'}</span></div>
          <div className="flex items-baseline gap-1.5 text-[#74a8ff]"><span className="h-2 w-2 rounded-full bg-current" /><strong className="text-[19px] font-medium leading-none">{invited}</strong><span className="text-[15px] font-medium">Convidado{invited === 1 ? '' : 's'}</span></div>
        </div>
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[.08]">
          <motion.span animate={{ width: `${confirmedWidth}%` }} className="h-full bg-[#58cb4b]" transition={{ duration: .35 }} />
          <motion.span animate={{ width: `${invitedWidth}%` }} className="h-full bg-[#347bf4]" transition={{ duration: .35 }} />
        </div>

        <div className="quick-actions event-guests-actions mt-4" aria-label="Ações rápidas dos convidados" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <ActionCard variant="blue" icon={<Mail size={22} />} title="Convidar Convidados" onClick={onInvite} />
          <ActionCard variant="emerald" icon={<QrCode size={22} />} title="Fazer Check-in dos Convidados" onClick={() => setCheckinPickerOpen(true)} />
          <ActionCard variant="amber" icon={<UsersRound size={22} />} title="Lista de Convidados" description="Exibido para os convidados" onClick={onGuestListSettings} />
        </div>
      </section>

      <section id="guest-list-section" className="mt-8 border-t border-white/[.08] pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="m-0 text-[20px] font-semibold leading-6 text-white/[.92]">Lista de Convidados</h2>
          <div className="flex gap-1.5">
            <IconAction label="Atualizar Status em Massa" onClick={() => setBulkOpen(true)}><UserRoundPen size={16} /></IconAction>
            <IconAction label="Abrir Tabela Completa" href={`/ingressos-emitidos/${eventId}`}><FileSpreadsheet size={16} /></IconAction>
            <IconAction label="Baixar como CSV" onClick={exportCsv}><Download size={16} /></IconAction>
          </div>
        </div>

        <label className="mt-4 flex h-10 items-center gap-2.5 rounded-[10px] border border-white/[.12] bg-transparent px-3 text-white/[.42] transition-colors focus-within:border-white/[.32] focus-within:text-white/[.78]">
          <Search size={18} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar" className="h-full min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-white/[.9] outline-none placeholder:text-white/[.38]" />
          {search && <button type="button" onClick={() => setSearch('')} className="text-white/[.42] hover:text-white/[.9]"><X size={17} /></button>}
        </label>

        <div className="relative z-20 mt-3 flex flex-wrap justify-between gap-2">
          <div className="relative">
            <button type="button" onClick={() => { setFilterOpen(value => !value); setSortOpen(false); }} className="flex h-8 items-center gap-2 rounded-lg border-0 bg-white/[.09] px-3 text-[14px] font-semibold text-white/[.64] hover:text-white/[.92]"><Filter size={15} />{filter === 'all' ? 'Todos os Convidados' : statusInfo[filter].label}<ChevronDown size={14} /></button>
            <AnimatePresence>{filterOpen && <motion.div initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }} className="absolute left-0 top-[calc(100%+7px)] w-[240px] rounded-xl border border-white/[.09] bg-[rgba(31,32,32,.94)] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.4)] backdrop-blur-2xl">
              {(['all', 'confirmed', 'invited', 'declined', 'waitlist', 'checkedin'] as const).map(value => <button key={value} type="button" onClick={() => { setFilter(value); setFilterOpen(false); }} className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[14px] font-medium text-white/[.9] hover:bg-white/[.08]"><span className="w-4">{filter === value && <Check size={15} />}</span><span className="flex-1">{value === 'all' ? 'Todos os Convidados' : statusInfo[value].label}</span>{value !== 'all' && <span className="text-white/[.44]">{guests.filter(guest => normalizeStatus(guest) === value).length}</span>}</button>)}
            </motion.div>}</AnimatePresence>
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setSortOpen(value => !value); setFilterOpen(false); }} className="flex h-8 items-center gap-2 rounded-lg border-0 bg-white/[.09] px-3 text-[14px] font-semibold text-white/[.64] hover:text-white/[.92]"><SlidersHorizontal size={15} />{{ created: 'Hora de Cadastro', name: 'Nome', email: 'E-mail', status: 'Status de Aprovação' }[sort]}<ChevronDown size={14} /></button>
            <AnimatePresence>{sortOpen && <motion.div initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }} className="absolute right-0 top-[calc(100%+7px)] w-[220px] rounded-xl border border-white/[.09] bg-[rgba(31,32,32,.94)] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.4)] backdrop-blur-2xl">
              {([['name', 'Nome'], ['email', 'E-mail'], ['status', 'Status de Aprovação'], ['created', 'Hora de Cadastro']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setSort(value); setSortOpen(false); }} className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[14px] font-medium text-white/[.9] hover:bg-white/[.08]"><span className="w-4">{sort === value && <Check size={15} />}</span>{label}</button>)}
            </motion.div>}</AnimatePresence>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-white/[.1] bg-white/[.045]">
          {loading ? <div className="p-8 text-center text-sm text-white/[.48]">Carregando convidados…</div> : visibleGuests.length ? visibleGuests.map((guest, index) => {
            const info = statusInfo[normalizeStatus(guest)];
            const isConfirmed = ['confirmed', 'checkedin'].includes(normalizeStatus(guest));
            return <div key={guest.id} role="button" tabIndex={0} onClick={() => setSelected(guest)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelected(guest); }} className={`flex min-h-[48px] w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors hover:bg-white/[.04] ${index ? 'border-t border-white/[.08]' : ''}`}>
              <GuestAvatar guest={guest} size={22} />
              <span className="min-w-0 flex-1 truncate text-[16px] leading-none"><strong className={`font-semibold ${isConfirmed ? 'text-white/[.92]' : 'text-white/[.56]'}`}>{firstName(guest.userName, guest.userEmail)}</strong><span className={`ml-2 ${isConfirmed ? 'text-white/[.52]' : 'text-white/[.44]'}`}>{guest.userEmail}</span></span>
              <span className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={event => { event.stopPropagation(); openStatusEditor(guest); }} className="shrink-0 rounded-full px-2 py-1 text-[12px] font-semibold leading-none transition-[filter,transform] hover:brightness-125 active:scale-[.97]" style={{ color: info.color, backgroundColor: info.bg }}>{info.label}</button>
                <span className="hidden shrink-0 text-[14px] font-medium text-white/[.48] sm:block">{dateLabel(guest.createdAt)}</span>
              </span>
            </div>;
          }) : <div className="grid min-h-[150px] place-items-center p-8 text-center"><div><UsersRound className="mx-auto text-white/[.28]" size={34} /><p className="mt-3 text-[15px] font-semibold text-white/[.58]">Nenhum convidado encontrado</p><p className="mt-1 text-[13px] text-white/[.38]">Ajuste a busca ou convide alguém para o evento.</p></div></div>}
        </div>
      </section>

      <Portal><AnimatePresence>
        {selected && <>
          <motion.button aria-label="Fechar detalhes" type="button" onClick={() => setSelected(null)} className="fixed inset-0 z-[10000] cursor-default bg-black/65 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ type: 'spring', stiffness: 400, damping: 36 }} className="fixed bottom-2 right-2 top-2 z-[10001] flex w-[min(560px,calc(100vw-16px))] flex-col overflow-hidden rounded-[10px] border border-white/[.1] bg-[rgba(25,26,26,.94)] shadow-[0_20px_60px_rgba(0,0,0,.42)] backdrop-blur-2xl">
            <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-white/[.09] bg-white/[.025] px-4">
              <ChevronRight className="text-white/[.58]" size={21} /><h3 className="flex-1 text-[16px] font-semibold text-white/[.92]">Detalhes do Convidado</h3>
              <button type="button" onClick={() => navigateGuest(-1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.08] text-white/[.62] transition-colors hover:text-white/[.92]"><ChevronUpIcon /></button>
              <button type="button" onClick={() => navigateGuest(1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.08] text-white/[.62] transition-colors hover:text-white/[.92]"><ChevronDown size={17} /></button>
              <button type="button" onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.08] text-white/[.62] transition-colors hover:text-white/[.92]"><X size={18} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3">
                <GuestAvatar guest={selected} size={44} />
                <div className="min-w-0 flex-1"><h4 className="text-[17px] font-semibold text-white/[.92]">{firstName(selected.userName, selected.userEmail)}</h4><p className="mt-0.5 truncate text-[13px] text-white/[.56]">{selected.userEmail}</p></div>
                <button type="button" onClick={() => openStatusEditor(selected)} className="flex items-center gap-1.5 rounded-lg border border-current px-2.5 py-1.5 text-[12px] font-semibold" style={{ color: statusInfo[normalizeStatus(selected)].color, backgroundColor: statusInfo[normalizeStatus(selected)].bg }}>{statusInfo[normalizeStatus(selected)].label}<Pencil size={13} /></button>
              </div>
              <div className="mt-5"><p className="text-[12px] font-medium text-white/[.46]">Horário de Cadastro</p><p className="mt-1 text-[14px] font-medium text-white/[.88]">{dateLabel(selected.createdAt, true)}</p></div>
              <div className="my-6 h-px bg-white/[.09]" />
              <h4 className="text-[17px] font-semibold text-white/[.92]">Linha do tempo</h4>
              <div className="mt-4">
                {(history?.events?.length ? history.events : [{ id: `created-${selected.id}`, type: 'ISSUED', description: `Nova inscrição para ${eventName || 'seu evento'}`, createdAt: selected.createdAt }]).map((item, index, items) => {
                  const canViewEmail = ['ISSUED', 'EMAIL_SENT', 'RESENT_EMAIL'].includes(item.type);
                  return <div key={item.id} className="relative flex gap-3 pb-5">
                  {index < items.length - 1 && <span className="absolute bottom-0 left-[11px] top-6 w-px bg-white/[.12]" />}
                  <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${item.type === 'CHECKED_IN' ? 'bg-green-500/20 text-green-400' : 'bg-white/[.08] text-white/[.52]'}`}>{item.type === 'CHECKED_IN' ? <Check size={13} /> : canViewEmail ? <Mail size={12} /> : <Ticket size={12} />}</span>
                  <div className="min-w-0 flex-1"><p className={`text-[13px] font-medium ${item.type === 'ISSUED' || item.type === 'CHECKED_IN' ? 'text-white/[.88]' : 'text-white/[.68]'}`}>{item.description || item.type}</p><p className="mt-0.5 text-[12px] text-white/[.44]">{dateLabel(item.createdAt, true)}{item.performedBy ? ` · ${item.performedBy}` : ''}</p></div>
                  {canViewEmail && <div className="group relative">
                    <button type="button" aria-label="Ações" onClick={() => setTimelineMenuId(current => current === item.id ? null : item.id)} className="grid h-7 w-7 place-items-center rounded-md text-white/[.4] transition-colors hover:text-white/[.9]"><MoreHorizontal size={17} /></button>
                    {timelineMenuId !== item.id && <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-[#151719] opacity-0 shadow-[0_8px_24px_rgba(0,0,0,.28)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-white">Ações</span>}
                    <AnimatePresence>{timelineMenuId === item.id && <motion.div initial={{ opacity: 0, y: -4, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -3, scale: .98 }} className="absolute right-0 top-8 z-20 w-[132px] rounded-lg border border-white/[.1] bg-[rgba(35,36,36,.96)] p-1.5 shadow-[0_14px_35px_rgba(0,0,0,.45)] backdrop-blur-xl">
                      <button type="button" onClick={() => { setEmailPreview(item); setTimelineMenuId(null); }} className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-semibold text-white/[.88] transition-colors hover:bg-white/[.09]"><Eye size={17} className="text-white/[.58]" />Ver E-mail</button>
                    </motion.div>}</AnimatePresence>
                  </div>}
                </div>;
                })}
              </div>
            </div>
          </motion.aside>
        </>}
      </AnimatePresence></Portal>

      <Portal><AnimatePresence>{emailPreview && selected && <EmailPreviewModal
        event={emailPreview}
        guest={selected}
        eventName={eventName || history?.ticket?.eventName || 'seu evento'}
        confirmed={confirmed}
        invited={invited}
        onClose={() => setEmailPreview(null)}
      />}</AnimatePresence></Portal>

      <Portal><AnimatePresence>{statusGuest && <ModalShell onClose={() => setStatusGuest(null)} maxWidth={360} showClose={false}>
        <GuestAvatar guest={statusGuest} size={48} />
        <div className="mt-4 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="text-[18px] font-semibold leading-5 text-white/[.94]">{firstName(statusGuest.userName, statusGuest.userEmail)}</h3><p className="mt-1 truncate text-[13px] text-white/[.52]">{statusGuest.userEmail}</p></div>
          <span className="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none" style={{ color: statusInfo[normalizeStatus(statusGuest)].color, backgroundColor: statusInfo[normalizeStatus(statusGuest)].bg }}>{statusInfo[normalizeStatus(statusGuest)].label}</span>
        </div>
        <label className="mt-5 block text-[13px] font-semibold text-white/[.72]">Alterar status para:</label>
        <select value={newStatus} onChange={event => setNewStatus(event.target.value as any)} className="mt-2 h-10 w-full rounded-[10px] border border-white/[.12] bg-[rgba(15,17,17,.72)] px-3 text-[14px] text-white/[.9] outline-none transition-colors focus:border-white/[.32]"><option value="confirmed">Confirmado</option><option value="invited">Convidado</option><option value="declined">Não vai</option><option value="pending">Pendente</option><option value="waitlist">Lista de espera</option></select>
        <label className="mt-4 flex items-center gap-2.5 text-[14px] font-medium text-white/[.88]"><input type="checkbox" checked={notifyGuest} onChange={event => setNotifyGuest(event.target.checked)} className="h-5 w-5 rounded accent-white" />Notificar Convidado</label>
        {notifyGuest && <>
          <textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Adicione uma mensagem personalizada opcional…" className="mt-3 h-20 w-full resize-none rounded-[10px] border border-white/[.12] bg-[rgba(15,17,17,.48)] p-3 text-[13px] leading-5 text-white/[.88] outline-none placeholder:text-white/[.34] focus:border-white/[.32]" />
          <p className="mt-2 text-[12px] leading-[17px] text-white/[.43]">Qualquer mensagem especificada nos e-mails de cadastro também será incluída.</p>
        </>}
        <button type="button" disabled={savingStatus} onClick={saveStatus} className="mt-5 h-10 w-full rounded-[10px] bg-white text-[14px] font-semibold text-[#171919] transition-colors hover:bg-white/[.92] disabled:opacity-50">{savingStatus ? 'Atualizando…' : 'Atualizar Status'}</button>
      </ModalShell>}</AnimatePresence></Portal>

      <Portal><AnimatePresence>{bulkOpen && <ModalShell onClose={() => setBulkOpen(false)}>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[.09] text-white/[.7]"><UsersRound size={28} /></div>
        <h3 className="mt-5 text-[22px] font-semibold text-white/[.92]">Atualizar Convidados</h3><p className="mt-2 text-[15px] leading-6 text-white/[.58]">Cole uma lista de e-mails para atualizar o status em massa.</p>
        <textarea value={bulkEmails} onChange={event => setBulkEmails(event.target.value)} placeholder="um@email.com, outro@email.com" className="mt-5 h-28 w-full resize-none rounded-xl border border-white/[.12] bg-transparent p-3 text-[14px] text-white/[.88] outline-none placeholder:text-white/[.34] focus:border-white/[.32]" />
        <select value={bulkStatus} onChange={event => setBulkStatus(event.target.value as any)} className="mt-3 h-11 w-full rounded-xl border border-white/[.12] bg-[#171919] px-3 text-[15px] text-white/[.9] outline-none"><option value="confirmed">Confirmado</option><option value="invited">Convidado</option><option value="declined">Não vai</option><option value="pending">Pendente</option><option value="waitlist">Lista de espera</option></select>
        <button type="button" disabled={savingStatus} onClick={saveBulkStatus} className="mt-5 h-11 w-full rounded-xl bg-white text-[15px] font-semibold text-[#171919] disabled:opacity-50">{savingStatus ? 'Atualizando…' : 'Atualizar Status'}</button>
      </ModalShell>}</AnimatePresence></Portal>

      <Portal><AnimatePresence>{checkinPickerOpen && (
        <ModalShell onClose={() => setCheckinPickerOpen(false)} maxWidth={500}>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/[.1] text-white/[.78]">
            <ScanLine size={32} strokeWidth={1.8} />
          </div>
          <h3 className="mt-6 pr-8 text-[25px] font-semibold leading-8 text-white/[.96]">Fazer Check-in dos Convidados</h3>
          <p className="mt-3 max-w-[420px] text-[15px] font-medium leading-6 text-white/[.62]">
            Use o scanner web para validar os ingressos pela câmera deste dispositivo. Os aplicativos para iOS e Android chegarão em breve.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setCheckinPickerOpen(false);
                navigate(`/participantes/checkin/${encodeURIComponent(eventId)}`);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 text-[15px] font-bold text-[#171919] transition hover:bg-white/[.9] active:scale-[.99]"
            >
              <ScanLine size={19} />
              Abrir Scanner Web
            </button>

            <button type="button" disabled className="flex min-h-12 w-full cursor-not-allowed items-center justify-between rounded-xl bg-white/[.08] px-4 text-[15px] font-semibold text-white/[.36]">
              <span className="flex items-center gap-2.5"><Apple size={19} />Baixar para iOS</span>
              <span className="rounded-full bg-white/[.08] px-2 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-white/[.4]">Em breve</span>
            </button>

            <button type="button" disabled className="flex min-h-12 w-full cursor-not-allowed items-center justify-between rounded-xl bg-white/[.08] px-4 text-[15px] font-semibold text-white/[.36]">
              <span className="flex items-center gap-2.5"><Smartphone size={19} />Baixar para Android</span>
              <span className="rounded-full bg-white/[.08] px-2 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-white/[.4]">Em breve</span>
            </button>
          </div>
        </ModalShell>
      )}</AnimatePresence></Portal>
    </div>
  );
}

function ChevronUpIcon() { return <ChevronLeft size={19} className="rotate-90" />; }

function Portal({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={`manage-theme-surface ${isDark ? 'dark dark-mode' : 'light'}`}>{children}</div>,
    document.body,
  );
}

function ModalShell({ children, onClose, maxWidth = 420, showClose = true }: { children: React.ReactNode; onClose: () => void; maxWidth?: number; showClose?: boolean }) {
  return <>
    <motion.button aria-label="Fechar" type="button" onClick={onClose} className="fixed inset-0 z-[10010] cursor-default bg-black/70 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <div className="pointer-events-none fixed inset-0 z-[10011] grid place-items-center p-3">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: .985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 7, scale: .985 }}
        transition={{ duration: .18 }}
        className="pointer-events-auto relative w-full rounded-[14px] border border-white/[.09] bg-[rgba(25,26,26,.92)] p-5 text-white/[.9] shadow-[0_18px_48px_rgba(0,0,0,.38)] backdrop-blur-2xl"
        style={{ maxWidth }}
      >
        {showClose && <button type="button" onClick={onClose} className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-white/[.08] text-white/[.58] transition-colors hover:text-white/[.92]"><X size={18} /></button>}
        {children}
      </motion.div>
    </div>
  </>;
}

function EmailPreviewModal({ event, guest, eventName, confirmed, invited, onClose }: {
  event: GuestHistoryEvent;
  guest: Guest;
  eventName: string;
  confirmed: number;
  invited: number;
  onClose: () => void;
}) {
  const name = firstName(guest.userName, guest.userEmail);
  const isRegistrationNotice = event.type === 'ISSUED';
  const subject = isRegistrationNotice ? `Nova inscrição para ${eventName}` : `Inscrição confirmada para ${eventName}`;

  return <>
    <motion.button aria-label="Fechar e-mail" type="button" onClick={onClose} className="fixed inset-0 z-[10020] cursor-default bg-black/75 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <div className="pointer-events-none fixed inset-0 z-[10021] grid place-items-center p-3">
      <motion.article
        initial={{ opacity: 0, y: 10, scale: .985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 7, scale: .985 }}
        transition={{ duration: .18 }}
        className="pointer-events-auto flex max-h-[calc(100vh-24px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-white/[.1] bg-[#1d1e1e] shadow-[0_24px_70px_rgba(0,0,0,.55)]"
      >
        <header className="flex h-[54px] shrink-0 items-center border-b border-white/[.09] bg-white/[.07] px-5">
          <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-white/[.92]">{subject}</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/[.09] text-white/[.62] transition-colors hover:text-white/[.92]"><X size={18} /></button>
        </header>

        <div className="min-h-0 overflow-y-auto bg-[#fafafa] px-6 py-6 text-[#17191a] sm:px-8">
          {isRegistrationNotice ? <>
            <Sparkles size={25} className="text-[#b9bdc1]" fill="currentColor" />
            <div className="mt-8">
              <h4 className="text-[25px] font-semibold leading-none">{name}</h4>
              <p className="mt-2 text-[22px] leading-tight text-[#b9bbbe]">registrado para o seu evento</p>
            </div>
            <div className="my-6 h-px bg-black/[.09]" />
            <p className="text-[16px] leading-6"><span className="font-semibold text-[#9550bd]">{name}</span> se registrou para <strong>{eventName}</strong>.</p>
            <div className="mt-7 text-[16px] leading-7">
              <p>Aqui está a contagem de inscrições até agora:</p>
              <ul className="mt-2 list-disc pl-5"><li><strong>{confirmed}</strong> indo</li><li><strong>{invited}</strong> convidado{invited === 1 ? '' : 's'}</li></ul>
            </div>
            <p className="mt-7 text-[16px] leading-6">Você pode gerenciar o evento na <span className="font-medium text-[#9550bd]">página de gerenciamento de eventos</span> e atualizar suas preferências de notificação em <span className="font-medium text-[#9550bd]">suas configurações</span>.</p>
          </> : <>
            <div className="flex items-center gap-2.5"><GuestAvatar guest={guest} size={24} /><span className="text-[15px] font-semibold text-[#666]">{name}</span></div>
            <p className="mt-6 text-[23px] leading-tight text-[#b9bbbe]">Você se registrou para</p>
            <h4 className="mt-1 text-[26px] font-semibold leading-tight">{eventName}</h4>
            <div className="my-6 h-px bg-black/[.09]" />
            <p className="text-[16px] leading-6">Sua inscrição está confirmada. As informações e atualizações do evento serão enviadas para <strong>{guest.userEmail}</strong>.</p>
            <button type="button" className="mt-7 rounded-lg bg-[#9550bd] px-5 py-3 text-[15px] font-semibold text-white">Página do Evento</button>
          </>}

          <div className="mt-10 border-t border-black/[.09] pt-6 text-[#b7b9bc]">
            <div className="flex items-center justify-between"><span className="text-[21px] font-semibold tracking-tight">fauves<span className="align-top text-[11px]">✦</span></span><span className="text-[13px]">E-mail enviado em {dateLabel(event.createdAt, true)}</span></div>
            <p className="mt-4 text-[12px]">Cancelar inscrição ou gerenciar preferências de notificação</p>
          </div>
        </div>
        <footer className="shrink-0 px-5 py-3 text-[12px] text-white/[.46]">ID de e-mail emsent–{event.id}</footer>
      </motion.article>
    </div>
  </>;
}
