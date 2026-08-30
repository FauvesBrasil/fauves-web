import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Download, Filter, MoreHorizontal, Search, Settings, SlidersHorizontal, UsersRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchApi } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';

type GuestStatus = 'confirmed' | 'invited' | 'declined' | 'waitlist' | 'pending' | 'checkedin';
type Guest = { id: string; code: string; ticketTypeName: string; userName?: string; userEmail: string; avatarUrl?: string; status: string; guestStatus?: string; createdAt: string; used: boolean };
type EventSummary = { id: string; name: string };

const statusInfo: Record<GuestStatus, { label: string; color: string; background: string }> = {
  confirmed: { label: 'Confirmado(a)', color: '#77d86b', background: 'rgba(74, 181, 69, .15)' },
  invited: { label: 'Convidado(a)', color: '#74a8ff', background: 'rgba(45, 110, 232, .2)' },
  checkedin: { label: 'Check-in realizado', color: '#77d86b', background: 'rgba(74, 181, 69, .15)' },
  declined: { label: 'Não vai', color: '#ff7b72', background: 'rgba(220, 66, 61, .16)' },
  waitlist: { label: 'Na lista de espera', color: '#d6a5ff', background: 'rgba(160, 83, 211, .17)' },
  pending: { label: 'Pendente', color: '#d7b66f', background: 'rgba(196, 145, 51, .16)' },
};

function normalizeStatus(guest: Guest): GuestStatus {
  if (guest.used) return 'checkedin';
  const status = String(guest.guestStatus || guest.status || '').toUpperCase();
  if (status === 'CONFIRMED' || status === 'ISSUED' || status === 'ACTIVE') return 'confirmed';
  if (status === 'DECLINED' || status === 'CANCELED' || status === 'NOT_GOING') return 'declined';
  if (status.includes('WAIT')) return 'waitlist';
  if (status === 'PENDING') return 'pending';
  return 'invited';
}

function guestName(guest: Guest) {
  return String(guest.userName || '').trim() || 'Anônimo';
}

function GuestAvatar({ guest }: { guest: Guest }) {
  if (guest.avatarUrl) return <img src={guest.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />;
  const hue = Array.from(guest.userEmail || guest.id).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
  return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: `linear-gradient(145deg, hsl(${hue} 55% 67%), hsl(${(hue + 26) % 360} 52% 42%))` }}>{guestName(guest).slice(0, 2).toUpperCase()}</span>;
}

