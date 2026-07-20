import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  ChevronsUpDown,
  CircleDollarSign,
  ContactRound,
  Download,
  FilePenLine,
  FileSpreadsheet,
  MoreHorizontal,
  ReceiptText,
  Search,
  Tag,
  SlidersHorizontal,
  Upload,
  UserRoundX,
  UserX,
  UserPlus,
  X,
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';

type CalendarMember = {
  id?: string;
  name?: string;
  email?: string;
  photoUrl?: string | null;
  joinedAt?: string | Date | null;
  tier?: string | null;
  revenue?: number;
  eventsCount?: number;
  checkedInCount?: number;
  events?: Array<{ id?: string; name?: string; image?: string | null; startDate?: string; status?: string; ticketTypeName?: string; ticketQuantity?: number }>;
  payments?: Array<{ id?: string; amount?: number; status?: string; createdAt?: string }>;
  lifecycleStatus?: 'active' | 'canceled' | 'removed';
};

type MembershipTier = {
  name: string;
  color: string;
};

type Props = {
  isPersonal: boolean;
  members: CalendarMember[];
  tiers: MembershipTier[];
  onCreateTier: () => void;
  onAddMembers: (members: CalendarMember[]) => void;
  onRemoveMember: (member: CalendarMember) => void;
  onBlockMember: (member: CalendarMember) => void;
  managedTags: ManagedPersonTag[];
  onCreateManagedTag: (name: string, color: string) => Promise<ManagedPersonTag>;
  onSetManagedTagAssignment: (tag: ManagedPersonTag, targetId: string, assigned: boolean) => Promise<unknown>;
};

type ManagedPersonTag = {
  id: string;
  type: 'event' | 'member';
  name: string;
  color: string;
  assignments: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

type PersonTag = ManagedPersonTag;

const formatJoinedAt = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const currentYear = new Date().getFullYear();
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() === currentYear ? {} : { year: 'numeric' }),
  }).format(date);
};

const isConfirmedEventStatus = (status: unknown) => /CONFIRM|PAID|APPROV|RESERV|ISSUED|USED|CHECKED/i.test(String(status || ''));
const personKey = (member: CalendarMember) => String(member.email || member.id || '').toLowerCase();
const TAG_PALETTE = [
  { name: 'Vermelho', color: '#ff6b6b' },
  { name: 'Cranberry', color: '#f28fbd' },
  { name: 'Laranja', color: '#ff9d76' },
  { name: 'Amarelo', color: '#f5ca6c' },
  { name: 'Verde', color: '#69d36f' },
  { name: 'Azul', color: '#6ea8f7' },
  { name: 'Roxo', color: '#a98af5' },
  { name: 'Barney', color: '#c76ef2' },
];

const HourglassPeople = () => (
  <svg width="158" height="158" viewBox="0 0 158 158" fill="none" aria-hidden="true">
    <path d="M37 30h84c0 30-13 38-35 50 22 12 35 22 35 49H37c0-27 13-37 35-49-22-12-35-20-35-50Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
    <path d="M45 36c14 17 54 18 68 0M45 123c15-16 53-16 68 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="61" cy="51" r="10" fill="currentColor" opacity=".75" />
    <circle cx="82" cy="55" r="11" fill="currentColor" opacity=".7" />
    <circle cx="101" cy="49" r="9" fill="currentColor" opacity=".68" />
    <circle cx="74" cy="68" r="10" fill="currentColor" opacity=".72" />
    <circle cx="94" cy="69" r="10" fill="currentColor" opacity=".72" />
  </svg>
);

