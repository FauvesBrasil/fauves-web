import * as React from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, ChevronRight, Link2, Loader2, MapPin, Plus, Sparkles, Tag, X } from 'lucide-react';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';

type Props = {
  organization: any;
  user: any;
  canManage: boolean;
  accentColor: string;
  onCreateNew: () => void;
  onAdded: () => void | Promise<void>;
};

type ModalKind = 'existing' | 'external' | null;

const localInputValue = (date: Date) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
};

const initialExternalForm = () => {
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(start.getTime() + 60 * 60_000);
  return {
    url: '', name: '', location: '', host: '',
    startDate: localInputValue(start), endDate: localInputValue(end),
  };
};

const eventImage = (event: any) => resolveImageUrl(event?.bannerUrl || event?.banner || event?.image);
const eventTitle = (event: any) => event?.name || event?.title || 'Evento sem título';
const eventDate = (value: string) => {
  if (!value) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
};

export default function CalendarAddEventMenu({
  organization, user, canManage, accentColor, onCreateNew, onAdded,
}: Props) {
  const { toast } = useToast();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [modal, setModal] = React.useState<ModalKind>(null);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<any[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [showTags, setShowTags] = React.useState(false);
  const [eventUrl, setEventUrl] = React.useState('');
  const [external, setExternal] = React.useState(initialExternalForm);
  const [working, setWorking] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', escape); };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && !working && closeModal();
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape); };
  }, [modal, working]);

  const loadModalData = React.useCallback(async () => {
    const [tagsResponse, eventsResponse] = await Promise.all([
      fetchApi(`/api/organization/${organization.id}/tags/public`),
      user?.id ? fetchApi(`/api/events/by-user?userId=${encodeURIComponent(user.id)}`) : Promise.resolve(null),
    ]);
    if (tagsResponse.ok) {
      const data = await tagsResponse.json();
      setTags(Array.isArray(data) ? data : []);
    }
    if (eventsResponse?.ok) {
      const data = await eventsResponse.json();
      setSuggestions((Array.isArray(data) ? data : [])
        .filter((event: any) => event.organizationId !== organization.id && event.organizerId !== organization.id)
        .slice(0, 4));
    }
  }, [organization.id, user?.id]);

  const openModal = (kind: Exclude<ModalKind, null>) => {
    setMenuOpen(false);
    setModal(kind);
    setSelectedTags([]);
    setShowTags(false);
    void loadModalData();
  };

  const closeModal = () => {
    setModal(null);
    setEventUrl('');
    setExternal(initialExternalForm());
    setSelectedTags([]);
    setShowTags(false);
  };

  const assignTags = async (eventId: string) => {
    await Promise.all(selectedTags.map((tagId) => fetchApi(
      `/api/organization/${organization.id}/tags/${tagId}/assignment`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: eventId, assigned: true }) },
    )));
  };

  const finish = async (message: string, eventId: string) => {
    await assignTags(eventId);
    await onAdded();
    toast({ title: message });
    closeModal();
  };

  const attachEvent = async (event: any) => {
    if (!event?.id || working) return;
    setWorking(true);
    try {
      const response = await fetchApi(`/api/organization/${organization.id}/events/attach`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: event.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Não foi possível adicionar o evento');
      await finish('Evento adicionado ao calendário', event.id);
    } catch (error: any) {
      toast({ title: 'Não foi possível adicionar', description: error?.message, variant: 'destructive' });
    } finally { setWorking(false); }
  };

  const findAndAttach = async () => {
    const raw = eventUrl.trim();
    if (!raw) return;
    setWorking(true);
    try {
      let key = raw;
      try {
        const url = new URL(raw);
        key = url.pathname.split('/').filter(Boolean).pop() || '';
      } catch { key = raw.split('/').filter(Boolean).pop() || raw; }
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
      const lookup = await fetchApi(uuid ? `/api/event/${key}` : `/api/event/slug/${encodeURIComponent(key)}`);
      const event = await lookup.json().catch(() => ({}));
      if (!lookup.ok || !event?.id) throw new Error('Evento não encontrado. Verifique a URL informada.');
      setWorking(false);
      await attachEvent(event);
    } catch (error: any) {
      toast({ title: 'Evento não encontrado', description: error?.message, variant: 'destructive' });
      setWorking(false);
    }
  };

  const createExternal = async () => {
    if (!external.url.trim() || !external.name.trim() || !external.startDate || !external.endDate) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (new Date(external.endDate) <= new Date(external.startDate)) {
      toast({ title: 'O término deve ser depois do início', variant: 'destructive' });
      return;
    }
    try { new URL(external.url); } catch {
      toast({ title: 'Informe uma URL válida', variant: 'destructive' });
      return;
    }
    setWorking(true);
    try {
      const response = await fetchApi('/api/event/json', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: external.name.trim(), organizerId: organization.id, organizationId: organization.id,
          startDate: new Date(external.startDate).toISOString(), endDate: new Date(external.endDate).toISOString(),
          location: external.location.trim() ? 'Local' : 'Local será anunciado em breve',
          locationAddress: external.location.trim() || null, status: 'Publicado', isPublished: true,
          isExternal: true, externalUrl: external.url.trim(), externalLink: external.url.trim(),
          registrationForm: { externalHost: external.host.trim() || null },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.id) throw new Error(data?.message || data?.error || 'Não foi possível criar o evento');
      await finish('Evento externo adicionado', data.id);
    } catch (error: any) {
      toast({ title: 'Não foi possível adicionar', description: error?.message, variant: 'destructive' });
    } finally { setWorking(false); }
  };

  const toggleTag = (id: string) => setSelectedTags((current) => current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id]);

  const tagPicker = tags.length ? (
    <div className="cae-tags-wrap">
      <button type="button" className="cae-tag-trigger" onClick={() => setShowTags((value) => !value)}><Plus size={15} /> Adicionar Tag{selectedTags.length ? ` (${selectedTags.length})` : ''}</button>
      {showTags && <div className="cae-tags">{tags.map((tagItem) => <button key={tagItem.id} type="button" className={selectedTags.includes(tagItem.id) ? 'is-selected' : ''} onClick={() => toggleTag(tagItem.id)}><i style={{ background: tagItem.color }} />{tagItem.name}</button>)}</div>}
    </div>
  ) : null;

  const modalNode = modal && typeof document !== 'undefined' ? createPortal(
    <div className="cae-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !working && closeModal()}>
      <section className={`cae-modal cae-modal--${modal}`} role="dialog" aria-modal="true" aria-label={modal === 'existing' ? 'Adicionar evento existente' : 'Adicionar evento externo'} style={{ '--cae-accent': accentColor } as React.CSSProperties}>
        <header><h2>{modal === 'existing' ? 'Adicionar Evento Fauves' : 'Adicionar Evento Externo'}</h2><button type="button" onClick={closeModal} disabled={working} aria-label="Fechar"><X /></button></header>
        {modal === 'existing' ? <div className="cae-body">
          <label className="cae-url-input"><Link2 /><input autoFocus value={eventUrl} onChange={(event) => setEventUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void findAndAttach()} placeholder="Insira a URL do evento Fauves" /></label>
          {suggestions.length > 0 && <div className="cae-suggestions"><strong>Eventos Sugeridos</strong>{suggestions.map((event) => <button type="button" key={event.id} onClick={() => void attachEvent(event)} disabled={working}><span className="cae-suggestion-image">{eventImage(event) ? <img src={eventImage(event)} alt="" /> : <CalendarPlus />}</span><span><b>{eventTitle(event)}</b><small>{eventDate(event.startDate)}</small></span><Plus /></button>)}</div>}
          {tagPicker}
          <button className="cae-submit" type="button" disabled={!eventUrl.trim() || working} onClick={() => void findAndAttach()}>{working ? <Loader2 className="cae-spin" /> : null}Adicionar Evento</button>
        </div> : <div className="cae-body cae-form">
          <label><span>URL da página do evento *</span><input autoFocus type="url" value={external.url} onChange={(event) => setExternal({ ...external, url: event.target.value })} placeholder="https://eventbrite.com/e/seu-evento" /></label>
          <label><span>Nome do Evento *</span><input value={external.name} onChange={(event) => setExternal({ ...external, name: event.target.value })} placeholder="Happy Hour" /></label>
          <label><span>Local do Evento</span><span className="cae-input-icon"><MapPin /><input value={external.location} onChange={(event) => setExternal({ ...external, location: event.target.value })} placeholder="Qual é o endereço?" /></span></label>
          <label><span>Anfitrião</span><input value={external.host} onChange={(event) => setExternal({ ...external, host: event.target.value })} placeholder="Nome do anfitrião" /></label>
          <fieldset><legend>Horário do Evento *</legend><div><label><small>Início</small><input type="datetime-local" value={external.startDate} onChange={(event) => setExternal({ ...external, startDate: event.target.value })} /></label><ChevronRight /><label><small>Término</small><input type="datetime-local" value={external.endDate} onChange={(event) => setExternal({ ...external, endDate: event.target.value })} /></label></div><p>🌐 GMT-03:00 Fortaleza</p></fieldset>
          {tagPicker}
          <button className="cae-submit" type="button" disabled={working} onClick={() => void createExternal()}>{working ? <Loader2 className="cae-spin" /> : null}Adicionar Evento</button>
        </div>}
      </section>
    </div>, document.body,
  ) : null;

  return <>
    <div className="cae-root" ref={rootRef} style={{ '--cae-accent': accentColor } as React.CSSProperties}>
      <button type="button" className="calendar-add-event-button cae-main" onClick={() => canManage ? setMenuOpen((value) => !value) : onCreateNew()} aria-expanded={canManage ? menuOpen : undefined}><Plus size={15} /> Adicionar Evento</button>
      {menuOpen && <div className="cae-menu" role="menu">
        <button type="button" onClick={onCreateNew}><Plus /><span>Criar Novo Evento</span></button>
        <button type="button" onClick={() => openModal('existing')}><Sparkles /><span>Adicionar Evento Fauves<br />Existente</span></button>
        <button type="button" onClick={() => openModal('external')}><Link2 /><span>Adicionar Evento Externo</span></button>
      </div>}
    </div>
    {modalNode}
    <style>{styles}</style>
  </>;
}

