import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Globe2,
  Layers3,
  Loader2,
  Lock,
  Plus,
  X,
} from 'lucide-react';
import type { Organization } from '@/context/OrganizationContext';

export interface CloneEventOptions {
  organizationId?: string;
  privacy: 'public' | 'private';
  startDate: string;
  endDate?: string;
  timezone: string;
  schedules?: Array<{ startDate: string; endDate?: string }>;
}

interface ScheduleDraft {
  id: string;
  date: string;
  time: string;
}

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

interface CloneEventModalProps {
  open: boolean;
  event: {
    name?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    privacy?: string | null;
    organizationId?: string | null;
    organizerId?: string | null;
  };
  organizations: Organization[];
  fallbackOrganization?: Organization | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (options: CloneEventOptions) => void;
}

const TIMEZONES = [
  { name: 'America/Fortaleza', city: 'Fortaleza', gmt: 'GMT-03:00' },
  { name: 'America/Sao_Paulo', city: 'São Paulo', gmt: 'GMT-03:00' },
  { name: 'America/Manaus', city: 'Manaus', gmt: 'GMT-04:00' },
  { name: 'America/Belem', city: 'Belém', gmt: 'GMT-03:00' },
  { name: 'America/Recife', city: 'Recife', gmt: 'GMT-03:00' },
  { name: 'America/New_York', city: 'Nova York', gmt: 'GMT-04:00' },
  { name: 'Europe/London', city: 'Londres', gmt: 'GMT+01:00' },
  { name: 'Europe/Paris', city: 'Paris', gmt: 'GMT+02:00' },
  { name: 'Asia/Tokyo', city: 'Tóquio', gmt: 'GMT+09:00' },
];

const DEFAULT_TIMEZONE = 'America/Fortaleza';

const parseLocalDate = (date: string) => new Date(`${date}T12:00:00`);
const toLocalDateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDays = (date: string, amount: number) => {
  const next = parseLocalDate(date);
  next.setDate(next.getDate() + amount);
  return toLocalDateString(next);
};
const addMonths = (date: string, amount: number) => {
  const current = parseLocalDate(date);
  const day = current.getDate();
  const next = new Date(current.getFullYear(), current.getMonth() + amount, 1, 12);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0, 12).getDate();
  next.setDate(Math.min(day, lastDay));
  return toLocalDateString(next);
};
const scheduleId = () => `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const datePartsInTimezone = (value: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${read('hour')}:${read('minute')}`,
  };
};

// Converts a wall-clock value in an IANA timezone to an ISO instant without a date library.
export const zonedDateTimeToIso = (date: string, time: string, timezone: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return '';

  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desired;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const shown = datePartsInTimezone(new Date(guess), timezone);
    const [shownYear, shownMonth, shownDay] = shown.date.split('-').map(Number);
    const [shownHour, shownMinute] = shown.time.split(':').map(Number);
    const shownAsUtc = Date.UTC(shownYear, shownMonth - 1, shownDay, shownHour, shownMinute);
    guess += desired - shownAsUtc;
  }
  return new Date(guess).toISOString();
};

const organizationAvatar = (organization?: Organization) => {
  if (organization?.logoUrl) {
    return <img src={organization.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />;
  }
  return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-rose-600 text-[10px]">🙂</span>;
};

const WEEKDAYS = [
  { day: 1, label: 'S' },
  { day: 2, label: 'T' },
  { day: 3, label: 'Q' },
  { day: 4, label: 'Q' },
  { day: 5, label: 'S' },
  { day: 6, label: 'S' },
  { day: 0, label: 'D' },
];

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Diário',
  weekly: 'Semanalmente',
  monthly: 'Mensal',
};