const PeopleModal = ({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) => (
  <motion.div
    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    onMouseDown={onClose}
  >
    <motion.div
      className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[18px] border border-white/[0.06] bg-[#191a1b] p-5 text-white shadow-2xl ${wide ? 'max-w-[480px]' : 'max-w-[342px]'}`}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.975, y: 7 }}
      transition={{ type: 'spring', damping: 27, stiffness: 330 }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

const PersonDetailsPanel = ({ member, tags, availableTags, onToggleTag, onCreateTag, onClose, onPrev, onNext, onRemove, onBlock, hasPrev, hasNext }: { member: CalendarMember; tags: PersonTag[]; availableTags: PersonTag[]; onToggleTag: (tag: PersonTag, assigned: boolean) => Promise<unknown>; onCreateTag: (name: string, color: string) => Promise<unknown>; onClose: () => void; onPrev: () => void; onNext: () => void; onRemove: () => void; onBlock: () => void; hasPrev: boolean; hasNext: boolean }) => {
  const events = member.events || [];
  const payments = member.payments || [];
  const firstSeen = formatJoinedAt(member.joinedAt);
  const revenue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(member.revenue || 0));
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [tagStep, setTagStep] = React.useState<'name' | 'color' | null>(null);
  const [tagName, setTagName] = React.useState('');
  const [tagSaving, setTagSaving] = React.useState(false);
  const [tagError, setTagError] = React.useState('');
  const [eventFilterOpen, setEventFilterOpen] = React.useState(false);
  const [eventFilter, setEventFilter] = React.useState('Todos os Eventos');
  const [expandedEvents, setExpandedEvents] = React.useState(false);
  const detailActionsRef = React.useRef<HTMLDivElement>(null);
  const tagMenuRef = React.useRef<HTMLDivElement>(null);
  const eventFilterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setActionsOpen(false);
    setTagStep(null);
    setTagName('');
    setTagSaving(false);
    setTagError('');
    setEventFilterOpen(false);
    setEventFilter('Todos os Eventos');
    setExpandedEvents(false);
  }, [member.id, member.email]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!detailActionsRef.current?.contains(target)) setActionsOpen(false);
      if (!tagMenuRef.current?.contains(target)) {
        setTagStep(null);
        setTagName('');
      }
      if (!eventFilterRef.current?.contains(target)) setEventFilterOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActionsOpen(false);
      setTagStep(null);
      setTagName('');
      setEventFilterOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const statusLabel = (status: unknown) => {
    const raw = String(status || '');
    if (/CANCEL|DECLIN|REFUND/i.test(raw)) return 'Não vai';
    if (/WAIT/i.test(raw)) return 'Na lista de espera';
    if (/PEND/i.test(raw)) return 'Pendente';
    if (/INVIT/i.test(raw)) return 'Convidado';
    return isConfirmedEventStatus(raw) ? 'Confirmado' : 'Não vai';
  };
  const visibleEvents = events.filter((event) => eventFilter === 'Todos os Eventos' || statusLabel(event.status) === eventFilter);
  const assignedTagIds = new Set(tags.map((tag) => tag.id));
  const matchingAvailableTags = availableTags.filter((tag) =>
    !assignedTagIds.has(tag.id) &&
    (!tagName.trim() || tag.name.toLocaleLowerCase('pt-BR').includes(tagName.trim().toLocaleLowerCase('pt-BR'))),
  );
  const hasExactTagName = availableTags.some((tag) =>
    tag.name.toLocaleLowerCase('pt-BR') === tagName.trim().toLocaleLowerCase('pt-BR'),
  );

  const handleToggleTag = async (tag: PersonTag, assigned: boolean) => {
    if (tagSaving) return;
    setTagSaving(true);
    setTagError('');
    try {
      await onToggleTag(tag, assigned);
      if (assigned) {
        setTagStep(null);
        setTagName('');
      }
    } catch (error: unknown) {
      setTagError(error instanceof Error ? error.message : 'Não foi possível atualizar a tag.');
    } finally {
      setTagSaving(false);
    }
  };

  const handleCreateTag = async (color: string) => {
    if (tagSaving || !tagName.trim()) return;
    setTagSaving(true);
    setTagError('');
    try {
      await onCreateTag(tagName.trim(), color);
      setTagStep(null);
      setTagName('');
    } catch (error: unknown) {
      setTagError(error instanceof Error ? error.message : 'Não foi possível criar a tag.');
    } finally {
      setTagSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[100000] bg-black/55 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={onClose}>
      <motion.aside
        className="absolute bottom-3 right-3 top-3 flex w-[min(552px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#191a1b] text-white shadow-2xl"
        initial={{ x: '105%' }}
        animate={{ x: 0 }}
        exit={{ x: '105%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-4"><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="flex border-0 bg-transparent p-0 text-zinc-400 hover:text-white"><ChevronsRight size={20} /></button><h2 className="text-base font-bold">Detalhes da pessoa</h2></div>
          <div className="flex gap-1"><button type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Pessoa anterior" className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-white/[0.08] text-zinc-300 disabled:text-zinc-600"><ChevronUp size={16} /></button><button type="button" onClick={onNext} disabled={!hasNext} aria-label="Próxima pessoa" className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-white/[0.10] text-zinc-300 disabled:text-zinc-600"><ChevronDown size={16} /></button></div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {member.photoUrl ? <img src={member.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-400 text-sm font-bold text-zinc-900">{(member.name || '?').charAt(0).toUpperCase()}</span>}
              <div className="min-w-0"><h3 className="truncate text-base font-bold">{member.name || 'Anônimo'}</h3><p className="truncate text-sm font-semibold text-zinc-400">{member.email}</p></div>
            </div>
            <div ref={detailActionsRef} className="group relative">
              <button type="button" onClick={() => setActionsOpen((open) => !open)} className="flex h-7 w-7 items-center justify-center rounded-lg border-0 bg-white/[0.08] text-zinc-400 transition-colors hover:bg-white/[0.14] hover:text-white"><MoreHorizontal size={16} /></button>
              {!actionsOpen && <span className="pointer-events-none absolute bottom-full right-0 mb-2 translate-y-1 scale-95 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 opacity-0 shadow-xl transition-[opacity,transform] duration-150 after:absolute after:right-2 after:top-full after:border-[5px] after:border-transparent after:border-t-white group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">Ações</span>}
              <AnimatePresence>
                {actionsOpen && <motion.div initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="fauves-floating-surface absolute right-0 top-9 z-40 w-[164px] origin-top-right rounded-xl border p-1.5">
                  <button type="button" onClick={onRemove} className="flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/[0.07]"><UserRoundX size={16} className="text-zinc-400" /> Remover Usuário</button>
                  <button type="button" onClick={onBlock} className="flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/[0.07]"><UserX size={16} className="text-zinc-400" /> Bloquear Usuário</button>
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 divide-x divide-white/10 text-left">
            <div className="pr-3"><span className="text-xs font-semibold text-zinc-500">Visto pela primeira vez</span><strong className="mt-0.5 block text-base">{firstSeen || '—'}</strong></div>
            <div className="px-3"><span className="text-xs font-semibold text-zinc-500">Eventos Participados</span><strong className="mt-0.5 block text-base">{member.eventsCount ?? events.length}</strong></div>
            <div className="pl-3"><span className="text-xs font-semibold text-zinc-500">Receita</span><strong className="mt-0.5 block text-base">{revenue}</strong></div>
          </div>

          <div ref={tagMenuRef} className="relative mb-5 flex min-h-7 flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => { setTagStep((step) => step ? null : 'name'); setTagName(''); }} className="inline-flex h-7 items-center gap-1 rounded-full border-0 bg-white/[0.09] px-3 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.14] hover:text-white">+ Adicionar Tag</button>
            {tags.map((tag) => <span key={tag.id} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold" style={{ color: tag.color, background: `${tag.color}20` }}>{tag.name}<button type="button" disabled={tagSaving} onClick={() => void handleToggleTag(tag, false)} className="border-0 bg-transparent p-0 text-current opacity-70 hover:opacity-100 disabled:opacity-30"><X size={13} /></button></span>)}
            <AnimatePresence mode="wait">
              {tagStep === 'name' && <motion.div key="tag-name" initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="fauves-floating-surface absolute left-0 top-8 z-30 w-[222px] origin-top-left rounded-lg border p-1">
                <input autoFocus value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Adicionar nova tag" className="h-9 w-full rounded-md border-0 bg-white/[0.08] px-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-500" />
                {matchingAvailableTags.slice(0, 6).map((tag) => <button key={tag.id} type="button" disabled={tagSaving} onClick={() => void handleToggleTag(tag, true)} className="mt-1 flex h-9 w-full items-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-semibold text-white hover:bg-white/[0.08] disabled:opacity-40"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}</button>)}
                {tagName.trim() && !hasExactTagName && <button type="button" disabled={tagSaving} onClick={() => setTagStep('color')} className="mt-1 flex h-9 w-full items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.06] px-3 text-sm font-semibold text-white hover:bg-white/[0.1] disabled:opacity-40"><span className="text-xl font-light text-zinc-400">+</span> Criar &quot;{tagName.trim()}&quot;</button>}
                {!tagName.trim() && !matchingAvailableTags.length && <p className="px-3 py-2 text-xs font-semibold text-zinc-500">Nenhuma tag disponível.</p>}
                {tagError && <p className="px-3 py-2 text-xs font-semibold text-red-400">{tagError}</p>}
              </motion.div>}
              {tagStep === 'color' && <motion.div key="tag-color" initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="fauves-floating-surface absolute left-0 top-8 z-30 w-[222px] origin-top-left rounded-lg border p-1">
                <p className="px-3 py-2 text-sm font-semibold text-zinc-500">Escolha a cor da tag</p>
                {TAG_PALETTE.map((color) => <button key={color.name} type="button" disabled={tagSaving} onClick={() => void handleCreateTag(color.color)} className="flex h-8 w-full items-center gap-3 rounded-md border-0 bg-transparent px-3 text-sm font-semibold text-white hover:bg-white/[0.08] disabled:opacity-40"><span className="h-2 w-2 rounded-full" style={{ background: color.color }} />{color.name}</button>)}
                {tagError && <p className="px-3 py-2 text-xs font-semibold text-red-400">{tagError}</p>}
              </motion.div>}
            </AnimatePresence>
          </div>
          <div className="mb-5 h-px bg-white/10" />

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Eventos</h3>
            <div className="flex gap-1.5">
              <div ref={eventFilterRef} className="relative">
                <button type="button" onClick={() => setEventFilterOpen((open) => !open)} className="inline-flex h-8 items-center gap-1 rounded-lg border-0 bg-white/[0.09] px-3 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.14] hover:text-white">{eventFilter} <ChevronDown size={14} /></button>
                <AnimatePresence>{eventFilterOpen && <motion.div initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="fauves-floating-surface absolute right-0 top-10 z-30 w-[168px] origin-top-right rounded-lg border p-1">
                  {['Todos os Eventos', 'Confirmado', 'Convidado', 'Pendente', 'Na lista de espera', 'Não vai'].map((option) => <button key={option} type="button" onClick={() => { setEventFilter(option); setEventFilterOpen(false); }} className="flex h-9 w-full items-center gap-2 rounded-md border-0 bg-transparent px-2.5 text-left text-sm font-semibold text-white hover:bg-white/[0.08]"><span className="w-4">{eventFilter === option && <Check size={14} />}</span>{option}</button>)}
                </motion.div>}</AnimatePresence>
              </div>
              <span className="group relative">
                <button type="button" onClick={() => setExpandedEvents((expanded) => !expanded)} className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-white/[0.09] text-zinc-400 transition-colors hover:bg-white/[0.14] hover:text-white"><ChevronsUpDown size={14} /></button>
                <span className="pointer-events-none absolute bottom-full right-0 mb-2 translate-y-1 scale-95 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 opacity-0 shadow-xl transition-[opacity,transform] duration-150 after:absolute after:right-2 after:top-full after:border-[5px] after:border-transparent after:border-t-white group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">{expandedEvents ? 'Recolher' : 'Expandir'}</span>
              </span>
            </div>
          </div>
          {visibleEvents.length ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.055]">
              {visibleEvents.map((event, index) => (
                <div key={event.id || index} className="border-b border-white/10 px-4 py-2 last:border-b-0">
                  <div className="flex min-h-[50px] items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {event.image ? <img src={resolveImageUrl(event.image) || ''} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-zinc-700" />}
                      <div className="min-w-0"><p className="truncate text-base font-bold">{event.name || 'Evento'}</p><p className="text-sm font-semibold text-zinc-500">{event.startDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.startDate)) : ''}</p></div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusLabel(event.status) === 'Confirmado' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-zinc-400'}`}>{statusLabel(event.status)}</span>
                  </div>
                  <AnimatePresence initial={false}>{expandedEvents && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"><div className="pb-2 pt-1 text-sm"><span className="block font-semibold text-zinc-500">Ingresso</span><strong className="text-zinc-300">{event.ticketQuantity || 1}× {event.ticketTypeName || 'Standard'}</strong></div></motion.div>}</AnimatePresence>
                </div>
              ))}
            </div>
          ) : <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm font-semibold text-zinc-500">Nenhum evento associado a esta pessoa.</p>}

          <h3 className="mb-3 text-lg font-bold">Pagamentos</h3>
          {payments.length ? (
            <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.055]">{payments.map((payment, index) => <div key={payment.id || index} className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0"><div className="flex items-center gap-3"><CircleDollarSign className="text-zinc-500" size={20} /><span className="text-sm font-semibold">{payment.createdAt ? formatJoinedAt(payment.createdAt) : 'Pagamento'}</span></div><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(payment.amount || 0))}</strong></div>)}</div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.10] bg-white/[0.055] px-4 py-4 text-zinc-500"><ReceiptText size={27} /><div><h4 className="font-bold">Nenhum Pagamento</h4><p className="text-sm font-semibold">Não há transações associadas a este membro.</p></div></div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
};

