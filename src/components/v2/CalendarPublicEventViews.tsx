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
  onEventClick: (event: any) => void;
  onManage: (event: any) => void;
  onEditExternal: (event: any) => void;
  onRemoveExternal: (event: any) => void;
};

const dateKey = (value: string) => new Date(value).toDateString();
const dateLabel = (value: string) => {
  const date = new Date(value);
  const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    .format(date)
    .replace(' de ', ' de ');
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  return { dayMonth, weekday };
};
const timeLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const eventLocation = (event: any) => {
  if (event.locationCity) return [event.locationCity, event.locationUf].filter(Boolean).join(', ');
  return event.locationAddress || event.locationName || event.venue || (event.location === 'Local' ? '' : event.location) || '';
};

const organizerName = (event: any, organization: any) => {
  const fullName = event.registrationForm?.externalHost || event.organizerName || event.organizer?.name || event.createdByUser?.name || organization?.name || 'Organizador';
  return String(fullName).trim().split(/\s+/)[0];
};

export default function CalendarPublicEventViews({
  events, variant, organization, canManage = false, accentColor, cardBackground,
  cardBorder, textPrimary, textSecondary, onEventClick, onManage, onEditExternal, onRemoveExternal,
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

  if (!groups.length) return <div className="cp-event-empty">Nenhum evento encontrado.</div>;

  return (
    <div
      className={`cp-events cp-events--${variant}`}
      style={{
        '--cp-accent': accentColor,
        '--cp-card': cardBackground,
        '--cp-border': cardBorder,
        '--cp-primary': textPrimary,
        '--cp-secondary': textSecondary,
      } as React.CSSProperties}
    >
      {groups.map((group) => {
        const label = dateLabel(group[0].startDate);
        return (
          <section className="cp-event-group" key={dateKey(group[0].startDate)}>
            <header className="cp-event-date"><i /><strong>{label.dayMonth}</strong><span>{label.weekday}</span></header>
            <div className="cp-event-items">
              {group.map((event) => {
                const image = resolveImageUrl(event.bannerUrl || event.banner || event.image);
                const avatar = resolveImageUrl(event.organizerPhotoUrl || event.organizer?.photoUrl || organization?.logoUrl);
                const external = Boolean(event.isExternal || event.externalUrl || event.externalLink);
                if (external) return (
                  <article className={`cp-external-card ${variant === 'list' ? 'is-list' : ''}`} key={event.id} onClick={() => onEventClick(event)}>
                    <time>{timeLabel(event.startDate)}</time>
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
                    <div className="cp-event-card-copy">
                      <time>{timeLabel(event.startDate)}</time>
                      <h3><Sparkles size={14} />{event.name}</h3>
                      <p>{avatar && <img src={avatar} alt="" />}<span>Por {organizerName(event, organization)}</span></p>
                      {eventLocation(event) && <p><MapPin size={16} /><span>{eventLocation(event)}</span></p>}
                      {canManage && <button type="button" onClick={(e) => { e.stopPropagation(); onManage(event); }}>Gerenciar Evento <ArrowRight size={15} /></button>}
                    </div>
                    <div className="cp-event-cover">{image ? <img src={image} alt="" /> : <Sparkles size={28} />}</div>
                  </article>
                ) : (
                  <article className="cp-event-row" key={event.id} onClick={() => onEventClick(event)}>
                    <time>{timeLabel(event.startDate)}</time>
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
.cp-events{color:var(--cp-primary)}.cp-event-group{position:relative;margin-bottom:28px}.cp-event-date{display:flex;align-items:baseline;gap:7px;margin-bottom:16px;text-transform:lowercase}.cp-event-date strong{font-size:16px;font-weight:700}.cp-event-date span{color:var(--cp-secondary);font-size:15px;font-weight:650}.cp-event-items{display:grid;gap:12px}
.cp-events--cards .cp-event-group{padding-left:25px}.cp-events--cards .cp-event-group:before{content:'';position:absolute;left:5px;top:10px;bottom:-29px;border-left:2px dashed rgba(255,255,255,.09)}.cp-events--cards .cp-event-date i{position:absolute;left:1px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--cp-secondary)}
.cp-event-card{display:flex;min-height:190px;align-items:center;justify-content:space-between;gap:22px;padding:18px;border:1px solid var(--cp-border);border-radius:13px;background:var(--cp-card);cursor:pointer;transition:border-color .16s ease,background-color .16s ease}.cp-event-card:hover{border-color:rgba(255,255,255,.28)}.cp-event-card-copy{min-width:0;flex:1}.cp-event-card time,.cp-event-row time{color:var(--cp-secondary);font-size:15px;font-weight:650}.cp-event-card h3{display:flex;align-items:center;gap:7px;margin:8px 0 10px;font-size:20px;font-weight:700}.cp-event-card h3 svg{padding:4px;border-radius:50%;box-sizing:content-box;color:#ff6ba8;background:rgba(213,23,109,.18)}.cp-event-card p,.cp-event-row p{display:flex;align-items:center;gap:7px;margin:6px 0;color:var(--cp-secondary);font-size:14px;font-weight:550}.cp-event-card p img,.cp-event-row p img{width:18px;height:18px;border-radius:50%;object-fit:cover}.cp-event-card button{display:inline-flex;align-items:center;gap:7px;margin-top:16px;padding:8px 12px;border:0;border-radius:8px;color:rgba(255,255,255,.70);background:rgba(255,255,255,.10);font-size:13px;font-weight:650;cursor:pointer;transition:background .16s,color .16s}.cp-event-card button:hover{color:#fff;background:rgba(255,255,255,.17)}.cp-event-cover{display:grid;width:120px;height:120px;flex:0 0 120px;overflow:hidden;place-items:center;border-radius:10px;color:var(--cp-secondary);background:rgba(255,255,255,.04)}.cp-event-cover img{width:100%;height:100%;object-fit:cover}
.cp-events--list .cp-event-date{padding-bottom:13px;border-bottom:1px solid var(--cp-border)}.cp-events--list .cp-event-date i{display:none}.cp-event-row{display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:18px;min-height:112px;align-items:start;margin:0 -12px;padding:18px 12px;border-radius:11px;cursor:pointer;transition:background .15s ease}.cp-event-row:hover{background:rgba(255,255,255,.075)}.cp-event-row-copy h3{margin:0 0 8px;font-size:17px;font-weight:650}.cp-event-row p{margin:5px 0}.cp-event-organizing{align-self:start;padding:4px 8px;border-radius:5px;color:#d976ff;background:rgba(174,51,213,.20);font-size:12px;font-weight:700}
.cp-external-card{position:relative;min-height:178px;padding:18px 20px;border:1px solid var(--cp-border);border-radius:13px;background:var(--cp-card);cursor:pointer;transition:border-color .16s ease,background .16s ease}.cp-external-card:hover{border-color:rgba(255,255,255,.28)}.cp-external-card time{color:var(--cp-secondary);font-size:15px;font-weight:650}.cp-external-card h3{display:flex;align-items:center;gap:8px;margin:9px 0 12px;font-size:20px;font-weight:700}.cp-external-card h3 svg{width:17px;color:var(--cp-secondary)}.cp-external-card p{display:flex;align-items:center;gap:8px;margin:7px 0;color:var(--cp-secondary);font-size:14px;font-weight:550}.cp-external-card p svg{width:17px;height:17px}.cp-external-footer{display:flex;align-items:flex-end;justify-content:space-between;margin-top:17px}.cp-external-footer>span{padding:4px 8px;border-radius:5px;color:var(--cp-secondary);background:rgba(255,255,255,.09);font-size:11px;font-weight:700}.cp-external-actions{position:relative}.cp-external-more{position:relative;display:grid;width:30px;height:25px;place-items:center;border:0;color:var(--cp-secondary);background:transparent;cursor:pointer}.cp-external-more svg{width:19px}.cp-external-more:before{content:attr(data-label);position:absolute;right:-6px;bottom:calc(100% + 12px);padding:7px 10px;border-radius:8px;color:#171717;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.18);font-size:12px;font-weight:500;opacity:0;pointer-events:none;transform:translateY(3px);transition:opacity .15s,transform .15s}.cp-external-more:after{content:'';position:absolute;right:7px;bottom:calc(100% + 7px);border:5px solid transparent;border-top-color:#fff;opacity:0;transition:opacity .15s}.cp-external-more:hover:before,.cp-external-more:hover:after{opacity:1;transform:none}.cp-external-menu{position:absolute;z-index:30;right:-2px;top:calc(100% + 8px);width:215px;padding:6px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:linear-gradient(145deg,rgba(54,47,46,.9),rgba(29,25,25,.88));box-shadow:0 15px 35px rgba(0,0,0,.25);backdrop-filter:blur(22px) saturate(130%);animation:cp-actions-in .18s cubic-bezier(.2,.8,.2,1) both}.cp-external-menu:before{content:'';position:absolute;right:12px;top:-5px;width:10px;height:10px;transform:rotate(45deg);background:rgba(48,42,41,.94);border-left:1px solid rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.08)}.cp-external-menu button{display:flex;width:100%;align-items:center;gap:10px;padding:9px 10px;border:0;border-radius:7px;color:rgba(255,255,255,.92);background:transparent;text-align:left;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}.cp-external-menu button:hover{background:rgba(255,255,255,.09)}.cp-external-menu svg{width:17px;color:rgba(255,255,255,.55)}.cp-external-card.is-list{min-height:140px;margin:0 -12px;border-color:transparent;background:transparent}.cp-external-card.is-list:hover{background:rgba(255,255,255,.065)}@keyframes cp-actions-in{from{opacity:0;transform:translateY(-5px) scale(.97)}to{opacity:1;transform:none}}
.cp-event-empty{padding:42px 20px;text-align:center;color:rgba(255,255,255,.45);font-size:14px}
.cp-events{animation:cp-view-enter .28s cubic-bezier(.2,.78,.25,1) both}
@keyframes cp-view-enter{from{opacity:0;transform:translateY(7px);filter:blur(2px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
@media(max-width:640px){.cp-event-card{min-height:145px;padding:14px}.cp-event-cover{width:88px;height:88px;flex-basis:88px}.cp-event-card h3,.cp-external-card h3{font-size:17px}.cp-event-row{grid-template-columns:58px minmax(0,1fr)}.cp-event-organizing{grid-column:2}.cp-event-date strong{font-size:15px}.cp-event-date span{font-size:13px}.cp-external-menu{right:-4px;width:205px}}
`;
