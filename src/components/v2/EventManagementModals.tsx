import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsRight,
  DollarSign,
  Globe,
  Loader2,
  LockKeyhole,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { Organization } from '@/context/OrganizationContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { useToast } from '@/hooks/use-toast';
import { FauvesSwitch } from '@/components/v2/FauvesSwitch';

type Privacy = 'public' | 'private';

const useOverlayLifecycle = (open: boolean, onClose: () => void, blocked = false) => {
  React.useEffect(() => {
    if (!open) return;
    const release = acquireDocumentScrollLock();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !blocked) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      release();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [blocked, onClose, open]);
};

const modalSurface = (isDark: boolean) => isDark
  ? 'border-white/[0.08] bg-[#1b1c1d]/95 text-white'
  : 'border-zinc-200 bg-white/95 text-zinc-900';

const mutedText = (isDark: boolean) => isDark ? 'text-zinc-400' : 'text-zinc-600';
const softSurface = (isDark: boolean) => isDark
  ? 'border-white/[0.08] bg-white/[0.07]'
  : 'border-zinc-200 bg-zinc-100';
const fieldSurface = (isDark: boolean) => isDark
  ? 'border-zinc-700 bg-[#141617] text-white placeholder:text-zinc-500'
  : 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400';
const primaryButton = (isDark: boolean) => isDark
  ? 'bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-zinc-700 disabled:text-zinc-500'
  : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400';

type ModalFrameProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  busy?: boolean;
  width?: number;
  label: string;
  overflowVisible?: boolean;
};