export default function IssuedTickets() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = React.useState<EventSummary | null>(null);
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | GuestStatus>('all');
  const [sort, setSort] = React.useState<'created' | 'name' | 'email' | 'status'>('created');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!eventId) return;
    let active = true;
    Promise.all([
      fetchApi(`/api/event/${eventId}`).then(async response => response.ok ? response.json() : null),
      fetchApi(`/api/ticket/event/${eventId}/tickets?limit=2000`).then(async response => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Não foi possível carregar os convidados.');
        return response.json();
      }),
    ]).then(([eventData, guestData]) => {
      if (!active) return;
      setEvent(eventData ? { id: eventData.id, name: eventData.name || eventData.title || 'Evento' } : null);
      setGuests(Array.isArray(guestData?.tickets) ? guestData.tickets : []);
    }).catch((error: unknown) => {
      if (!active) return;
      toast({ title: 'Erro ao carregar a tabela', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, toast]);

  const visibleGuests = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return guests
      .filter(guest => filter === 'all' || normalizeStatus(guest) === filter)
      .filter(guest => !term || `${guest.userName || ''} ${guest.userEmail} ${guest.ticketTypeName || ''}`.toLocaleLowerCase('pt-BR').includes(term))
      .sort((a, b) => {
        if (sort === 'name') return guestName(a).localeCompare(guestName(b), 'pt-BR');
        if (sort === 'email') return a.userEmail.localeCompare(b.userEmail, 'pt-BR');
        if (sort === 'status') return statusInfo[normalizeStatus(a)].label.localeCompare(statusInfo[normalizeStatus(b)].label, 'pt-BR');
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filter, guests, search, sort]);

  const allVisibleSelected = visibleGuests.length > 0 && visibleGuests.every(guest => selected.includes(guest.id));
  const toggleAll = () => setSelected(current => allVisibleSelected
    ? current.filter(id => !visibleGuests.some(guest => guest.id === id))
    : Array.from(new Set([...current, ...visibleGuests.map(guest => guest.id)])));

  const exportCsv = () => {
    const selectedSet = new Set(selected);
    const source = selected.length ? guests.filter(guest => selectedSet.has(guest.id)) : visibleGuests;
    const rows = [['Convidado', 'Email', 'Status', 'Ingresso', 'Cadastrado'], ...source.map(guest => [guestName(guest), guest.userEmail, statusInfo[normalizeStatus(guest)].label, guest.ticketTypeName, new Date(guest.createdAt).toLocaleString('pt-BR')])];
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `convidados-${event?.name || eventId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setActionsOpen(false);
  };

  return <main className="min-h-screen bg-[#151616] text-white">
    <header className="flex min-h-[84px] items-start justify-between px-4 pb-3 pt-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Voltar" onClick={() => navigate(`/event/manage/${eventId}/guests`)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.08] text-white/[.55] hover:text-white sm:hidden"><ArrowLeft size={17} /></button><h1 className="truncate text-[20px] font-semibold tracking-[-.02em] text-white/[.94]">{event?.name || 'Convidados'}</h1></div>
      <button type="button" aria-label="Configurações dos convidados" onClick={() => navigate(`/event/manage/${eventId}/guests`)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.09] text-white/[.6] hover:bg-white/[.14] hover:text-white"><Settings size={16} /></button>
    </header>

    <section className="px-4 pb-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownButton label={filter === 'all' ? 'Todos os Convidados' : statusInfo[filter].label} icon={<Filter size={15} />} open={filterOpen} onClick={() => { setFilterOpen(value => !value); setSortOpen(false); setActionsOpen(false); }}>
            {(['all', 'confirmed', 'invited', 'declined', 'pending', 'waitlist', 'checkedin'] as const).map(value => <MenuButton key={value} checked={filter === value} onClick={() => { setFilter(value); setFilterOpen(false); }}>{value === 'all' ? 'Todos os Convidados' : statusInfo[value].label}</MenuButton>)}
          </DropdownButton>
          <DropdownButton label={{ created: 'Hora de Cadastro', name: 'Nome', email: 'E-mail', status: 'Status' }[sort]} icon={<SlidersHorizontal size={15} />} open={sortOpen} onClick={() => { setSortOpen(value => !value); setFilterOpen(false); setActionsOpen(false); }}>
            {([['created', 'Hora de Cadastro'], ['name', 'Nome'], ['email', 'E-mail'], ['status', 'Status']] as const).map(([value, label]) => <MenuButton key={value} checked={sort === value} onClick={() => { setSort(value); setSortOpen(false); }}>{label}</MenuButton>)}
          </DropdownButton>
        </div>
        <DropdownButton align="right" label={selected.length ? `Ações (${selected.length})` : 'Ações'} icon={<MoreHorizontal size={15} />} open={actionsOpen} onClick={() => { setActionsOpen(value => !value); setFilterOpen(false); setSortOpen(false); }}>
          <button type="button" onClick={exportCsv} className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-semibold text-white/[.86] hover:bg-white/[.08]"><Download size={15} />Baixar CSV{selected.length ? ' selecionado' : ''}</button>
          <button type="button" onClick={() => navigate(`/event/manage/${eventId}/guests`)} className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-semibold text-white/[.86] hover:bg-white/[.08]"><ArrowLeft size={15} />Voltar ao evento</button>
        </DropdownButton>
      </div>
      <label className="mt-3 flex h-9 max-w-[420px] items-center gap-2 rounded-lg border border-white/[.09] bg-white/[.055] px-3 text-white/[.4] focus-within:border-white/[.22]"><Search size={16} /><input value={search} onChange={inputEvent => setSearch(inputEvent.target.value)} placeholder="Buscar convidados" className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-white outline-none placeholder:text-white/[.32]" />{search && <button type="button" aria-label="Limpar busca" onClick={() => setSearch('')}><X size={15} /></button>}</label>
    </section>

    <div className="overflow-x-auto border-t border-white/[.1]">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead><tr className="h-9 border-b border-white/[.1] text-[12px] font-semibold text-white/[.72]"><th className="w-11 border-r border-white/[.1] px-3"><SelectionBox checked={allVisibleSelected} label="Selecionar todos" onClick={toggleAll} /></th><th className="border-r border-white/[.1] px-4">Convidado</th><th className="w-[210px] border-r border-white/[.1] px-4">Status</th><th className="w-[180px] px-4">Cadastrado</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={4} className="h-32 text-center text-[14px] text-white/[.42]">Carregando convidados…</td></tr> : visibleGuests.length ? visibleGuests.map(guest => {
            const info = statusInfo[normalizeStatus(guest)];
            const checked = selected.includes(guest.id);
            return <tr key={guest.id} className={`h-[58px] border-b border-white/[.1] transition hover:bg-white/[.04] ${checked ? 'bg-white/[.035]' : ''}`}>
              <td className="border-r border-white/[.1] px-3"><SelectionBox checked={checked} label={`Selecionar ${guest.userEmail}`} onClick={() => setSelected(current => checked ? current.filter(id => id !== guest.id) : [...current, guest.id])} /></td>
              <td className="border-r border-white/[.1] px-4"><div className="flex min-w-0 items-center gap-3"><GuestAvatar guest={guest} /><div className="min-w-0"><strong className="block truncate text-[14px] font-semibold text-white/[.9]">{guestName(guest)}</strong><span className="block max-w-[360px] truncate text-[12px] text-white/[.54]">{guest.userEmail || 'E-mail não informado'}</span></div></div></td>
              <td className="border-r border-white/[.1] px-4"><span className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ color: info.color, background: info.background }}>{info.label}</span></td>
              <td className="px-4 text-[13px] font-medium text-white/[.54]">{new Date(guest.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>;
          }) : <tr><td colSpan={4} className="h-44 text-center"><UsersRound size={30} className="mx-auto text-white/[.24]" /><p className="mt-2 text-[14px] font-semibold text-white/[.5]">Nenhum convidado encontrado</p></td></tr>}
        </tbody>
      </table>
    </div>
  </main>;
}

function SelectionBox({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className={`grid h-5 w-5 place-items-center rounded-[5px] border ${checked ? 'border-white bg-white text-[#171818]' : 'border-white/[.2]'}`}>{checked && <Check size={13} strokeWidth={3} />}</button>;
}

function DropdownButton({ label, icon, open, onClick, children, align = 'left' }: { label: string; icon: React.ReactNode; open: boolean; onClick: () => void; children: React.ReactNode; align?: 'left' | 'right' }) {
  return <div className="relative"><button type="button" onClick={onClick} className="flex h-8 items-center gap-2 rounded-lg bg-white/[.1] px-3 text-[13px] font-semibold text-white/[.68] hover:text-white">{icon}{label}<ChevronDown size={14} /></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -3, scale: .98 }} className={`absolute top-[calc(100%+6px)] z-30 w-[220px] rounded-lg border border-white/[.1] bg-[#272828] p-1.5 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}>{children}</motion.div>}</AnimatePresence></div>;
}

function MenuButton({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-semibold text-white/[.86] hover:bg-white/[.08]"><span className="w-4">{checked && <Check size={14} />}</span>{children}</button>;
}
