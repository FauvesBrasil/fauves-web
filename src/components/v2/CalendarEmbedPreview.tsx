import React from 'react';
import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';

export type CalendarEmbedTheme = 'system' | 'light' | 'dark';
export type CalendarEmbedLayout = 'cards' | 'list';

export type CalendarEmbedTag = {
  id: string;
  name: string;
  color: string;
  assignments: string[];
};

type CalendarEmbedEvent = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  image?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationUf?: string | null;
  status?: string | null;
};

type CalendarEmbedPreviewProps = {
  events: CalendarEmbedEvent[];
  tags?: CalendarEmbedTag[];
  selectedTagId?: string;
  theme: CalendarEmbedTheme;
  layout: CalendarEmbedLayout;
  organizationName?: string;
  organizationLogoUrl?: string | null;
  managerMode?: boolean;
  minHeight?: number;
  onEventAction?: (event: CalendarEmbedEvent) => void;
};

const formatDate = (date: Date) => ({
  day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
  key: date.toLocaleDateString('pt-BR'),
});

const eventLocation = (event: CalendarEmbedEvent) => {
  if (event.locationCity) return `${event.locationCity}${event.locationUf ? `, ${event.locationUf}` : ''}`;
  if (event.location === 'Evento online') return 'Online';
  return event.locationAddress || event.location || 'Local a definir';
};

export function CalendarEmbedPreview({
  events,
  tags = [],
  selectedTagId = 'all',
  theme,
  layout,
  organizationName = 'Organizador',
  organizationLogoUrl,
  managerMode = false,
  minHeight = 450,
  onEventAction,
}: CalendarEmbedPreviewProps) {
  const [systemIsDark, setSystemIsDark] = React.useState(true);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemIsDark(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark);
  const selectedTag = tags.find((tag) => tag.id === selectedTagId);
  const now = Date.now();
  const visibleEvents = events
    .filter((event) => {
      if (!event.startDate) return false;
      const lastDate = event.endDate ? new Date(event.endDate).getTime() : new Date(event.startDate).getTime();
      if (!Number.isFinite(lastDate) || lastDate < now) return false;
      return !selectedTag || selectedTag.assignments.includes(event.id);
    })
    .sort((a, b) => new Date(a.startDate as string).getTime() - new Date(b.startDate as string).getTime());

  const grouped = visibleEvents.reduce<Array<{ date: ReturnType<typeof formatDate>; items: CalendarEmbedEvent[] }>>((groups, event) => {
    const date = formatDate(new Date(event.startDate as string));
    const existing = groups.find((group) => group.date.key === date.key);
    if (existing) existing.items.push(event);
    else groups.push({ date, items: [event] });
    return groups;
  }, []);

  const colors = isDark
    ? {
        canvas: '#202224', border: 'rgba(255,255,255,.09)', card: '#2a2b2d',
        text: '#fafafa', muted: '#9b9b9f', faint: '#55575a', button: '#3a3b3d', line: '#35373a',
      }
    : {
        canvas: '#f5f6f7', border: 'rgba(17,24,39,.12)', card: '#ffffff',
        text: '#17191c', muted: '#a3a5a8', faint: '#d5d7d9', button: '#f0f1f2', line: '#e7e8e9',
      };

  return (
    <div
      className="w-full overflow-hidden rounded-xl border p-4 transition-colors sm:p-5"
      style={{ minHeight, backgroundColor: colors.canvas, borderColor: colors.border, color: colors.text }}
    >
      {grouped.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <CalendarDays size={30} style={{ color: colors.muted }} />
          <p className="mt-3 text-[16px] font-semibold" style={{ color: colors.text }}>Nenhum próximo evento</p>
          <p className="mt-1 text-[14px]" style={{ color: colors.muted }}>
            {selectedTag ? `Não há eventos com a tag “${selectedTag.name}”.` : 'Novos eventos aparecerão aqui quando forem publicados.'}
          </p>
        </div>
      ) : layout === 'cards' ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.date.key} className="relative pl-9">
              <span className="absolute left-1 top-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.muted }} />
              <span className="absolute bottom-[-24px] left-[8px] top-6 border-l-2 border-dashed" style={{ borderColor: colors.line }} />
              <h3 className="mb-4 text-[17px] font-bold">
                {group.date.day} <span className="font-semibold" style={{ color: colors.muted }}>{group.date.weekday}</span>
              </h3>
              <div className="space-y-3">
                {group.items.map((event) => {
                  const start = new Date(event.startDate as string);
                  const image = event.image || event.coverUrl;
                  return (
                    <article key={event.id} className="flex min-h-[164px] gap-4 rounded-xl border p-4 sm:p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] font-semibold" style={{ color: colors.muted }}>{start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-400"><Sparkles size={13} fill="currentColor" /></span>
                          <h4 className="truncate text-[20px] font-bold">{event.name || event.title || 'Evento'}</h4>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[14px] font-medium" style={{ color: colors.muted }}>
                          {organizationLogoUrl ? <img src={resolveImageUrl(organizationLogoUrl)} alt="" className="h-[22px] w-[22px] rounded-full object-cover" /> : <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-bold text-pink-400">{organizationName.charAt(0)}</span>}
                          <span className="truncate">Por {organizationName}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[14px] font-medium" style={{ color: colors.muted }}><MapPin size={16} /><span className="truncate">{eventLocation(event)}</span></div>
                        <button type="button" onClick={() => onEventAction?.(event)} className="mt-4 flex h-9 items-center gap-2 rounded-lg border-0 px-3 text-[14px] font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: colors.button, color: colors.muted }}>
                          {managerMode ? 'Gerenciar Evento' : 'Ver Evento'} <ArrowRight size={16} />
                        </button>
                      </div>
                      {image && <img src={resolveImageUrl(image)} alt="" className="h-[104px] w-[104px] shrink-0 rounded-xl object-cover sm:h-[124px] sm:w-[124px]" />}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.date.key}>
              <h3 className="border-b pb-3 text-[17px] font-bold" style={{ borderColor: colors.border }}>
                {group.date.day} <span className="font-semibold" style={{ color: colors.muted }}>{group.date.weekday}</span>
              </h3>
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {group.items.map((event) => {
                  const start = new Date(event.startDate as string);
                  return (
                    <button key={event.id} type="button" onClick={() => onEventAction?.(event)} className="grid w-full grid-cols-[64px_1fr_auto] gap-5 border-0 bg-transparent py-5 text-left" style={{ color: colors.text }}>
                      <span className="text-[16px] font-semibold" style={{ color: colors.muted }}>{start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[17px] font-semibold">{event.name || event.title || 'Evento'}</span>
                        <span className="mt-2 flex items-center gap-2 text-[14px] font-medium" style={{ color: colors.muted }}>
                          {organizationLogoUrl ? <img src={resolveImageUrl(organizationLogoUrl)} alt="" className="h-[22px] w-[22px] rounded-full object-cover" /> : <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-bold text-pink-400">{organizationName.charAt(0)}</span>}
                          Por {organizationName}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-[14px] font-medium" style={{ color: colors.muted }}><MapPin size={16} />{eventLocation(event)}</span>
                      </span>
                      {managerMode && <span className="rounded-md bg-purple-500/15 px-2 py-1 text-[13px] font-semibold text-purple-400">Organizando</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