function RecurrenceStep({
  initialSchedule,
  onBack,
  onClose,
  onApply,
}: {
  initialSchedule: ScheduleDraft;
  onBack: () => void;
  onClose: () => void;
  onApply: (schedules: ScheduleDraft[]) => void;
}) {
  const [startDate, setStartDate] = React.useState(initialSchedule.date);
  const [startTime, setStartTime] = React.useState(initialSchedule.time);
  const [frequency, setFrequency] = React.useState<RecurrenceFrequency>('weekly');
  const [frequencyOpen, setFrequencyOpen] = React.useState(false);
  const [selectedDays, setSelectedDays] = React.useState<number[]>([parseLocalDate(initialSchedule.date).getDay()]);
  const [limitMode, setLimitMode] = React.useState<'until' | 'count'>('count');
  const [count, setCount] = React.useState(5);
  const [untilDate, setUntilDate] = React.useState(addDays(initialSchedule.date, 28));

  const generatedDates = React.useMemo(() => {
    if (!startDate) return [];
    const safeCount = Math.max(1, Math.min(25, Number(count) || 1));
    const result: string[] = [];

    if (frequency === 'daily') {
      if (limitMode === 'count') {
        for (let index = 0; index < safeCount; index += 1) result.push(addDays(startDate, index));
      } else {
        for (let cursor = startDate, guard = 0; cursor <= untilDate && guard < 100; cursor = addDays(cursor, 1), guard += 1) result.push(cursor);
      }
    } else if (frequency === 'monthly') {
      if (limitMode === 'count') {
        for (let index = 0; index < safeCount; index += 1) result.push(addMonths(startDate, index));
      } else {
        for (let index = 0, cursor = startDate; cursor <= untilDate && index < 25; index += 1, cursor = addMonths(startDate, index)) result.push(cursor);
      }
    } else if (selectedDays.length) {
      const boundary = limitMode === 'count' ? addDays(startDate, (safeCount * 7) - 1) : untilDate;
      for (let cursor = startDate, guard = 0; cursor <= boundary && guard < 370; cursor = addDays(cursor, 1), guard += 1) {
        if (selectedDays.includes(parseLocalDate(cursor).getDay())) result.push(cursor);
      }
    }

    return result.slice(0, 25);
  }, [count, frequency, limitMode, selectedDays, startDate, untilDate]);

  const toggleWeekday = (day: number) => {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  };

  const periodLabel = frequency === 'daily' ? 'dias' : frequency === 'monthly' ? 'meses' : 'semanas';
  const previewDates = generatedDates.length <= 5
    ? generatedDates.map((date) => ({ type: 'date' as const, date }))
    : [
      ...generatedDates.slice(0, 2).map((date) => ({ type: 'date' as const, date })),
      { type: 'more' as const, count: generatedDates.length - 4 },
      ...generatedDates.slice(-2).map((date) => ({ type: 'date' as const, date })),
    ];

  return (
    <>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:text-white" aria-label="Voltar">
          <ArrowLeft size={17} />
        </button>
        <h2 id="clone-event-title" className="text-[17px] font-bold tracking-[-0.02em]">Escolher Horários</h2>
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:text-white" aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="mt-5">
        <label className="text-[14px] font-semibold text-zinc-300">Começando em</label>
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_88px] overflow-hidden rounded-lg border border-white/10 bg-black/15 focus-within:border-white/20">
          <input type="date" required value={startDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (value) { setUntilDate(addDays(value, 28)); setSelectedDays([parseLocalDate(value).getDay()]); } }} className="h-[38px] min-w-0 border-0 border-r border-white/10 bg-transparent px-3 text-[14px] font-semibold text-white outline-none [color-scheme:dark]" />
          <input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-[38px] min-w-0 border-0 bg-transparent px-2 text-[15px] font-semibold text-white outline-none [color-scheme:dark]" aria-label="Hora inicial" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-zinc-300">Repete</span>
        <div className="relative w-[160px]">
          <button type="button" onClick={() => setFrequencyOpen((value) => !value)} className="flex h-[38px] w-full items-center rounded-lg border border-white/10 bg-black/15 px-3 text-left text-[14px] font-semibold">
            <span className="flex-1">{FREQUENCY_LABELS[frequency]}</span><ChevronDown size={16} className="text-zinc-500" />
          </button>
          <AnimatePresence>
            {frequencyOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-[43px] z-30 w-full rounded-lg border border-white/10 bg-[#303133] p-1 shadow-2xl">
                {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((option) => (
                  <button key={option} type="button" onClick={() => { setFrequency(option); setFrequencyOpen(false); }} className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-white/10">
                    <span className="flex-1">{FREQUENCY_LABELS[option]}</span>{frequency === option && <Check size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {frequency === 'weekly' && (
        <div className="mt-4">
          <p className="text-[14px] font-semibold text-zinc-300">Dias da Semana</p>
          <div className="mt-2 flex justify-between gap-1.5">
            {WEEKDAYS.map((weekday) => {
              const selected = selectedDays.includes(weekday.day);
              return (
                <button key={weekday.day} type="button" onClick={() => toggleWeekday(weekday.day)} aria-pressed={selected} className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition ${selected ? 'bg-pink-500 text-white' : 'bg-white/10 text-zinc-400 hover:bg-white/15'}`}>
                  {weekday.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <div className="grid h-[38px] flex-1 grid-cols-2 rounded-lg bg-white/10 p-0.5">
          <button type="button" onClick={() => setLimitMode('until')} className={`rounded-md text-[13px] font-semibold ${limitMode === 'until' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400'}`}>Até</button>
          <button type="button" onClick={() => setLimitMode('count')} className={`rounded-md text-[13px] font-semibold ${limitMode === 'count' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400'}`}>Por</button>
        </div>
        <ChevronDown size={16} className="-rotate-90 text-zinc-500" />
        {limitMode === 'count' ? (
          <div className="grid h-[38px] w-[132px] grid-cols-[48px_1fr] overflow-hidden rounded-lg border border-white/10 bg-black/15">
            <input type="number" min={1} max={25} value={count} onChange={(event) => setCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))} className="min-w-0 border-0 border-r border-white/10 bg-transparent text-center text-[15px] font-bold outline-none" />
            <span className="flex items-center justify-center bg-white/10 text-[13px] font-semibold text-zinc-300">{periodLabel}</span>
          </div>
        ) : (
          <input type="date" min={startDate} value={untilDate} onChange={(event) => setUntilDate(event.target.value)} className="h-[38px] w-[132px] rounded-lg border border-white/10 bg-black/15 px-2 text-[13px] font-semibold outline-none [color-scheme:dark]" />
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-dashed border-white/10 p-1.5">
        <div className="flex min-w-max gap-1.5">
          {previewDates.map((previewItem, index) => {
            if (previewItem.type === 'more') {
              return <span key={`more-${previewItem.count}`} className="flex h-[64px] w-[51px] items-center justify-center text-[15px] font-bold text-zinc-400">+{previewItem.count}</span>;
            }
            const previewDate = parseLocalDate(previewItem.date);
            return (
              <div key={`${previewItem.date}-${index}`} className="flex h-[64px] w-[51px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                <span className="text-[9px] font-bold uppercase text-zinc-400">{previewDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                <strong className="text-[16px] leading-5">{previewDate.getDate()}</strong>
                <span className="text-[9px] font-bold uppercase text-zinc-500">{previewDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
              </div>
            );
          })}
          {!generatedDates.length && <span className="flex h-[64px] w-[280px] items-center justify-center text-[12px] text-zinc-500">Selecione ao menos um dia da semana</span>}
        </div>
      </div>

      {generatedDates.length === 25 && (
        <p className="mt-3 text-center text-[12px] font-semibold text-amber-300">Você pode adicionar até 25 vezes por vez.</p>
      )}

      <button type="button" disabled={!generatedDates.length} onClick={() => onApply(generatedDates.map((date) => ({ id: scheduleId(), date, time: startTime })))} className="mt-4 h-[38px] w-full rounded-lg bg-white text-[15px] font-bold text-[#191a1b] transition hover:bg-zinc-100 disabled:opacity-50">
        Adicionar {generatedDates.length} {generatedDates.length === 1 ? 'Vez' : 'Vezes'}
      </button>
    </>
  );
}

export function CloneEventModal({
  open,
  event,
  organizations,
  fallbackOrganization,
  loading,
  onClose,
  onConfirm,
}: CloneEventModalProps) {
  const [organizationId, setOrganizationId] = React.useState('');
  const [privacy, setPrivacy] = React.useState<'public' | 'private'>('public');
  const [schedules, setSchedules] = React.useState<ScheduleDraft[]>([]);
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE);
  const [view, setView] = React.useState<'main' | 'recurrence'>('main');
  const [organizationOpen, setOrganizationOpen] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  const [timezoneOpen, setTimezoneOpen] = React.useState(false);
  const durationRef = React.useRef<number | null>(null);

  const availableOrganizations = React.useMemo(() => {
    if (!fallbackOrganization || organizations.some((item) => item.id === fallbackOrganization.id)) return organizations;
    return [fallbackOrganization, ...organizations];
  }, [fallbackOrganization, organizations]);

  const selectedOrganization = availableOrganizations.find((item) => item.id === organizationId) || fallbackOrganization || availableOrganizations[0];
  const selectedTimezone = TIMEZONES.find((item) => item.name === timezone) || TIMEZONES[0];

  React.useEffect(() => {
    if (!open) return;
    const sourceStart = event.startDate ? new Date(event.startDate) : new Date();
    const safeStart = Number.isNaN(sourceStart.getTime()) ? new Date() : sourceStart;
    const initial = datePartsInTimezone(safeStart, DEFAULT_TIMEZONE);
    const sourceEnd = event.endDate ? new Date(event.endDate) : null;
    durationRef.current = sourceEnd && !Number.isNaN(sourceEnd.getTime())
      ? Math.max(0, sourceEnd.getTime() - safeStart.getTime())
      : null;
    setSchedules([{ id: scheduleId(), ...initial }]);
    setTimezone(DEFAULT_TIMEZONE);
    setView('main');
    setPrivacy(event.privacy === 'private' ? 'private' : 'public');
    const sourceOrganizationId = event.organizationId || event.organizerId || '';
    const sourceOrganizationIsAvailable = availableOrganizations.some((organization) => organization.id === sourceOrganizationId);
    setOrganizationId(sourceOrganizationIsAvailable ? sourceOrganizationId : (fallbackOrganization?.id || availableOrganizations[0]?.id || ''));
    setOrganizationOpen(false);
    setPrivacyOpen(false);
    setTimezoneOpen(false);
  }, [open, event.startDate, event.endDate, event.privacy, event.organizationId, event.organizerId, fallbackOrganization?.id, availableOrganizations]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !loading) {
        if (view === 'recurrence') setView('main');
        else onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onClose, open, view]);

  const submit = (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    if (view !== 'main') return;
    const duration = durationRef.current;
    const normalizedSchedules = schedules.map((schedule) => {
      const startDate = zonedDateTimeToIso(schedule.date, schedule.time, timezone);
      return {
        startDate,
        endDate: duration !== null && startDate ? new Date(new Date(startDate).getTime() + duration).toISOString() : undefined,
      };
    }).filter((schedule) => schedule.startDate);
    const firstSchedule = normalizedSchedules[0];
    if (!firstSchedule) return;
    onConfirm({
      organizationId: organizationId || undefined,
      privacy,
      startDate: firstSchedule.startDate,
      endDate: firstSchedule.endDate,
      timezone,
      schedules: normalizedSchedules,
    });
  };

  const updateSchedule = (id: string, field: 'date' | 'time', value: string) => {
    setSchedules((current) => current.map((schedule) => schedule.id === id ? { ...schedule, [field]: value } : schedule));
  };

  const addSchedule = () => {
    if (schedules.length >= 25) return;
    const last = schedules[schedules.length - 1];
    setSchedules((current) => [...current, {
      id: scheduleId(),
      date: last?.date ? addDays(last.date, 1) : toLocalDateString(new Date()),
      time: last?.time || '12:00',
    }]);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget && !loading) onClose();
          }}
          className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-[3px]"
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="clone-event-title"
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            transition={{ duration: 0.17, ease: 'easeOut' }}
            onSubmit={submit}
            className="my-auto max-h-[calc(100dvh-24px)] w-full max-w-[340px] overflow-y-auto rounded-[17px] border border-white/[0.06] bg-[#1b1c1d]/95 p-5 text-left text-white shadow-[0_24px_70px_rgba(0,0,0,.62)] backdrop-blur-2xl"
          >
            {view === 'recurrence' && schedules[0] ? (
              <RecurrenceStep
                initialSchedule={schedules[0]}
                onBack={() => setView('main')}
                onClose={onClose}
                onApply={(nextSchedules) => { setSchedules(nextSchedules); setView('main'); }}
              />
            ) : (
              <>
            <div className="flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                <span className="relative">
                  <Copy size={24} strokeWidth={1.8} />
                  <span className="absolute -left-1 -top-1 h-5 w-5 rounded-[6px] border-2 border-dashed border-zinc-300" />
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="clone-event-title" className="mt-4 text-[20px] font-bold leading-6 tracking-[-0.025em]">Clonar Evento</h2>
            <p className="truncate text-[16px] font-medium leading-6 text-zinc-400">{event.name || 'Evento'}</p>
            <p className="mt-2 text-[14px] font-medium leading-5 text-zinc-300">
              Tudo, exceto a lista de convidados e as publicações do evento, será copiado.
            </p>

            <div className="mt-4">
              <label className="text-[14px] font-semibold leading-5 text-zinc-300">Calendário</label>
              <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_55px] gap-1.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setOrganizationOpen((value) => !value); setPrivacyOpen(false); setTimezoneOpen(false); }}
                    className="flex h-[38px] w-full items-center gap-2 rounded-lg bg-white/10 px-2.5 text-left text-[15px] font-semibold text-zinc-200 transition hover:bg-white/[0.14]"
                    aria-expanded={organizationOpen}
                  >
                    {organizationAvatar(selectedOrganization)}
                    <span className="min-w-0 flex-1 truncate">{selectedOrganization?.name || 'Pessoal'}</span>
                    <ChevronDown size={16} className="text-zinc-400" />
                  </button>
                  <AnimatePresence>
                    {organizationOpen && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 right-0 top-[43px] z-20 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-[#303133] p-1 shadow-2xl">
                        {availableOrganizations.map((organization) => (
                          <button key={organization.id} type="button" onClick={() => { setOrganizationId(organization.id); setOrganizationOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-semibold hover:bg-white/10">
                            {organizationAvatar(organization)}
                            <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                            {organization.id === organizationId && <Check size={16} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button type="button" onClick={() => { setPrivacyOpen((value) => !value); setOrganizationOpen(false); setTimezoneOpen(false); }} className="flex h-[38px] w-full items-center justify-center gap-1 rounded-lg bg-white/10 text-zinc-300 transition hover:bg-white/[0.14]" aria-label="Alterar visibilidade" aria-expanded={privacyOpen}>
                    {privacy === 'public' ? <Globe2 size={17} /> : <Lock size={16} />}
                    <ChevronDown size={15} />
                  </button>
                  <AnimatePresence>
                    {privacyOpen && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-[43px] z-20 w-40 rounded-lg border border-white/10 bg-[#303133] p-1 shadow-2xl">
                        {([
                          { value: 'public' as const, label: 'Público', icon: <Globe2 size={17} /> },
                          { value: 'private' as const, label: 'Privado', icon: <Lock size={16} /> },
                        ]).map((option) => (
                          <button key={option.value} type="button" onClick={() => { setPrivacy(option.value); setPrivacyOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-semibold hover:bg-white/10">
                            {option.icon}<span className="flex-1 text-left">{option.label}</span>{privacy === option.value && <Check size={15} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[14px] font-semibold leading-5 text-zinc-300">{schedules.length > 1 ? `${schedules.length} Novos Horários` : 'Novo Horário'}</label>
              <div className="mt-1.5 space-y-1.5">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className={`grid overflow-hidden rounded-lg border border-white/10 bg-black/15 focus-within:border-white/20 ${schedules.length > 1 ? 'grid-cols-[minmax(0,1fr)_76px_28px]' : 'grid-cols-[minmax(0,1fr)_88px]'}`}>
                    <input aria-label="Data do novo evento" type="date" required value={schedule.date} onChange={(inputEvent) => updateSchedule(schedule.id, 'date', inputEvent.target.value)} className="h-[38px] min-w-0 border-0 border-r border-white/10 bg-transparent px-3 text-[14px] font-semibold text-white outline-none [color-scheme:dark]" />
                    <input aria-label="Hora do novo evento" type="time" required value={schedule.time} onChange={(inputEvent) => updateSchedule(schedule.id, 'time', inputEvent.target.value)} className="h-[38px] min-w-0 border-0 bg-transparent px-1.5 text-[14px] font-semibold text-white outline-none [color-scheme:dark]" />
                    {schedules.length > 1 && (
                      <button type="button" onClick={() => setSchedules((current) => current.filter((item) => item.id !== schedule.id))} className="flex items-center justify-center border-l border-white/10 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300" aria-label="Remover horário">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={addSchedule} disabled={schedules.length >= 25} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-white/10 px-2 text-[12px] font-semibold text-zinc-300 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
                  <Plus size={15} /> Adicionar Horário
                </button>
                <button type="button" onClick={() => setView('recurrence')} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-white/10 px-2 text-[12px] font-semibold text-zinc-300 transition hover:bg-white/15">
                  <Layers3 size={15} /> Recorrência
                </button>
              </div>
            </div>

            <div className="relative mt-3">
              <button type="button" onClick={() => { setTimezoneOpen((value) => !value); setOrganizationOpen(false); setPrivacyOpen(false); }} className="flex h-[38px] w-full items-center rounded-lg border border-white/10 bg-black/15 px-3 text-left text-[14px] transition hover:bg-white/[0.04]" aria-expanded={timezoneOpen}>
                <span className="text-zinc-400">{selectedTimezone.gmt}</span>
                <strong className="ml-2 flex-1 font-semibold text-zinc-100">{selectedTimezone.city}</strong>
                <ChevronDown size={16} className="text-zinc-500" />
              </button>
              <AnimatePresence>
                {timezoneOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute bottom-[43px] left-0 right-0 z-20 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#303133] p-1 shadow-2xl">
                    {TIMEZONES.map((option) => (
                      <button key={option.name} type="button" onClick={() => { setTimezone(option.name); setTimezoneOpen(false); }} className="flex w-full items-center rounded-md px-2.5 py-1.5 text-[13px] hover:bg-white/10">
                        <span className="w-[82px] text-left text-zinc-400">{option.gmt}</span><span className="flex-1 text-left font-semibold">{option.city}</span>{timezone === option.name && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="submit" disabled={loading || !schedules.length || schedules.some((schedule) => !schedule.date || !schedule.time)} className="mt-4 inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-white text-[15px] font-bold text-[#191a1b] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Clonando…' : 'Clonar Evento'}
            </button>
              </>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
