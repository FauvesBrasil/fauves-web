import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';

export type TimelineListEvent = {
  id: string;
  slug?: string | null;
  name: string;
  startDate: string;
  location?: string | null;
  locationName?: string | null;
  venue?: string | null;
  locationCity?: string | null;
  locationUf?: string | null;
  bannerUrl?: string | null;
  banner?: string | null;
  image?: string | null;
  organizerName?: string | null;
  price?: number | null;
};

type Props = {
  events: TimelineListEvent[];
  onEventClick: (event: TimelineListEvent) => void;
  emptyText?: string;
  cardBackground?: string;
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const compactLocation = (event: TimelineListEvent) => {
  const venue = (event.locationName || event.venue || event.location?.split(',')[0] || '').trim();
  const city = event.locationCity?.trim() || '';
  const uf = event.locationUf?.trim() || '';
  return [venue && normalize(venue) !== normalize(city) ? venue : '', [city, uf].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
};

const dayLabel = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
};

const StickyDay = ({ date }: { date: Date }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setStuck((ref.current?.getBoundingClientRect().top || Infinity) <= 65));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div ref={ref} className={`event-timeline-day${stuck ? ' is-stuck' : ''}`}><i /><span><strong>{dayLabel(date)}</strong><small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)}</small></span></div>;
};

const EventTimelineList: React.FC<Props> = ({ events, onEventClick, emptyText = 'Nenhum evento encontrado.', cardBackground = 'rgba(255,255,255,.055)' }) => {
  const groups = useMemo(() => {
    const result = new Map<string, TimelineListEvent[]>();
    events.forEach((event) => {
      const key = new Date(event.startDate).toDateString();
      result.set(key, [...(result.get(key) || []), event]);
    });
    return [...result.values()];
  }, [events]);

  if (!groups.length) return <p className="event-timeline-empty">{emptyText}</p>;

  return <div className="event-timeline-list" style={{ '--event-timeline-card-bg': cardBackground } as React.CSSProperties}>
    {groups.map((group) => <section className="event-timeline-group" key={new Date(group[0].startDate).toDateString()}>
      <StickyDay date={new Date(group[0].startDate)} />
      <div className="event-timeline-cards">{group.map((event) => {
        const image = resolveImageUrl(event.bannerUrl || event.banner || event.image);
        const location = compactLocation(event);
        return <article className="event-timeline-card" key={event.id} onClick={() => onEventClick(event)}>
          <div className="event-timeline-copy">
            <time>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.startDate))}</time>
            <h3>{event.name}</h3>
            {event.organizerName && <p>{event.organizerName}</p>}
            {location && <p title={location}><MapPin size={15} /><span>{location}</span></p>}
            {event.price != null && event.price > 0 && <small>R$ {event.price.toLocaleString('pt-BR')}</small>}
          </div>
          <span className="event-timeline-image">{image ? <img src={image} alt="" /> : <Calendar size={28} />}</span>
        </article>;
      })}</div>
    </section>)}
    <style>{styles}</style>
  </div>;
};

const styles = `
.event-timeline-list{color:inherit}.event-timeline-group{position:relative;padding-left:25px;margin-bottom:20px}.event-timeline-group:before{content:'';position:absolute;top:8px;bottom:-21px;left:5px;border-left:2px dashed rgba(255,255,255,.10)}
.event-timeline-day{position:sticky;top:64px;z-index:4;display:flex;width:max-content;max-width:100%;align-items:center;margin:0 0 16px -8px;padding:4px 8px;border-radius:999px;transition:background-color .16s ease,box-shadow .16s ease,backdrop-filter .16s ease}.event-timeline-day.is-stuck{background:rgba(35,37,39,.78);box-shadow:0 1px 0 rgba(255,255,255,.08);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.event-timeline-day>i{position:absolute;left:-20px;top:11px;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.4)}.event-timeline-day.is-stuck>i{opacity:0}.event-timeline-day>span{display:flex;align-items:baseline;gap:5px}.event-timeline-day strong{font-size:.875rem;font-weight:600}.event-timeline-day small{color:rgba(255,255,255,.45);font-size:.8125rem}
.event-timeline-cards{display:grid;gap:15px}.event-timeline-card{display:flex;min-height:150px;padding:13px;justify-content:space-between;gap:18px;border:1px solid rgba(255,255,255,.075);border-radius:12px;color:inherit;background:var(--event-timeline-card-bg);cursor:pointer;transition:border-color .16s ease}.event-timeline-card:hover{border-color:rgba(255,255,255,.24)}
.event-timeline-copy{min-width:0;flex:1 1 auto;overflow:hidden}.event-timeline-copy time{color:rgba(255,255,255,.48);font-size:.875rem;font-weight:600}.event-timeline-copy h3{margin:8px 0 9px;color:inherit;font-size:1.05rem;font-weight:600;line-height:1.3}.event-timeline-copy p{display:flex;align-items:center;gap:6px;margin:5px 0;overflow:hidden;color:rgba(255,255,255,.48);font-size:.8125rem;font-weight:500;white-space:nowrap}.event-timeline-copy p svg{flex:0 0 auto}.event-timeline-copy p span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-timeline-copy small{display:inline-block;margin-top:8px;padding:3px 7px;border-radius:4px;color:#84da91;background:rgba(39,153,61,.18);font-size:.7rem;font-weight:600}
.event-timeline-image{display:grid;width:120px;height:120px;flex:0 0 120px;overflow:hidden;place-items:center;border-radius:8px;color:rgba(255,255,255,.28);background:rgba(0,0,0,.22)}.event-timeline-image img{width:100%;height:100%;object-fit:cover}.event-timeline-empty{padding:25px;border:1px solid rgba(255,255,255,.07);border-radius:12px;color:rgba(255,255,255,.48);background:rgba(255,255,255,.055);font-size:.875rem}
@media(max-width:760px){.event-timeline-image{width:88px;height:88px;flex-basis:88px}.event-timeline-card{min-height:114px}}
`;

export default EventTimelineList;