const styles = `
.cae-root{position:relative;min-width:0;flex:1}.cae-main{width:100%;height:34px;display:flex;align-items:center;justify-content:center;gap:7px;padding:0 14px;border:0;border-radius:8px;color:#fff;background:color-mix(in srgb,var(--cae-accent) 18%,rgba(255,255,255,.08));font-size:12px;font-weight:650;cursor:pointer;transition:background .18s ease,color .18s ease,transform .18s ease}.cae-main:hover{background:color-mix(in srgb,var(--cae-accent) 30%,rgba(255,255,255,.1));color:#fff}.cae-main:active{transform:scale(.985)}
.cae-menu{position:absolute;z-index:120;top:calc(100% + 10px);right:0;width:285px;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:linear-gradient(145deg,rgba(55,49,48,.82),rgba(31,27,27,.78));box-shadow:0 16px 38px rgba(0,0,0,.22);backdrop-filter:blur(24px) saturate(135%);-webkit-backdrop-filter:blur(24px) saturate(135%);animation:cae-menu-in .2s cubic-bezier(.2,.8,.2,1) both;transform-origin:85% 0}.cae-menu:before{content:'';position:absolute;right:29px;top:-6px;width:12px;height:12px;transform:rotate(45deg);background:rgba(53,47,46,.9);border-left:1px solid rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.08)}.cae-menu button{position:relative;display:grid;width:100%;grid-template-columns:28px 1fr;align-items:center;gap:9px;padding:10px 12px;border:0;border-radius:7px;color:rgba(255,255,255,.95);background:transparent;text-align:left;font-size:14px;line-height:1.35;cursor:pointer;transition:background .16s ease,color .16s ease}.cae-menu button:hover{background:rgba(255,255,255,.10);color:#fff}.cae-menu svg{width:19px;color:rgba(255,255,255,.58)}
.cae-backdrop{position:fixed;inset:0;z-index:6500;display:grid;overflow:auto;place-items:center;padding:28px;background:rgba(3,3,4,.52);backdrop-filter:blur(16px) saturate(115%);-webkit-backdrop-filter:blur(16px) saturate(115%);animation:cae-fade .2s ease both}.cae-modal{width:min(620px,100%);max-height:calc(100vh - 56px);overflow:auto;border:1px solid rgba(255,255,255,.10);border-radius:20px;color:#f9f9f9;background:linear-gradient(145deg,rgba(39,40,47,.82),rgba(25,22,22,.78));box-shadow:0 24px 65px rgba(0,0,0,.24);backdrop-filter:blur(30px) saturate(135%);-webkit-backdrop-filter:blur(30px) saturate(135%);animation:cae-modal-in .3s cubic-bezier(.2,.82,.2,1) both}.cae-modal--existing{width:min(570px,100%)}.cae-modal>header{position:sticky;z-index:3;top:0;display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(70,71,81,.46);backdrop-filter:blur(22px)}.cae-modal h2{margin:0;font-size:19px;line-height:1.2}.cae-modal>header button{display:grid;width:34px;height:34px;place-items:center;border:0;border-radius:50%;color:rgba(255,255,255,.68);background:rgba(255,255,255,.09);cursor:pointer;transition:background .16s,color .16s,transform .16s}.cae-modal>header button:hover{color:#fff;background:rgba(255,255,255,.16);transform:rotate(4deg)}.cae-modal>header svg{width:19px}.cae-body{padding:20px 22px}.cae-url-input,.cae-input-icon{display:flex;align-items:center;gap:9px}.cae-url-input{height:48px;padding:0 14px;border:1px solid rgba(255,255,255,.25);border-radius:10px;background:rgba(10,13,14,.56)}.cae-url-input:focus-within{border-color:rgba(255,255,255,.8)}.cae-url-input svg,.cae-input-icon>svg{width:18px;color:rgba(255,255,255,.4)}.cae-url-input input,.cae-form input{width:100%;min-width:0;border:0;outline:0;color:#fff;background:transparent;font:500 14px/1.3 Inter,sans-serif}.cae-url-input input::placeholder,.cae-form input::placeholder{color:rgba(255,255,255,.32)}
.cae-suggestions{margin-top:16px;padding:13px;border:1px dashed rgba(255,255,255,.13);border-radius:12px}.cae-suggestions>strong{display:block;margin:0 0 7px;color:rgba(255,255,255,.52);font-size:12px}.cae-suggestions>button{display:grid;width:100%;grid-template-columns:34px minmax(0,1fr) 24px;align-items:center;gap:10px;padding:7px;border:0;border-radius:8px;color:#fff;background:transparent;text-align:left;cursor:pointer;transition:background .16s}.cae-suggestions>button:hover{background:rgba(255,255,255,.08)}.cae-suggestion-image{display:grid;width:34px;height:34px;overflow:hidden;place-items:center;border-radius:7px;background:rgba(255,255,255,.06)}.cae-suggestion-image img{width:100%;height:100%;object-fit:cover}.cae-suggestions b,.cae-suggestions small{display:block}.cae-suggestions b{font-size:13px}.cae-suggestions small{margin-top:2px;color:rgba(255,255,255,.48);font-size:11px}.cae-suggestions>button>svg{width:17px;color:rgba(255,255,255,.55)}
.cae-tags-wrap{position:relative;margin-top:15px}.cae-tag-trigger{display:flex;align-items:center;gap:5px;padding:6px 9px;border:0;border-radius:999px;color:rgba(255,255,255,.54);background:rgba(255,255,255,.08);font-size:12px;font-weight:650;cursor:pointer}.cae-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(10,10,11,.24);animation:cae-content-in .18s ease both}.cae-tags button{display:flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid rgba(255,255,255,.1);border-radius:999px;color:rgba(255,255,255,.66);background:transparent;font-size:11px;cursor:pointer}.cae-tags button.is-selected{border-color:color-mix(in srgb,var(--cae-accent) 70%,white);color:#fff;background:color-mix(in srgb,var(--cae-accent) 20%,transparent)}.cae-tags i{width:7px;height:7px;border-radius:50%}.cae-submit{display:flex;width:100%;height:46px;align-items:center;justify-content:center;gap:8px;margin-top:18px;border:0;border-radius:10px;color:#171717;background:rgba(255,255,255,.97);font-size:14px;font-weight:750;cursor:pointer;transition:background .18s,transform .18s,opacity .18s}.cae-submit:hover:not(:disabled){background:#fff}.cae-submit:active:not(:disabled){transform:scale(.99)}.cae-submit:disabled{opacity:.38;cursor:not-allowed}.cae-spin{width:17px;animation:cae-spin .8s linear infinite}
.cae-form{display:grid;gap:14px}.cae-form>label>span:first-child,.cae-form fieldset>legend{display:block;margin:0 0 7px;color:rgba(255,255,255,.78);font-size:13px;font-weight:650}.cae-form>label>input,.cae-input-icon{box-sizing:border-box;height:46px;padding:0 13px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(8,11,12,.48)}.cae-form>label>input:focus,.cae-input-icon:focus-within{outline:0;border-color:rgba(255,255,255,.65)}.cae-input-icon input{height:100%}.cae-form fieldset{margin:0;padding:0;border:0}.cae-form fieldset>div{display:grid;grid-template-columns:minmax(0,1fr) 22px minmax(0,1fr);align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.15);border-bottom:0;border-radius:10px 10px 0 0;background:rgba(8,11,12,.48)}.cae-form fieldset label small{display:block;margin-bottom:3px;color:rgba(255,255,255,.4);font-size:10px}.cae-form fieldset input{color-scheme:dark;font-size:12px}.cae-form fieldset>div>svg{width:17px;color:rgba(255,255,255,.5)}.cae-form fieldset>p{margin:0;padding:9px 12px;border:1px solid rgba(255,255,255,.15);border-radius:0 0 10px 10px;color:rgba(255,255,255,.58);background:rgba(8,11,12,.48);font-size:11px}
@keyframes cae-menu-in{from{opacity:0;transform:translateY(-5px) scale(.97)}to{opacity:1;transform:none}}@keyframes cae-fade{from{opacity:0}to{opacity:1}}@keyframes cae-modal-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes cae-content-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}@keyframes cae-spin{to{transform:rotate(360deg)}}
@media(max-width:640px){.cae-backdrop{align-items:end;padding:10px}.cae-modal{max-height:calc(100vh - 20px);border-radius:17px}.cae-modal>header,.cae-body{padding-left:16px;padding-right:16px}.cae-menu{right:0;width:min(285px,calc(100vw - 32px))}.cae-form fieldset>div{grid-template-columns:1fr}.cae-form fieldset>div>svg{display:none}.cae-form fieldset label+label{margin-top:10px}}
`;