export function CalendarPeoplePanel({ isPersonal, members, tiers, onCreateTier, onAddMembers, onRemoveMember, onBlockMember, managedTags, onCreateManagedTag, onSetManagedTagAssignment }: Props) {
  const [query, setQuery] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<'recent' | 'name' | 'revenue' | 'events' | 'checkin'>('recent');
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [addStep, setAddStep] = React.useState<'choose' | 'csv' | 'manual' | 'preview' | null>(null);
  const [manualEmail, setManualEmail] = React.useState('');
  const [manualName, setManualName] = React.useState('');
  const [pendingMembers, setPendingMembers] = React.useState<CalendarMember[]>([]);
  const [csvFileName, setCsvFileName] = React.useState('');
  const [selectedMember, setSelectedMember] = React.useState<CalendarMember | null>(null);
  const [peopleView, setPeopleView] = React.useState<'all' | 'canceled' | 'removed'>('all');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const peopleActionsRef = React.useRef<HTMLDivElement>(null);
  const peopleFilterRef = React.useRef<HTMLDivElement>(null);
  const peopleSortRef = React.useRef<HTMLDivElement>(null);
  const allTags = React.useMemo(
    () => managedTags.filter((tag) => tag.type === 'member'),
    [managedTags],
  );
  const personTags = React.useMemo(() => {
    const byPerson: Record<string, PersonTag[]> = {};
    allTags.forEach((tag) => {
      (tag.assignments || []).forEach((key) => {
        const normalizedKey = String(key || '').trim().toLocaleLowerCase('pt-BR');
        if (!normalizedKey) return;
        byPerson[normalizedKey] = [...(byPerson[normalizedKey] || []), tag];
      });
    });
    return byPerson;
  }, [allTags]);

  React.useEffect(() => {
    if (!addStep && !selectedMember) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedMember) setSelectedMember(null);
      else closeAddModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addStep, selectedMember]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!peopleActionsRef.current?.contains(target)) setActionsOpen(false);
      if (!peopleFilterRef.current?.contains(target)) setFilterOpen(false);
      if (!peopleSortRef.current?.contains(target)) setSortOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActionsOpen(false);
      setFilterOpen(false);
      setSortOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const visibleMembers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return members
      .filter((member) => {
        const searchable = `${member.name || ''} ${member.email || ''}`.toLocaleLowerCase('pt-BR');
        const matchesView = peopleView === 'all' || member.lifecycleStatus === peopleView;
        const matchesTag = !tagFilter || (personTags[personKey(member)] || []).some((tag) => tag.name === tagFilter);
        return matchesView && matchesTag && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === 'name') return (a.name || '').localeCompare(b.name || '', 'pt-BR');
        if (sort === 'revenue') return Number(b.revenue || 0) - Number(a.revenue || 0);
        if (sort === 'events') return Number(b.eventsCount || b.events?.length || 0) - Number(a.eventsCount || a.events?.length || 0);
        if (sort === 'checkin') return Number(b.checkedInCount || 0) - Number(a.checkedInCount || 0);
        return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
      });
  }, [members, peopleView, personTags, query, sort, tagFilter]);

  const exportCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = members.map((member) => [member.name, member.email, member.tier, member.joinedAt].map(escape).join(','));
    const blob = new Blob([['Nome,Email,Assinatura,Data de adesão', ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pessoas-do-calendario.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const blob = new Blob(['email,nome\ncontato@exemplo.com,Nome do contato'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-pessoas-fauves.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return [];
    const separator = lines[0].includes(';') ? ';' : ',';
    const firstRow = lines[0].split(separator).map((value) => value.trim().toLowerCase());
    const hasHeader = firstRow.some((value) => value.includes('email') || value.includes('e-mail'));
    const emailIndex = hasHeader ? Math.max(0, firstRow.findIndex((value) => value.includes('email') || value.includes('e-mail'))) : 0;
    const nameIndex = hasHeader ? firstRow.findIndex((value) => value.includes('nome') || value.includes('name')) : 1;
    return lines.slice(hasHeader ? 1 : 0).map((line, index) => {
      const columns = line.split(separator).map((value) => value.trim().replace(/^"|"$/g, ''));
      return { id: `csv-${Date.now()}-${index}`, email: columns[emailIndex], name: nameIndex >= 0 ? columns[nameIndex] : '', joinedAt: new Date().toISOString() };
    }).filter((person) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email || ''));
  };

  const prepareManualPreview = () => {
    const emails = manualEmail.split(/[\s,;]+/).map((email) => email.trim()).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    const preview = emails.map((email, index) => ({
      id: `manual-${Date.now()}-${index}`,
      email,
      name: emails.length === 1 ? manualName.trim() : '',
      joinedAt: new Date().toISOString(),
    }));
    setPendingMembers(preview);
    if (preview.length) setAddStep('preview');
  };

  const closeAddModal = () => {
    setAddStep(null);
    setManualEmail('');
    setManualName('');
    setPendingMembers([]);
    setCsvFileName('');
  };

  const selectedIndex = selectedMember ? visibleMembers.findIndex((member) => (member.id || member.email) === (selectedMember.id || selectedMember.email)) : -1;
  const manualInputIsValid = manualEmail.split(/[\s,;]+/).some((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  const controlClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border-0 bg-white/[0.09] px-3 text-sm font-semibold text-zinc-400 transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/[0.14] hover:text-white active:scale-[0.97]';

  return (
    <div className="space-y-0 text-left">
      {!isPersonal && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white">Assinaturas</h2>
            <button type="button" onClick={onCreateTier} className={controlClass}>+ Criar</button>
          </div>

          <div className="flex min-h-[126px] flex-col justify-between gap-5 rounded-xl border border-dashed border-white/[0.14] px-[18px] py-[15px] md:flex-row md:items-start">
            <div className="max-w-[325px]">
              <h3 className="mb-0.5 text-base font-bold text-zinc-400">Memberships</h3>
              <p className="m-0 text-base font-semibold leading-6 text-zinc-500">Ofereça eventos e tipos de ingressos exclusivos para membros, configure níveis e venda assinaturas.</p>
            </div>
            <div className="flex max-w-[330px] flex-wrap justify-start gap-1.5 md:justify-end">
              {tiers.map((tier) => (
                <span key={tier.name} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold" style={{ color: tier.color, background: `${tier.color}22` }}>
                  <Award size={13} fill="currentColor" /> {tier.name}
                </span>
              ))}
            </div>
          </div>
          <div className="my-8 h-px bg-white/[0.10]" />
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white">
            Pessoas{members.length > 0 ? ` (${members.length})` : ''}
          </h2>
          <div ref={peopleActionsRef} className="relative flex items-center gap-1.5">
            <button type="button" onClick={() => { setActionsOpen(false); setAddStep('choose'); }} className={controlClass}><UserPlus size={15} /> Adicionar Pessoas</button>
            <span className="group relative">
              <button type="button" onClick={() => { setActionsOpen(false); exportCsv(); }} aria-label="Baixar como CSV" className={`${controlClass} w-9 px-0`}><Download size={16} /></button>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 opacity-0 shadow-xl transition-[opacity,transform] duration-150 ease-out after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-white group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">Baixar como CSV</span>
            </span>
            <span className="group relative">
              <button type="button" onClick={() => setActionsOpen((open) => !open)} aria-label="Ações" className={`${controlClass} w-9 px-0`}><MoreHorizontal size={18} /></button>
              {!actionsOpen && <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 opacity-0 shadow-xl transition-[opacity,transform] duration-150 ease-out after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-white group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">Ações</span>}
            </span>
            <AnimatePresence>
            {actionsOpen && (
              <motion.div
                className="fauves-floating-surface absolute right-0 top-11 z-40 w-[264px] origin-top-right rounded-xl border p-2"
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                <button type="button" onClick={() => { setPeopleView('canceled'); setActionsOpen(false); }} className="flex w-full items-start gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold leading-5 text-white hover:bg-white/[0.07]"><UserRoundX size={18} className="mt-0.5 text-zinc-400" /> Pessoas que cancelaram a inscrição</button>
                <button type="button" onClick={() => { setPeopleView('removed'); setActionsOpen(false); }} className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-white/[0.07]"><Ban size={18} className="text-zinc-400" /> Removido pelo Administrador</button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" className="h-10 w-full rounded-lg border border-white/[0.13] bg-transparent pl-10 pr-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-white/30" />
        </div>

        {peopleView !== 'all' && <button type="button" onClick={() => setPeopleView('all')} className="mb-2 inline-flex h-8 items-center gap-2 rounded-lg border-0 bg-white/[0.09] px-3 text-sm font-semibold text-zinc-300"><X size={13} /> {peopleView === 'canceled' ? 'Cancelaram a inscrição' : 'Removidos pelo administrador'}</button>}

        <div className="relative mb-2 flex items-start justify-between">
          <div ref={peopleFilterRef} className="relative">
            <button type="button" onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }} className={controlClass}>
              <SlidersHorizontal size={14} /> {tagFilter || 'Filtrar'} <ChevronDown size={13} />
            </button>
            <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="fauves-floating-surface absolute left-0 top-11 z-30 min-w-[210px] origin-top-left rounded-lg border p-1"
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                <button type="button" onClick={() => { setTagFilter(null); setFilterOpen(false); }} className="flex h-9 w-full items-center gap-2 rounded-md bg-transparent px-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/10"><ContactRound size={15} className="text-zinc-500" /><span className="flex-1">Todos</span>{!tagFilter && <Check size={14} />}</button>
                {allTags.length > 0 && <p className="px-3 pb-1 pt-2 text-xs font-semibold text-zinc-500">Tags</p>}
                {allTags.map((tag) => <button key={tag.name} type="button" onClick={() => { setTagFilter(tag.name); setFilterOpen(false); }} className="flex h-9 w-full items-center gap-3 rounded-md bg-transparent px-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/10"><span className="h-2 w-2 rounded-full" style={{ background: tag.color }} /><span className="flex-1">{tag.name}</span>{tagFilter === tag.name && <Check size={14} />}</button>)}
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div ref={peopleSortRef} className="relative">
            <button type="button" onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }} className={controlClass}>
              <SlidersHorizontal size={14} /> {{ recent: 'Entrou recentemente', name: 'Nome', revenue: 'Receita', events: 'Eventos Cadastrados', checkin: 'Eventos com Check-in' }[sort]} <ChevronDown size={13} />
            </button>
            <AnimatePresence>
            {sortOpen && (
              <motion.div
                className="fauves-floating-surface absolute right-0 top-11 z-30 min-w-[210px] origin-top-right rounded-lg border p-1"
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {([
                  ['name', 'Nome'],
                  ['recent', 'Entrou recentemente'],
                  ['revenue', 'Receita'],
                  ['events', 'Eventos Cadastrados'],
                  ['checkin', 'Eventos com Check-in'],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => { setSort(value); setSortOpen(false); }} className="flex w-full items-center gap-2 rounded-md bg-transparent px-3 py-2 text-left text-sm font-semibold text-zinc-100 hover:bg-white/10">
                    <span className="w-4">{sort === value && <Check size={14} />}</span>{label}
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        {visibleMembers.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.055]">
            {visibleMembers.map((member, index) => (
              <button type="button" key={member.id || member.email || index} onClick={() => setSelectedMember(member)} className="flex min-h-[50px] w-full items-center justify-between gap-4 border-0 border-b border-solid border-white/[0.09] bg-transparent px-4 py-2.5 text-left last:border-b-0 hover:bg-white/[0.035]">
                <div className="flex min-w-0 items-center gap-3">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">{(member.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                  <p className="min-w-0 truncate text-base font-bold text-white">
                    {member.name || 'Anônimo'} {(personTags[personKey(member)] || [])[0] && <span className="mx-1 inline-block h-2 w-2 rounded-full" style={{ background: personTags[personKey(member)][0].color }} />}<span className="font-semibold text-zinc-500">{member.email}</span>
                  </p>
                </div>
                <time className="shrink-0 text-sm font-semibold text-zinc-500">{formatJoinedAt(member.joinedAt)}</time>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[345px] flex-col items-center justify-center px-4 pb-5 pt-12 text-center text-zinc-600">
            <HourglassPeople />
            <h3 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-zinc-500">Nenhum Contato</h3>
            <p className="mt-1 max-w-[570px] text-base font-semibold text-zinc-500">Quando pessoas forem adicionadas ao seu calendário, elas aparecerão aqui.</p>
          </div>
        )}
      </section>

      <AnimatePresence mode="wait">
      {addStep === 'choose' && (
        <PeopleModal key="add-choose" onClose={closeAddModal} wide>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.09] text-zinc-300"><ContactRound size={26} /></div>
            <button onClick={closeAddModal} aria-label="Fechar" className="flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400 hover:text-white"><X size={15} /></button>
          </div>
          <h2 className="text-[21px] font-bold tracking-tight">Adicionar Pessoas</h2>
          <p className="mb-4 mt-1 text-sm font-semibold text-zinc-400">Importe seus contatos para o seu calendário.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAddStep('csv')} className="min-h-[112px] rounded-lg border border-white/[0.12] bg-white/[0.055] p-3 text-left text-white hover:bg-white/[0.09]">
              <FileSpreadsheet size={29} className="mb-3 text-zinc-400" /><strong className="block text-base">Importar CSV</strong><span className="text-sm font-semibold text-zinc-500">Importar de outros serviços</span>
            </button>
            <button type="button" onClick={() => setAddStep('manual')} className="min-h-[112px] rounded-lg border border-white/[0.12] bg-white/[0.055] p-3 text-left text-white hover:bg-white/[0.09]">
              <FilePenLine size={29} className="mb-3 text-zinc-400" /><strong className="block text-base">Inserir Manualmente</strong><span className="text-sm font-semibold text-zinc-500">Cole uma lista de e-mails</span>
            </button>
          </div>
        </PeopleModal>
      )}

      {addStep === 'csv' && (
        <PeopleModal key="add-csv" onClose={closeAddModal} wide>
          <div className="relative mb-5 flex items-center justify-center">
            <button onClick={() => setAddStep('choose')} aria-label="Voltar" className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><ArrowLeft size={15} /></button>
            <h2 className="text-base font-bold">Adicionar Pessoas</h2>
            <button onClick={closeAddModal} aria-label="Fechar" className="absolute right-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><X size={15} /></button>
          </div>
          <button type="button" onClick={downloadTemplate} className="mb-4 flex items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-zinc-400 hover:text-white"><Download size={15} /> Baixar Template CSV</button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setCsvFileName(file.name);
            file.text().then((text) => setPendingMembers(parseCsv(text)));
          }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (!file) return;
            setCsvFileName(file.name);
            file.text().then((text) => setPendingMembers(parseCsv(text)));
          }} className="flex h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.14] bg-white/[0.055] text-zinc-400 hover:bg-white/[0.08]">
            <FileSpreadsheet size={31} className="mb-3" /><strong className="text-base text-zinc-300">{csvFileName || 'Importar Arquivo CSV'}</strong><span className="mt-1 text-sm font-semibold">{csvFileName ? `${pendingMembers.length} contato(s) encontrado(s)` : 'Solte o arquivo ou clique aqui para escolher o arquivo.'}</span>
          </button>
          <button type="button" disabled={!pendingMembers.length} onClick={() => setAddStep('preview')} className={`mt-4 h-10 w-full rounded-lg border-0 text-base font-medium ${pendingMembers.length ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'cursor-not-allowed bg-zinc-400 text-zinc-800'}`}>Visualizar</button>
        </PeopleModal>
      )}

      {addStep === 'manual' && (
        <PeopleModal key="add-manual" onClose={closeAddModal} wide>
          <div className="relative mb-5 flex items-center justify-center">
            <button onClick={() => setAddStep('choose')} aria-label="Voltar" className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><ArrowLeft size={15} /></button>
            <h2 className="text-base font-bold">Adicionar Pessoas</h2>
            <button onClick={closeAddModal} aria-label="Fechar" className="absolute right-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><X size={15} /></button>
          </div>
          <p className="mb-4 text-sm font-semibold leading-5 text-zinc-300">Dica: Você pode colar vários emails em um único campo, separados por vírgula ou espaço.</p>
          <div className="mb-[165px] grid grid-cols-[1fr_1.15fr] overflow-hidden rounded-lg border border-white/[0.12] bg-[#111214]">
            <input value={manualEmail} onChange={(event) => setManualEmail(event.target.value)} placeholder="Email" className="h-10 min-w-0 border-0 border-r border-solid border-white/10 bg-transparent px-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-500" />
            <input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Nome (Opcional)" className="h-10 min-w-0 border-0 bg-transparent px-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-500" />
          </div>
          <button type="button" disabled={!manualInputIsValid} onClick={prepareManualPreview} className="h-10 w-full rounded-lg border-0 bg-zinc-400 text-base font-medium text-zinc-800 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-70">Visualizar</button>
        </PeopleModal>
      )}

      {addStep === 'preview' && (
        <PeopleModal key="add-preview" onClose={closeAddModal} wide>
          <div className="relative mb-5 flex items-center justify-center">
            <button onClick={() => setAddStep(csvFileName ? 'csv' : 'manual')} aria-label="Voltar" className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><ArrowLeft size={15} /></button>
            <h2 className="text-base font-bold">Revisar Pessoas</h2>
            <button onClick={closeAddModal} aria-label="Fechar" className="absolute right-0 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white/10 text-zinc-400"><X size={15} /></button>
          </div>
          <p className="mb-3 text-sm font-semibold text-zinc-400">Confira os contatos antes de adicioná-los ao calendário.</p>
          <div className="max-h-[280px] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04]">
            {pendingMembers.map((person) => <div key={person.id} className="border-b border-white/10 px-3 py-2.5 last:border-b-0"><strong className="block text-sm">{person.name || 'Sem nome'}</strong><span className="text-sm font-semibold text-zinc-500">{person.email}</span></div>)}
          </div>
          <button type="button" onClick={() => { onAddMembers(pendingMembers); closeAddModal(); }} className="mt-4 h-10 w-full rounded-lg border-0 bg-white text-base font-semibold text-zinc-900 hover:bg-zinc-100">Adicionar {pendingMembers.length} pessoa{pendingMembers.length === 1 ? '' : 's'}</button>
        </PeopleModal>
      )}

      {selectedMember && <PersonDetailsPanel
        key="person-details"
        member={selectedMember}
        tags={personTags[personKey(selectedMember)] || []}
        availableTags={allTags}
        onToggleTag={(tag, assigned) => onSetManagedTagAssignment(tag, personKey(selectedMember), assigned)}
        onCreateTag={async (name, color) => {
          const tag = await onCreateManagedTag(name, color);
          await onSetManagedTagAssignment(tag, personKey(selectedMember), true);
        }}
        onClose={() => setSelectedMember(null)}
        onRemove={() => { onRemoveMember(selectedMember); setSelectedMember(null); }}
        onBlock={() => { onBlockMember(selectedMember); setSelectedMember(null); }}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < visibleMembers.length - 1}
        onPrev={() => selectedIndex > 0 && setSelectedMember(visibleMembers[selectedIndex - 1])}
        onNext={() => selectedIndex >= 0 && selectedIndex < visibleMembers.length - 1 && setSelectedMember(visibleMembers[selectedIndex + 1])}
      />}
      </AnimatePresence>
    </div>
  );
}
