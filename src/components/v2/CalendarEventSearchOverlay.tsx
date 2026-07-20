import * as React from 'react';
import { ArrowRight, MapPin, Search, Sparkles, X } from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';

type Props = { open: boolean; events: any[]; organization: any; canManage: boolean; onClose: () => void; onEventClick: (event: any) => void; onManage: (event: any) => void };

export default function CalendarEventSearchOverlay({ open, events, organization, canManage, onClose, onEventClick, onManage }: Props) {
  const [query, setQuery] = React.useState('');
  React.useEffect(() => {
    if (!open) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', escape);
    return () => { releaseScrollLock(); window.removeEventListener('keydown', escape); };
  }, [open, onClose]);
  React.useEffect(() => { if (!open) setQuery(''); }, [open]);
  const results = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return [];
    return events.filter((event) => [event.name, event.locationAddress, event.location, event.locationName, event.venue]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(normalized)));
  }, [events, query]);
  if (!open) return null;
  return (
    <div className="cp-search-overlay" role="dialog" aria-modal="true" aria-label="Buscar eventos">
      <button className="cp-search-close" type="button" onClick={onClose} aria-label="Fechar busca"><X size={16} /></button>
      <div className="cp-search-shell">
        <label className="cp-search-input"><Search size={22} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar eventos..." /></label>
        {results.length ? <div className="cp-search-results">{results.map((event) => {
          const image = resolveImageUrl(event.bannerUrl || event.banner || event.image);
          const date = new Date(event.startDate);
          const dateText = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
          const avatar = resolveImageUrl(event.organizerPhotoUrl || event.organizer?.photoUrl || organization?.logoUrl);
          const organizer = String(event.registrationForm?.externalHost || event.organizerName || organization?.name || 'Organizador').trim().split(/\s+/)[0];
          const external = Boolean(event.isExternal || event.externalUrl || event.externalLink);
          return <article key={event.id} onClick={() => onEventClick(event)}>
            <div className="cp-search-cover">{image ? <img src={image} alt="" /> : <Search size={25} />}</div>
            <div><time>{dateText}</time><h3><Sparkles size={12} />{event.name}</h3><p>{avatar && <img src={avatar} alt="" />}Por {organizer}</p><p>{event.locationAddress || event.locationName || event.venue || event.location}</p>{canManage && !external && <button type="button" onClick={(e) => { e.stopPropagation(); onManage(event); }}>Gerenciar Evento <ArrowRight size={14} /></button>}</div>
          </article>;
        })}</div> : <div className="cp-search-empty"><div><Search /></div><h2>Nenhum Resultado Encontrado</h2><p>Por favor, tente pesquisar por outra coisa.</p></div>}
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
.cp-search-overlay{position:fixed;inset:0;z-index:6000;overflow:auto;color:#fff;background:radial-gradient(650px 350px at 50% -80px,rgba(34,53,94,.25),transparent 75%),radial-gradient(340px 520px at 28% 18%,rgba(111,55,33,.12),transparent 80%),#19191a}.cp-search-close{position:fixed;top:22px;right:22px;display:grid;width:30px;height:30px;place-items:center;border:0;border-radius:50%;color:rgba(255,255,255,.52);background:rgba(255,255,255,.08);cursor:pointer}.cp-search-shell{width:min(790px,calc(100% - 40px));margin:72px auto}.cp-search-input{display:flex;align-items:center;gap:12px;padding:0 0 11px;border-bottom:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.48)}.cp-search-input:focus-within{border-color:rgba(255,255,255,.8);color:#fff}.cp-search-input input{width:100%;border:0;outline:0;color:#fff;background:transparent;font:500 25px/1.3 Inter,sans-serif}.cp-search-input input::placeholder{color:rgba(255,255,255,.32)}.cp-search-empty{display:grid;justify-items:center;margin-top:85px;text-align:center;color:rgba(255,255,255,.48)}.cp-search-empty>div{display:grid;width:130px;height:130px;place-items:center;border:12px solid rgba(255,255,255,.09);border-radius:50%;box-shadow:0 16px 22px rgba(0,0,0,.25),inset 0 0 18px rgba(255,255,255,.05);transform:rotate(-8deg)}.cp-search-empty svg{width:88px;height:88px;stroke-width:1.5}.cp-search-empty h2{margin:58px 0 10px;font-size:18px}.cp-search-empty p{margin:0;font-size:14px}.cp-search-results{margin-top:25px}.cp-search-results article{display:flex;width:max-content;max-width:100%;gap:18px;padding:0;cursor:pointer}.cp-search-cover{display:grid;width:104px;height:104px;flex:0 0 104px;overflow:hidden;place-items:center;border-radius:9px;color:rgba(255,255,255,.3);background:rgba(255,255,255,.06)}.cp-search-cover img{width:100%;height:100%;object-fit:cover}.cp-search-results time{color:rgba(255,255,255,.5);font-size:13px;font-weight:600}.cp-search-results h3{display:flex;align-items:center;gap:6px;margin:6px 0;font-size:16px}.cp-search-results h3 svg{color:#ff5a9b}.cp-search-results p{display:flex;align-items:center;gap:6px;margin:5px 0;color:rgba(255,255,255,.5);font-size:13px}.cp-search-results p img{width:17px;height:17px;border-radius:50%;object-fit:cover}.cp-search-results button{display:flex;align-items:center;gap:6px;margin-top:10px;padding:7px 10px;border:0;border-radius:7px;color:rgba(255,255,255,.7);background:rgba(255,255,255,.1);font-size:12px;font-weight:650;cursor:pointer}
@media(max-width:600px){.cp-search-shell{margin-top:58px}.cp-search-input input{font-size:20px}.cp-search-results article{width:100%}.cp-search-cover{width:86px;height:86px;flex-basis:86px}}
.cp-search-overlay{background:radial-gradient(650px 350px at 50% -80px,rgba(34,53,94,.18),transparent 75%),radial-gradient(340px 520px at 28% 18%,rgba(111,55,33,.10),transparent 80%),rgba(19,20,22,.84);backdrop-filter:blur(22px) saturate(125%);-webkit-backdrop-filter:blur(22px) saturate(125%);animation:cp-search-fade .24s ease both}.cp-search-shell{animation:cp-search-shell-in .32s cubic-bezier(.2,.78,.25,1) both}.cp-search-empty,.cp-search-results{animation:cp-search-content .34s .06s cubic-bezier(.2,.78,.25,1) both}.cp-search-close{transition:color .18s ease,background .18s ease,transform .18s ease}.cp-search-close:hover{color:#fff;background:rgba(255,255,255,.14);transform:rotate(5deg) scale(1.05)}.cp-search-close:active{transform:scale(.9)}.cp-search-input{transition:border-color .2s ease,color .2s ease}
@keyframes cp-search-fade{from{opacity:0}to{opacity:1}}@keyframes cp-search-shell-in{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}@keyframes cp-search-content{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;