function ModalFrame({ open, onClose, children, busy = false, width = 400, label, overflowVisible = false }: ModalFrameProps) {
  const { isDark } = useTheme();
  useOverlayLifecycle(open, onClose, busy);
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[5px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`manage-theme-surface ${isDark ? 'dark dark-mode' : 'light'} relative my-auto max-h-[calc(100dvh-24px)] w-full rounded-[14px] border p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl ${modalSurface(isDark)} ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto'}`}
            style={{ maxWidth: width }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Fechar"
              disabled={busy}
              onClick={onClose}
              className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border-0 transition ${isDark ? 'bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900'}`}
            >
              <X size={17} />
            </button>
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const ModalIcon = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div className={`mb-5 grid h-14 w-14 place-items-center rounded-full border ${softSurface(isDark)}`}>
    {children}
  </div>
);

export function EventVisibilityModal({
  open,
  currentPrivacy,
  onClose,
  onSave,
}: {
  open: boolean;
  currentPrivacy: Privacy;
  onClose: () => void;
  onSave: (privacy: Privacy) => Promise<void>;
}) {
  const { isDark } = useTheme();
  const [privacy, setPrivacy] = React.useState<Privacy>(currentPrivacy);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPrivacy(currentPrivacy);
    setMenuOpen(false);
  }, [currentPrivacy, open]);

  const save = async () => {
    setSaving(true);
    try { await onSave(privacy); } finally { setSaving(false); }
  };

  return (
    <ModalFrame open={open} onClose={onClose} busy={saving} width={400} label="Alterar visibilidade do evento" overflowVisible={true}>
      <ModalIcon isDark={isDark}>{privacy === 'public' ? <Globe size={27} /> : <Sparkles size={27} />}</ModalIcon>
      <h2 className="pr-10 text-[23px] font-bold tracking-[-0.02em]">Evento {privacy === 'public' ? 'Público' : 'Privado'}</h2>
      <p className={`mt-2 text-[14px] leading-6 ${mutedText(isDark)}`}>
        {privacy === 'public'
          ? 'Este evento aparece no calendário e pode ser descoberto por outras pessoas.'
          : 'Este evento não será listado. Apenas pessoas com o link poderão acessá-lo.'}
      </p>

      <div className="relative mt-5">
        <label className={`mb-2 block text-[13px] font-semibold ${mutedText(isDark)}`}>Nova visibilidade</label>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className={`flex h-11 w-full items-center justify-between rounded-[9px] border px-3 text-sm font-semibold transition ${fieldSurface(isDark)}`}
        >
          <span className="flex items-center gap-2.5">{privacy === 'public' ? <Globe size={17} /> : <Sparkles size={17} />} {privacy === 'public' ? 'Público' : 'Privado'}</span>
          <ChevronDown size={16} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`absolute left-0 right-0 top-[calc(100%+7px)] z-10 overflow-hidden rounded-[10px] border p-1.5 shadow-2xl ${isDark ? 'border-zinc-700 bg-[#252627]' : 'border-zinc-200 bg-white'}`}
            >
              {([
                { value: 'public' as const, title: 'Público', description: 'Exibido no calendário e elegível para destaque.', icon: Globe },
                { value: 'private' as const, title: 'Privado', description: 'Não listado. Apenas pessoas com o link podem acessar.', icon: Sparkles },
              ]).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setPrivacy(option.value); setMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition ${isDark ? 'hover:bg-white/[0.07]' : 'hover:bg-zinc-100'}`}
                  >
                    <Icon size={18} className={mutedText(isDark)} />
                    <span className="min-w-0 flex-1"><b className="block text-sm">{option.title}</b><small className={`mt-0.5 block text-[11px] leading-4 ${mutedText(isDark)}`}>{option.description}</small></span>
                    {privacy === option.value && <Check size={17} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="button" disabled={saving || privacy === currentPrivacy} onClick={() => void save()} className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border-0 text-sm font-bold transition ${primaryButton(isDark)}`}>
        {saving && <Loader2 size={16} className="animate-spin" />} Atualizar Visibilidade
      </button>
    </ModalFrame>
  );
}

export function TransferEventModal({
  open,
  organizations,
  currentOrganization,
  ownerAvatar,
  onClose,
  onTransfer,
  onCreateCalendar,
}: {
  open: boolean;
  organizations: Organization[];
  currentOrganization: Organization | null;
  ownerAvatar?: string;
  onClose: () => void;
  onTransfer: (organization: Organization) => Promise<void>;
  onCreateCalendar: () => void;
}) {
  const { isDark } = useTheme();
  const [selected, setSelected] = React.useState<Organization | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const choices = organizations.filter((organization) => organization.id !== currentOrganization?.id);

  React.useEffect(() => {
    if (!open) return;
    setSelected(null);
    setMenuOpen(false);
  }, [open]);

  const transfer = async () => {
    if (!selected) return;
    setSaving(true);
    try { await onTransfer(selected); } finally { setSaving(false); }
  };

  return (
    <ModalFrame open={open} onClose={onClose} busy={saving} width={400} label="Transferir evento para outro calendário" overflowVisible={true}>
      {ownerAvatar ? (
        <img src={resolveImageUrl(ownerAvatar)} alt="" className={`mb-5 h-14 w-14 rounded-full border object-cover ${isDark ? 'border-white/10' : 'border-zinc-200'}`} />
      ) : (
        <ModalIcon isDark={isDark}><CalendarDays size={27} /></ModalIcon>
      )}
      <h2 className={`pr-9 text-[20px] font-medium leading-7 ${mutedText(isDark)}`}>Este evento é gerenciado por</h2>
      <p className="text-[22px] font-bold leading-7">{currentOrganization?.name || 'Seu Calendário Pessoal'}</p>
      <h3 className="mt-5 text-sm font-bold">Quando você transferir o evento:</h3>
      <div className={`mt-3 space-y-3 text-[13px] leading-5 ${mutedText(isDark)}`}>
        <p className="flex gap-3"><Users size={19} className="mt-0.5 shrink-0" />Os administradores do novo calendário poderão gerenciar o evento.</p>
        <p className="flex gap-3"><DollarSign size={19} className="mt-0.5 shrink-0" />Os pagamentos serão direcionados para a conta financeira do novo calendário.</p>
      </div>

      <div className="relative mt-5">
        <button type="button" onClick={() => setMenuOpen((value) => !value)} className={`flex h-11 w-full items-center justify-between rounded-[9px] border px-3 text-sm font-semibold transition ${fieldSurface(isDark)}`}>
          <span className="flex min-w-0 items-center gap-2.5">
            {selected?.logoUrl ? <img src={resolveImageUrl(selected.logoUrl)} alt="" className="h-5 w-5 rounded-[5px] object-cover" /> : <CalendarDays size={18} />}
            <span className="truncate">{selected?.name || 'Escolher Calendário'}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className={`absolute left-0 right-0 top-[calc(100%+7px)] z-10 overflow-hidden rounded-[10px] border p-1.5 shadow-2xl ${isDark ? 'border-zinc-700 bg-[#252627]' : 'border-zinc-200 bg-white'}`}>
              {choices.length ? choices.map((organization) => (
                <button key={organization.id} type="button" onClick={() => { setSelected(organization); setMenuOpen(false); }} className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-sm font-semibold transition ${isDark ? 'hover:bg-white/[0.07]' : 'hover:bg-zinc-100'}`}>
                  {organization.logoUrl ? <img src={resolveImageUrl(organization.logoUrl)} alt="" className="h-6 w-6 rounded-[6px] object-cover" /> : <CalendarDays size={20} className={mutedText(isDark)} />}
                  <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                  {selected?.id === organization.id && <Check size={16} />}
                </button>
              )) : <p className={`px-3 py-3 text-xs ${mutedText(isDark)}`}>Você ainda não possui outro calendário.</p>}
              <button type="button" onClick={onCreateCalendar} className={`flex w-full items-center gap-2.5 border-t px-3 py-2.5 text-left text-sm font-semibold ${isDark ? 'border-white/10 hover:bg-white/[0.07]' : 'border-zinc-200 hover:bg-zinc-100'}`}><Plus size={19} />Criar Calendário</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="button" disabled={!selected || saving} onClick={() => void transfer()} className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border-0 text-sm font-bold transition ${primaryButton(isDark)}`}>
        {saving && <Loader2 size={16} className="animate-spin" />} Transferir Evento
      </button>
    </ModalFrame>
  );
}

export function EditEventHostModal({
  host,
  onClose,
  onSave,
}: {
  host: any | null;
  onClose: () => void;
  onSave: (host: any, showOnPage: boolean) => Promise<void>;
}) {
  const { isDark } = useTheme();
  const [showOnPage, setShowOnPage] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (host) setShowOnPage(host.showOnPage !== false);
  }, [host]);

  const save = async () => {
    if (!host) return;
    setSaving(true);
    try { await onSave(host, showOnPage); } finally { setSaving(false); }
  };

  return (
    <ModalFrame open={Boolean(host)} onClose={onClose} busy={saving} width={400} label="Editar anfitrião">
      <ModalIcon isDark={isDark}><Award size={27} /></ModalIcon>
      <h2 className="pr-10 text-[23px] font-bold tracking-[-0.02em]">Atualizar Anfitrião</h2>
      <p className={`mt-1 truncate text-[14px] font-medium ${mutedText(isDark)}`}>{host?.name} ({host?.email})</p>
      <div className="mt-6 flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">Mostrar na Página do Evento</h3>
          <p className={`mt-1 text-[13px] leading-5 ${mutedText(isDark)}`}>Controle se este anfitrião será destacado publicamente na página do evento.</p>
        </div>
        <FauvesSwitch checked={showOnPage} onCheckedChange={setShowOnPage} label="Mostrar anfitrião na página do evento" />
      </div>
      <button type="button" disabled={saving} onClick={() => void save()} className={`mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border-0 text-sm font-bold transition ${primaryButton(isDark)}`}>
        {saving && <Loader2 size={16} className="animate-spin" />} Atualizar
      </button>
    </ModalFrame>
  );
}

type CheckinTeamMember = {
  userId: string;
  email: string;
  name: string;
  funcao: string;
  isOwner?: boolean;
};

export function CheckinTeamPanel({
  open,
  eventId,
  event,
  onClose,
  onEventUpdated,
}: {
  open: boolean;
  eventId: string;
  event: any;
  onClose: () => void;
  onEventUpdated: (event: any) => void;
}) {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const initialSettings = event?.registrationForm?.checkinSettings || {};
  const [scanMode, setScanMode] = React.useState<'default' | 'express'>(initialSettings.scanMode === 'express' ? 'express' : 'default');
  const [locked, setLocked] = React.useState(Boolean(initialSettings.lockTeam));
  const [members, setMembers] = React.useState<CheckinTeamMember[]>([]);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [savingSettings, setSavingSettings] = React.useState(false);
  useOverlayLifecycle(open, onClose, adding || Boolean(removingId));

  const loadTeam = React.useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}/team`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Não foi possível carregar a equipe.');
      setMembers((Array.isArray(data?.items) ? data.items : []).filter((member: CheckinTeamMember) => member.funcao === 'CHECKIN'));
    } catch (error: any) {
      toast({ title: 'Erro ao carregar equipe', description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  }, [eventId, toast]);

  React.useEffect(() => {
    if (!open) return;
    const settings = event?.registrationForm?.checkinSettings || {};
    setScanMode(settings.scanMode === 'express' ? 'express' : 'default');
    setLocked(Boolean(settings.lockTeam));
    setEmail('');
    void loadTeam();
  }, [event?.registrationForm?.checkinSettings, loadTeam, open]);

  const saveSettings = async (next: { scanMode: 'default' | 'express'; lockTeam: boolean }) => {
    setSavingSettings(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationForm: { checkinSettings: next } }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Não foi possível salvar as opções.');
      onEventUpdated(data);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar opções', description: error.message, variant: 'destructive' });
    } finally { setSavingSettings(false); }
  };

  const changeScanMode = (next: 'default' | 'express') => {
    setScanMode(next);
    void saveSettings({ scanMode: next, lockTeam: locked });
  };
  const changeLocked = (next: boolean) => {
    setLocked(next);
    void saveSettings({ scanMode, lockTeam: next });
  };

  const addMember = async () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast({ title: 'Informe um e-mail válido', variant: 'destructive' }); return;
    }
    setAdding(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: normalized, funcao: 'CHECKIN' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Não foi possível adicionar o integrante.');
      setEmail('');
      await loadTeam();
      toast({ title: 'Integrante adicionado à equipe de check-in' });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar integrante', description: error.message, variant: 'destructive' });
    } finally { setAdding(false); }
  };

  const removeMember = async (member: CheckinTeamMember) => {
    setRemovingId(member.userId);
    try {
      const response = await fetchApi(`/api/event/${eventId}/team/${member.userId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Não foi possível remover o integrante.');
      setMembers((current) => current.filter((item) => item.userId !== member.userId));
      toast({ title: 'Integrante removido da equipe' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover integrante', description: error.message, variant: 'destructive' });
    } finally { setRemovingId(null); }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100000] flex justify-end overflow-hidden">
          <motion.button type="button" aria-label="Fechar painel" className="absolute inset-0 border-0 bg-black/50 backdrop-blur-[4px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Opções e equipe de check-in"
            className={`manage-theme-surface ${isDark ? 'dark dark-mode' : 'light'} relative z-10 m-3 flex h-[calc(100dvh-24px)] w-[min(var(--fauves-side-panel-width,520px),calc(100vw-24px))] flex-col overflow-hidden rounded-[14px] border shadow-[0_22px_70px_rgba(0,0,0,.4)] ${modalSurface(isDark)}`}
            initial={{ x: '105%' }} animate={{ x: 0 }} exit={{ x: '105%' }} transition={{ type: 'spring', damping: 28, stiffness: 230 }}
          >
            <header className={`flex h-[54px] shrink-0 items-center gap-3 border-b px-4 ${isDark ? 'border-white/[0.08] bg-white/[0.025]' : 'border-zinc-200 bg-zinc-50'}`}>
              <button type="button" onClick={onClose} className={`grid h-8 w-8 place-items-center rounded-[8px] border-0 transition ${isDark ? 'bg-white/[0.08] text-zinc-300 hover:bg-white/[0.13]' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}><ChevronsRight size={18} /></button>
              <h2 className="text-[16px] font-bold">Opções de Check-In</h2>
              {savingSettings && <Loader2 size={15} className={`ml-auto animate-spin ${mutedText(isDark)}`} />}
            </header>
            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-5">
              <section>
                <h3 className="text-[15px] font-bold">Modo de Digitalização Padrão</h3>
                <p className={`mt-1 text-xs leading-5 ${mutedText(isDark)}`}>Selecione o comportamento ao escanear o QR code de um ingresso.</p>
                <div className={`mt-3 overflow-hidden rounded-[10px] border ${softSurface(isDark)}`}>
                  {([
                    { value: 'default' as const, title: 'Padrão', description: 'Abrir a ficha do convidado antes do check-in.' },
                    { value: 'express' as const, title: 'Express', description: 'Fazer o check-in automaticamente ao escanear.' },
                  ]).map((option, index) => (
                    <button key={option.value} type="button" onClick={() => changeScanMode(option.value)} className={`flex w-full items-start gap-3 border-0 px-4 py-3 text-left ${index ? (isDark ? 'border-t border-white/[0.08]' : 'border-t border-zinc-200') : ''}`}>
                      <span className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${scanMode === option.value ? (isDark ? 'border-white bg-white text-black' : 'border-zinc-900 bg-zinc-900 text-white') : (isDark ? 'border-zinc-600' : 'border-zinc-400')}`}>{scanMode === option.value && <Check size={11} strokeWidth={3} />}</span>
                      <span><b className="block text-sm">{option.title}</b><small className={`mt-0.5 block text-[11px] leading-4 ${mutedText(isDark)}`}>{option.description}</small></span>
                    </button>
                  ))}
                  <div className={`flex items-center justify-between gap-4 border-t px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-zinc-200'}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole size={16} className={mutedText(isDark)} />Modo de bloqueio para a equipe</span>
                    <FauvesSwitch checked={locked} onCheckedChange={changeLocked} label="Modo de bloqueio para a equipe de check-in" />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[15px] font-bold">Equipe de Check-In</h3>
                <p className={`mt-1 text-xs leading-5 ${mutedText(isDark)}`}>Conceda acesso somente à leitura de ingressos e ao check-in dos convidados.</p>
                <div className="mt-3 flex gap-2">
                  <input value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addMember(); } }} placeholder="equipe@exemplo.com" type="email" className={`h-10 min-w-0 flex-1 rounded-[8px] border px-3 text-sm outline-none transition focus:border-[#2A2AD7] ${fieldSurface(isDark)}`} />
                  <button type="button" disabled={adding} onClick={() => void addMember()} className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border-0 transition ${primaryButton(isDark)}`}>{adding ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}</button>
                </div>
                <div className={`mt-3 overflow-hidden rounded-[10px] border ${softSurface(isDark)}`}>
                  {loading ? <div className={`flex items-center justify-center gap-2 px-4 py-7 text-xs ${mutedText(isDark)}`}><Loader2 size={16} className="animate-spin" />Carregando equipe...</div> : members.length ? members.map((member, index) => (
                    <div key={member.userId} className={`flex items-center gap-3 px-4 py-3 ${index ? (isDark ? 'border-t border-white/[0.08]' : 'border-t border-zinc-200') : ''}`}>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isDark ? 'bg-white/[0.08]' : 'bg-white'}`}><Users size={15} /></span>
                      <span className="min-w-0 flex-1"><b className="block truncate text-sm">{member.name || member.email}</b><small className={`block truncate text-[11px] ${mutedText(isDark)}`}>{member.email}</small></span>
                      <button type="button" disabled={removingId === member.userId} onClick={() => void removeMember(member)} aria-label={`Remover ${member.name || member.email}`} className={`grid h-8 w-8 place-items-center rounded-[8px] border-0 transition ${isDark ? 'text-zinc-500 hover:bg-red-500/10 hover:text-red-400' : 'text-zinc-400 hover:bg-red-50 hover:text-red-600'}`}>{removingId === member.userId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
                    </div>
                  )) : <div className={`px-4 py-7 text-center text-xs ${mutedText(isDark)}`}>Nenhum integrante adicionado à equipe de check-in.</div>}
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
