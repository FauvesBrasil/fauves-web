import * as React from 'react';
import { ArrowRight, ExternalLink, MapPin, MoreHorizontal, Pencil, Sparkles, Trash2, UserRoundCog } from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';

type Props = {
  events: any[];
  variant: 'cards' | 'list';
  organization: any;
  canManage?: boolean;
  accentColor: string;
  cardBackground: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  isDark: boolean;
  onEventClick: (event: any) => void;
  onManage: (event: any) => void;
  onEditExternal: (event: any) => void;
  onRemoveExternal: (event: any) => void;
};

const DISPLAY_TIMEZONE = 'America/Sao_Paulo';
const STICKY_DATE_OFFSET = 24;

const dateKey = (value: string | Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date(value));
const dateLabel = (value: string) => {
  const date = new Date(value);
  const dayMonth = dateKey(date) === dateKey(new Date())
    ? 'Hoje'
    : new Intl.DateTimeFormat('pt-BR', { timeZone: DISPLAY_TIMEZONE, day: 'numeric', month: 'short' }).format(date);
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone: DISPLAY_TIMEZONE, weekday: 'long' }).format(date);
  return { dayMonth, weekday };
};

const timeDetails = (event: any) => {
  const date = new Date(event.startDate);
  const primary = new Intl.DateTimeFormat('pt-BR', {
    timeZone: DISPLAY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  const timezone = event.timezone || event.timeZone;
  if (!timezone || timezone === DISPLAY_TIMEZONE || timezone === 'America/Fortaleza') return { primary, secondary: '' };
  if (!String(timezone).includes('/')) {
    return { primary, secondary: String(event.timezoneLabel || event.utcOffset || timezone) };
  }
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const localTime = `${parts.find((part) => part.type === 'hour')?.value || ''}:${parts.find((part) => part.type === 'minute')?.value || ''}`;
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value || '';
    const secondary = `${localTime} ${offset}`.trim();
    return { primary, secondary: secondary === `${primary} GMT-3` ? '' : secondary };
  } catch {
    return { primary, secondary: '' };
  }
};

const eventPriceLabel = (event: any) => {
  const ticketPrices = Array.isArray(event.ticketTypes)
    ? event.ticketTypes.filter((ticket: any) => !ticket?.isPrivate).map((ticket: any) => Number(ticket?.price)).filter(Number.isFinite)
    : [];
  const rawPrice = event.priceFrom ?? event.price ?? (ticketPrices.length ? Math.min(...ticketPrices) : null);
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') return '';
  const price = Number(rawPrice);
  if (!Number.isFinite(price)) return '';
  if (price === 0) return 'Grátis';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: event.currency || 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `R$ ${price.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
  }
};

const eventLocation = (event: any) => {
  if (event.locationCity) return [event.locationCity, event.locationUf].filter(Boolean).join(', ');
  return event.locationAddress || event.locationName || event.venue || (event.location === 'Local' ? '' : event.location) || '';
};

const organizerName = (event: any, organization: any) => {
  const fullName = event.registrationForm?.externalHost || event.organizerName || event.organizer?.name || event.createdByUser?.name || organization?.name || 'Organizador';
  return String(fullName).trim();
};

const StickyEventDate = ({ value }: { value: string }) => {
  const sentinelRef = React.useRef<HTMLSpanElement>(null);
  const [stuck, setStuck] = React.useState(false);
  const label = dateLabel(value);

  React.useLayoutEffect(() => {
    const update = () => {
      const top = sentinelRef.current?.getBoundingClientRect().top;
      const nextStuck = top !== undefined && top <= STICKY_DATE_OFFSET;
      setStuck((current) => current === nextStuck ? current : nextStuck);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    document.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      document.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, []);

  return <>
    <span ref={sentinelRef} className="cp-event-date-sentinel" aria-hidden="true" />
    <header className={`cp-event-date${stuck ? ' is-stuck' : ''}`}>
      <span className="cp-event-date-content"><i /><strong>{label.dayMonth}</strong><span>{label.weekday}</span></span>
    </header>
  </>;
};

export default function CalendarPublicEventViews({
  events, variant, organization, canManage = false, accentColor, cardBackground,
  cardBorder, textPrimary, textSecondary, isDark, onEventClick, onManage, onEditExternal, onRemoveExternal,
}: Props) {
  const [actionsEventId, setActionsEventId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!actionsEventId) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.cp-external-actions')) setActionsEventId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [actionsEventId]);
  const groups = React.useMemo(() => {
    const grouped = new Map<string, any[]>();
    events.forEach((event) => grouped.set(dateKey(event.startDate), [...(grouped.get(dateKey(event.startDate)) || []), event]));
    return [...grouped.values()];
  }, [events]);

  if (!groups.length) return (
    <div style={{ padding: '42px 20px', textAlign: 'center', color: textSecondary, fontSize: 14 }}>
      Nenhum evento encontrado.
    </div>
  );

  return (
    <div
      className={`cp-events cp-events--${variant}`}
      style={{
        '--cp-accent': accentColor,
        '--cp-card': cardBackground,
        '--cp-border': cardBorder,
        '--cp-primary': textPrimary,
        '--cp-secondary': textSecondary,
        '--cp-glass': isDark ? 'rgba(21,21,21,.64)' : 'rgba(255,255,255,.64)',
        '--cp-hover-border': isDark ? 'rgba(255,255,255,.16)' : 'rgba(21,21,21,.16)',
        '--cp-hover-shadow': isDark
          ? '0 28px 17px rgba(0,0,0,.012),0 12px 12px rgba(0,0,0,.02),0 3px 7px rgba(0,0,0,.02)'
          : '0 28px 17px rgba(0,0,0,.004),0 12px 12px rgba(0,0,0,.012),0 3px 7px rgba(0,0,0,.012)',
      } as React.CSSProperties}
    >
      {groups.map((group) => {
        return (
          <section className="cp-event-group" key={dateKey(group[0].startDate)}>
            <StickyEventDate value={group[0].startDate} />
            <div className="cp-event-items">
              {group.map((event) => {
                const image = resolveImageUrl(event.bannerUrl || event.banner || event.image);
                const avatar = resolveImageUrl(event.organizerPhotoUrl || event.organizer?.photoUrl || organization?.logoUrl);
                const external = Boolean(event.isExternal || event.externalUrl || event.externalLink);
                const timing = timeDetails(event);
                const price = eventPriceLabel(event);
                if (external) return (
                  <article className={`cp-external-card ${variant === 'list' ? 'is-list' : ''}`} key={event.id} onClick={() => onEventClick(event)}>
                    <time><span>{timing.primary}</span>{timing.secondary && <em> · {timing.secondary}</em>}</time>
                    <h3>{event.name}<ExternalLink /></h3>
                    <p><UserRoundCog /><span>Por {organizerName(event, organization)}</span></p>
                    {eventLocation(event) && <p><MapPin /><span>{eventLocation(event)}</span></p>}
                    <div className="cp-external-footer"><span>Externo</span>{canManage && <div className="cp-external-actions">
                      <button className="cp-external-more" type="button" aria-label="Ações" data-label="Ações" onClick={(clickEvent) => { clickEvent.stopPropagation(); setActionsEventId((current) => current === event.id ? null : event.id); }}><MoreHorizontal /></button>
                      {actionsEventId === event.id && <div className="cp-external-menu" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                        <button type="button" onClick={() => { setActionsEventId(null); onEditExternal(event); }}><Pencil />Editar Evento</button>
                        <button type="button" onClick={() => { setActionsEventId(null); onRemoveExternal(event); }}><Trash2 />Remover do Calendário</button>
                      </div>}
                    </div>}</div>
                  </article>
                );
                return variant === 'cards' ? (
                  <article className="cp-event-card" key={event.id} onClick={() => onEventClick(event)}>
                    <div className="cp-event-card-main">
                      <div className="cp-event-card-copy">
                        <time><span>{timing.primary}</span>{timing.secondary && <em> · {timing.secondary}</em>}</time>
                        <h3>{event.name}</h3>
                        <p>{avatar && <img src={avatar} alt="" />}<span>Por {organizerName(event, organization)}</span></p>
                        {eventLocation(event) && <p><MapPin size={16} /><span>{eventLocation(event)}</span></p>}
                        {canManage && <button type="button" onClick={(e) => { e.stopPropagation(); onManage(event); }}>Gerenciar Evento <ArrowRight size={15} /></button>}
                      </div>
                      <div className="cp-event-cover">{image ? <img src={image} alt="" /> : <Sparkles size={28} />}</div>
                    </div>
                    {price && <span className="cp-event-price">{price}</span>}
                  </article>
                ) : (
                  <article className="cp-event-row" key={event.id} onClick={() => onEventClick(event)}>
                    <time><span>{timing.primary}</span>{timing.secondary && <em> · {timing.secondary}</em>}</time>
                    <div className="cp-event-row-copy">
                      <h3>{event.name}</h3>
                      <p>{avatar && <img src={avatar} alt="" />}<span>Por {organizerName(event, organization)}</span></p>
                      {eventLocation(event) && <p><MapPin size={15} /><span>{eventLocation(event)}</span></p>}
                    </div>
                    {canManage && <span className="cp-event-organizing">Organizando</span>}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
.cp-events,.cp-event-group,.cp-event-items{width:100%;min-width:0;max-width:100%;box-sizing:border-box}.cp-events{color:var(--cp-primary)}.cp-event-group{position:relative;margin-bottom:24px;padding-bottom:0}.cp-event-date-sentinel{display:block;width:1px;height:0;pointer-events:none}.cp-event-date{position:relative;z-index:20;margin-bottom:14px;text-transform:lowercase}.cp-event-date-content{position:relative;display:inline-flex;align-items:baseline;gap:6px;border:1px solid transparent;border-radius:100px;background:transparent;transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease}.cp-event-date strong{font-size:16px;font-weight:600;text-transform:none}.cp-event-date-content>span{color:var(--cp-secondary);font-size:15px;font-weight:550}.cp-event-items{display:grid;gap:16px}
.cp-events--cards .cp-event-group{padding-left:24px}.cp-events--cards .cp-event-group:before{content:'';position:absolute;left:4px;top:16px;bottom:-25px;border-left:2px dashed var(--cp-border)}.cp-events--cards .cp-event-date i{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--cp-secondary);backdrop-filter:blur(16px)}
.cp-event-card{display:flex;width:100%;min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden;flex-direction:column;align-items:flex-start;gap:10px;padding:12px 12px 12px 16px;border:1px solid var(--cp-border);border-radius:12px;background:var(--cp-card);box-shadow:none;cursor:pointer;transition:border-color .16s ease,box-shadow .16s ease}.cp-event-card:hover{border-color:var(--cp-hover-border);box-shadow:var(--cp-hover-shadow)}.cp-event-card-main{display:flex;width:100%;min-width:0;align-items:flex-start;justify-content:space-between;gap:16px}.cp-event-card-copy{min-width:0;flex:1 1 0;overflow:hidden}.cp-event-card time,.cp-event-row time,.cp-external-card time{color:var(--cp-secondary);font-size:15px;font-weight:550;font-style:normal}.cp-event-card time em,.cp-event-row time em,.cp-external-card time em{color:#edb541;font-style:normal;font-weight:600}.cp-event-card h3{display:flex;align-items:center;gap:7px;margin:7px 0 8px;font-size:20px;line-height:1.12;font-weight:600}.cp-event-card h3 svg{padding:4px;border-radius:50%;box-sizing:content-box;color:#ff6ba8;background:rgba(213,23,109,.18)}.cp-event-card p,.cp-event-row p{display:flex;min-width:0;align-items:center;gap:6px;margin:5px 0;color:var(--cp-secondary);font-size:14px;font-weight:550}.cp-event-card p span,.cp-event-row p span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cp-event-card p img,.cp-event-row p img{width:18px;height:18px;flex:0 0 18px;border-radius:50%;object-fit:cover}.cp-event-card button{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:7px 10px;border:0;border-radius:8px;color:rgba(255,255,255,.64);background:rgba(255,255,255,.08);font-size:12px;font-weight:650;cursor:pointer;transition:background .16s,color .16s}.cp-event-card button:hover{color:#151515;background:rgba(255,255,255,.64)}.cp-event-cover{display:grid;width:120px;height:120px;flex:0 0 120px;overflow:hidden;place-items:center;border:.5px solid rgba(255,255,255,.04);border-radius:10px;color:var(--cp-secondary);background:rgba(255,255,255,.04)}.cp-event-cover img{width:100%;height:100%;object-fit:cover;transform:scale(1.005)}.cp-event-price{display:inline-flex;align-items:center;padding:4px 7px;border-radius:5px;color:#54c546;background:rgba(60,189,44,.13);font-size:11px;line-height:1;font-weight:700}
.cp-events--list .cp-event-date{padding-bottom:13px;border-bottom:1px solid var(--cp-border)}.cp-events--list .cp-event-date i{display:none}.cp-event-row{display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:18px;min-height:112px;align-items:start;margin:0 -12px;padding:18px 12px;border-radius:11px;cursor:pointer;transition:background .15s ease}.cp-event-row:hover{background:rgba(255,255,255,.075)}.cp-event-row-copy h3{margin:0 0 8px;font-size:17px;font-weight:650}.cp-event-row p{margin:5px 0}.cp-event-organizing{align-self:start;padding:4px 8px;border-radius:5px;color:#d976ff;background:rgba(174,51,213,.20);font-size:12px;font-weight:700}
.cp-external-card{position:relative;min-height:178px;padding:18px 20px;border:1px solid var(--cp-border);border-radius:12px;background:var(--cp-card);cursor:pointer;transition:border-color .16s ease,box-shadow .16s ease}.cp-external-card:hover{border-color:var(--cp-hover-border);box-shadow:var(--cp-hover-shadow)}.cp-external-card time{color:var(--cp-secondary);font-size:15px;font-weight:650}.cp-external-card h3{display:flex;align-items:center;gap:8px;margin:9px 0 12px;font-size:20px;font-weight:700}.cp-external-card h3 svg{width:17px;color:var(--cp-secondary)}.cp-external-card p{display:flex;align-items:center;gap:8px;margin:7px 0;color:var(--cp-secondary);font-size:14px;font-weight:550}.cp-external-card p svg{width:17px;height:17px}.cp-external-footer{display:flex;align-items:flex-end;justify-content:space-between;margin-top:17px}.cp-external-footer>span{padding:4px 8px;border-radius:5px;color:var(--cp-secondary);background:rgba(255,255,255,.08);font-size:11px;font-weight:700}.cp-external-actions{position:relative}.cp-external-more{position:relative;display:grid;width:30px;height:25px;place-items:center;border:0;color:var(--cp-secondary);background:transparent;cursor:pointer}.cp-external-more svg{width:19px}.cp-external-more:before{content:attr(data-label);position:absolute;right:-6px;bottom:calc(100% + 12px);padding:7px 10px;border-radius:8px;color:#171717;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.18);font-size:12px;font-weight:500;opacity:0;pointer-events:none;transform:translateY(3px);transition:opacity .15s,transform .15s}.cp-external-more:after{content:'';position:absolute;right:7px;bottom:calc(100% + 7px);border:5px solid transparent;border-top-color:#fff;opacity:0;transition:opacity .15s}.cp-external-more:hover:before,.cp-external-more:hover:after{opacity:1;transform:none}.cp-external-menu{position:absolute;z-index:30;right:-2px;top:calc(100% + 8px);width:215px;padding:6px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:linear-gradient(145deg,rgba(54,47,46,.9),rgba(29,25,25,.88));box-shadow:0 15px 35px rgba(0,0,0,.25);backdrop-filter:blur(22px) saturate(130%);animation:cp-actions-in .18s cubic-bezier(.2,.8,.2,1) both}.cp-external-menu:before{content:'';position:absolute;right:12px;top:-5px;width:10px;height:10px;transform:rotate(45deg);background:rgba(48,42,41,.94);border-left:1px solid rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.08)}.cp-external-menu button{display:flex;width:100%;align-items:center;gap:10px;padding:9px 10px;border:0;border-radius:7px;color:rgba(255,255,255,.92);background:transparent;text-align:left;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}.cp-external-menu button:hover{background:rgba(255,255,255,.09)}.cp-external-menu svg{width:17px;color:rgba(255,255,255,.55)}.cp-external-card.is-list{min-height:140px;margin:0 -12px;border-color:transparent;background:transparent;box-shadow:none}.cp-external-card.is-list:hover{background:rgba(255,255,255,.065);box-shadow:none}@keyframes cp-actions-in{from{opacity:0;transform:translateY(-5px) scale(.97)}to{opacity:1;transform:none}}
.cp-event-empty{padding:42px 20px;text-align:center;color:rgba(255,255,255,.45);font-size:14px}
@media(max-width:820px){.cp-event-group{margin-bottom:16px;padding-bottom:0}.cp-events--cards .cp-event-group{padding-left:24px}.cp-events--cards .cp-event-group:before{left:4px;top:16px;bottom:-17px}.cp-event-date{position:sticky;top:24px;z-index:20;width:max-content;max-width:calc(100% + 24px);margin-left:-24px;margin-bottom:14px;transform:translateY(-2px)}.cp-event-date-content{margin:-4px -12px -4px -12px;padding:4px 12px 4px 36px}.cp-events--list .cp-event-date{padding-bottom:0;border-bottom:0}.cp-events--cards .cp-event-date i{left:12px;top:50%;transform:translateY(-50%)}.cp-event-date.is-stuck .cp-event-date-content{border-color:var(--cp-border);background:var(--cp-glass);box-shadow:0 .7px 3px rgba(0,0,0,.25),0 2px 7px rgba(0,0,0,.30),0 3px 14px rgba(0,0,0,.35),0 7px 29px rgba(0,0,0,.40);-webkit-backdrop-filter:blur(16px) saturate(140%);backdrop-filter:blur(16px) saturate(140%)}.cp-events--list .cp-event-date{margin-left:0}.cp-events--list .cp-event-date-content{margin:-4px -12px;padding:4px 12px}.cp-event-items{gap:16px}.cp-event-card{gap:9px;padding:12px;border-radius:11px}.cp-event-card-main{gap:12px}.cp-event-card time,.cp-event-row time,.cp-external-card time{font-size:14px}.cp-event-card h3,.cp-external-card h3{display:-webkit-box;overflow:hidden;margin:7px 0 8px;font-size:18px;line-height:1.12;font-weight:600;-webkit-box-orient:vertical;-webkit-line-clamp:2}.cp-event-card p,.cp-event-row p{margin:5px 0;overflow:hidden;font-size:14px;white-space:nowrap}.cp-event-card p svg,.cp-event-row p svg{flex:0 0 auto;width:16px;height:16px}.cp-event-cover{width:90px;height:90px;flex-basis:90px;border-radius:8px}.cp-event-card button{margin-top:9px;padding:6px 9px;font-size:11px}.cp-event-price{padding:4px 7px;font-size:11px}.cp-event-row{grid-template-columns:58px minmax(0,1fr);gap:12px;min-height:100px;padding-top:14px;padding-bottom:14px}.cp-event-organizing{grid-column:2}.cp-event-date strong{font-size:16px}.cp-event-date-content>span{font-size:15px}.cp-external-card{width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;min-height:145px;padding:13px 14px}.cp-external-menu{right:-4px;width:205px}}
@media(max-width:450px){.cp-event-date{margin-bottom:10px}}
`;
