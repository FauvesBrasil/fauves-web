import * as React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronRight, ChevronsRight, Loader2, MapPin } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';

type Props = { event: any | null; onClose: () => void; onSaved: () => void | Promise<void> };

const localDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function CalendarExternalEventModal({ event, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [working, setWorking] = React.useState(false);
  const [form, setForm] = React.useState({ url: '', name: '', location: '', host: '', startDate: '', endDate: '' });

  React.useEffect(() => {
    if (!event) return;
    setForm({
      url: event.externalUrl || event.externalLink || '', name: event.name || '',
      location: event.locationAddress || event.locationName || event.venue || '',
      host: event.registrationForm?.externalHost || '',
      startDate: localDateTime(event.startDate), endDate: localDateTime(event.endDate),
    });
  }, [event]);

  React.useEffect(() => {
    if (!event) return;
    const previous = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && !working && onClose();
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; document.documentElement.style.overflow = previousHtml; window.removeEventListener('keydown', escape); };
  }, [event, onClose, working]);

  if (!event || typeof document === 'undefined') return null;

  const save = async () => {
    if (!form.url.trim() || !form.name.trim() || !form.startDate || !form.endDate) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' }); return;
    }
    try { new URL(form.url); } catch { toast({ title: 'Informe uma URL válida', variant: 'destructive' }); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast({ title: 'O término deve ser depois do início', variant: 'destructive' }); return;
    }
    setWorking(true);
    try {
      const response = await fetchApi(`/api/event/${event.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.name.trim(), startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(),
          location: form.location.trim() ? 'Local' : 'Local será anunciado em breve', locationAddress: form.location.trim() || null,
          externalUrl: form.url.trim(), externalLink: form.url.trim(), isExternal: true,
          registrationForm: { externalHost: form.host.trim() || null },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.message || data?.error || 'Não foi possível salvar');
      await onSaved(); toast({ title: 'Evento externo atualizado' }); onClose();
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error?.message, variant: 'destructive' });
    } finally { setWorking(false); }
  };

  return createPortal(<div className="cee-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !working && onClose()}>
    <section className="cee-panel" role="dialog" aria-modal="true" aria-label="Editar evento externo">
      <header><button type="button" onClick={onClose} disabled={working} aria-label="Fechar painel"><ChevronsRight /></button><h2>Editar Evento</h2></header>
      <div className="cee-scroll"><div className="cee-form">
        <label><span>URL da página do evento *</span><input autoFocus type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
        <label><span>Nome do Evento *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label><span>Local do Evento</span><span className="cee-icon-input"><MapPin /><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Qual é o endereço?" /></span></label>
        <label><span>Anfitrião</span><input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} /></label>
        <fieldset><legend>Horário do Evento *</legend><div><label><small>Início</small><input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label><ChevronRight /><label><small>Término</small><input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label></div><p>🌐 GMT-03:00 Fortaleza</p></fieldset>
      </div></div>
      <footer><button className="cee-save" type="button" disabled={working} onClick={() => void save()}>{working ? <Loader2 className="is-loading" /> : <CheckCircle2 />}Salvar Alterações</button></footer>
    </section>
    <style>{styles}</style>
  </div>, document.body);
}

const styles = `
.cee-backdrop{position:fixed;inset:0;z-index:6600;background:rgba(3,3,4,.50);backdrop-filter:blur(9px) saturate(112%);-webkit-backdrop-filter:blur(9px) saturate(112%);animation:cee-fade .2s ease both}.cee-panel{position:fixed;z-index:6601;top:12px;right:12px;bottom:12px;display:flex;width:min(600px,calc(100vw - 24px));flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:20px;color:#fafafa;background:linear-gradient(145deg,rgba(35,33,34,.91),rgba(24,22,22,.88));box-shadow:0 24px 70px rgba(0,0,0,.28);backdrop-filter:blur(30px) saturate(130%);-webkit-backdrop-filter:blur(30px) saturate(130%);animation:cee-in .34s cubic-bezier(.2,.82,.2,1) both}.cee-panel>header{display:flex;height:66px;flex:0 0 66px;align-items:center;gap:13px;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.cee-panel h2{margin:0;font-size:19px}.cee-panel>header button{display:grid;width:30px;height:30px;place-items:center;border:0;border-radius:8px;color:rgba(255,255,255,.62);background:transparent;cursor:pointer;transition:color .16s,background .16s,transform .16s}.cee-panel>header button:hover{color:#fff;background:rgba(255,255,255,.08);transform:translateX(2px)}.cee-panel>header svg{width:19px}.cee-scroll{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}.cee-form{display:grid;gap:18px;padding:24px 22px 42px}.cee-form>label>span:first-child,.cee-form legend{display:block;margin:0 0 8px;color:rgba(255,255,255,.78);font-size:13px;font-weight:650}.cee-form>label>input,.cee-icon-input{box-sizing:border-box;width:100%;height:46px;padding:0 13px;border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;background:rgba(8,11,12,.50);outline:0;font:500 14px Inter,sans-serif}.cee-form>label>input:focus,.cee-icon-input:focus-within{border-color:rgba(255,255,255,.65)}.cee-icon-input{display:flex;align-items:center;gap:9px}.cee-icon-input svg{width:18px;color:rgba(255,255,255,.4)}.cee-icon-input input{width:100%;border:0;outline:0;color:#fff;background:transparent}.cee-form fieldset{margin:0;padding:0;border:0}.cee-form fieldset>div{display:grid;grid-template-columns:1fr 22px 1fr;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.15);border-bottom:0;border-radius:10px 10px 0 0;background:rgba(8,11,12,.50)}.cee-form fieldset small{display:block;color:rgba(255,255,255,.4);font-size:10px}.cee-form fieldset input{width:100%;border:0;outline:0;color:#fff;color-scheme:dark;background:transparent;font-size:12px}.cee-form fieldset>div>svg{width:17px;color:rgba(255,255,255,.45)}.cee-form fieldset p{margin:0;padding:9px 12px;border:1px solid rgba(255,255,255,.15);border-radius:0 0 10px 10px;color:rgba(255,255,255,.58);background:rgba(8,11,12,.50);font-size:11px}.cee-panel>footer{display:flex;min-height:72px;flex:0 0 auto;align-items:center;padding:12px 18px;border-top:1px solid rgba(255,255,255,.08);background:rgba(24,22,22,.82);backdrop-filter:blur(22px)}.cee-save{display:flex;height:44px;align-items:center;justify-content:center;gap:8px;padding:0 18px;border:0;border-radius:9px;color:#171717;background:rgba(255,255,255,.97);font-size:14px;font-weight:750;cursor:pointer}.cee-save:hover{background:#fff}.cee-save:disabled{opacity:.42}.cee-save svg{width:17px}.cee-save svg.is-loading{animation:cee-spin .8s linear infinite}@keyframes cee-fade{from{opacity:0}to{opacity:1}}@keyframes cee-in{from{opacity:0;transform:translateX(36px) scale(.985)}to{opacity:1;transform:none}}@keyframes cee-spin{to{transform:rotate(360deg)}}@media(max-width:640px){.cee-panel{inset:0;width:100%;border-radius:0;border-left:0;border-right:0}.cee-panel>header,.cee-form{padding-left:16px;padding-right:16px}.cee-form fieldset>div{grid-template-columns:1fr}.cee-form fieldset>div>svg{display:none}.cee-form fieldset label+label{margin-top:10px}.cee-panel>footer{padding:10px 14px}.cee-save{width:100%}}
`;
