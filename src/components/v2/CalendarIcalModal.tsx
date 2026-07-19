import * as React from 'react';
import { CalendarPlus, Copy, X } from 'lucide-react';
import { apiUrl } from '@/lib/apiBase';

type Props = { open: boolean; organization: any; onClose: () => void; onCopied: () => void };

export default function CalendarIcalModal({ open, organization, onClose, onCopied }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, onClose]);
  if (!open) return null;
  const feedUrl = apiUrl(`/api/organization/${organization.id}/calendar.ics`);
  const webcalUrl = feedUrl.replace(/^https?:/, 'webcal:');
  return <div className="cp-ical-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="cp-ical-modal" role="dialog" aria-modal="true" aria-label="Adicionar assinatura iCal">
      <button className="cp-ical-close" type="button" onClick={onClose}><X size={16} /></button>
      <div className="cp-ical-icon"><CalendarPlus size={31} /></div>
      <h2>Adicionar assinatura iCal</h2>
      <p>Adicione o feed de eventos ao seu app de calendário para acompanhar novos eventos e atualizações.</p>
      <div className="cp-ical-actions">
        <a className="google" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`} target="_blank" rel="noreferrer"><b>G</b> Google Calendar</a>
        <a className="outlook" href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent(organization.name)}`} target="_blank" rel="noreferrer"><b>⊞</b> Calendário do Outlook</a>
        <a className="apple" href={webcalUrl}><b className="apple-mark"></b> Apple Calendar</a>
      </div>
      <button className="cp-ical-copy" type="button" onClick={async () => { await navigator.clipboard.writeText(feedUrl); onCopied(); }}><Copy size={15} />Copiar URL para a área de transferência</button>
    </section>
    <style>{styles}</style>
  </div>;
}

const styles = `
.cp-ical-backdrop{position:fixed;inset:0;z-index:6100;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.62);backdrop-filter:blur(5px)}.cp-ical-modal{position:relative;width:min(420px,100%);padding:28px 25px 22px;border:1px solid rgba(255,255,255,.07);border-radius:20px;color:#fff;background:rgba(29,27,26,.96);box-shadow:0 18px 50px rgba(0,0,0,.4)}.cp-ical-close{position:absolute;top:16px;right:16px;display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;color:rgba(255,255,255,.45);background:rgba(255,255,255,.06);cursor:pointer}.cp-ical-icon{display:grid;width:58px;height:58px;place-items:center;border-radius:50%;color:rgba(255,255,255,.7);background:rgba(255,255,255,.09)}.cp-ical-modal h2{margin:25px 0 12px;font-size:23px;letter-spacing:-.025em}.cp-ical-modal>p{margin:0 0 26px;color:rgba(255,255,255,.72);font-size:15px;line-height:1.5}.cp-ical-actions{display:grid;gap:9px}.cp-ical-actions a{display:flex;min-height:48px;align-items:center;justify-content:center;gap:12px;border-radius:9px;color:#fff;text-decoration:none;font-size:16px;font-weight:650}.cp-ical-actions b{font-size:22px}.cp-ical-actions .google{background:#4285ee}.cp-ical-actions .outlook{background:#0aa8e7}.cp-ical-actions .apple{color:#171819;background:#fff}.cp-ical-copy{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;margin-top:18px;padding:10px;border:0;color:rgba(255,255,255,.5);background:transparent;font-size:13px;font-weight:600;cursor:pointer}.cp-ical-copy:hover{color:#fff}
.cp-ical-actions .apple-mark{font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.cp-ical-backdrop{background:rgba(3,3,4,.48);backdrop-filter:blur(16px) saturate(125%);-webkit-backdrop-filter:blur(16px) saturate(125%);animation:cp-ical-backdrop-in .22s ease both}.cp-ical-modal{border-color:rgba(255,255,255,.10);background:linear-gradient(145deg,rgba(38,36,35,.78),rgba(23,22,22,.68));backdrop-filter:blur(28px) saturate(135%);-webkit-backdrop-filter:blur(28px) saturate(135%);box-shadow:0 20px 54px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04);animation:cp-ical-modal-in .3s cubic-bezier(.16,.82,.24,1) both}.cp-ical-close{transition:color .18s ease,background .18s ease,transform .18s ease}.cp-ical-close:hover{color:#fff;background:rgba(255,255,255,.12);transform:rotate(5deg)}.cp-ical-close:active{transform:scale(.9)}.cp-ical-actions a{transition:filter .18s ease,transform .18s cubic-bezier(.2,.78,.25,1)}.cp-ical-actions a:hover{filter:brightness(1.08);transform:translateY(-1px)}.cp-ical-actions a:active{transform:scale(.98)}
@keyframes cp-ical-backdrop-in{from{opacity:0}to{opacity:1}}@keyframes cp-ical-modal-in{from{opacity:0;transform:translateY(14px) scale(.965);filter:blur(3px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
`;
