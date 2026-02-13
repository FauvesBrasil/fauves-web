import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function EventDrawer({ event, token, onClose } : any){
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!event) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/admin/event-summary?eventId=${event.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=> r.ok ? r.json() : null)
      .then(j=> { if(!mounted) return; if(j && j.ok) setSummary(j.summary); })
      .catch(()=>{})
      .finally(()=> mounted && setLoading(false));
    return ()=>{ mounted = false; };
  },[event, token]);

  if(!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative ml-auto w-full md:w-[720px] bg-white h-full shadow-xl p-6 overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xl font-semibold">{event.name}</div>
            <div className="text-sm text-slate-500">{event.organizationName || event.organizer}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100"><X /></button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Data</div>
            <div className="font-medium">{new Date(event.startDate).toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Local</div>
            <div className="font-medium">{(typeof event.location === 'string' && event.location.includes('Local será anunciado')) ? (event.location.split(':').slice(1).join(':').trim() || 'Online') : (event.location || 'Online')}</div>
          </div>

          <div className="mt-2">
            <div className="text-sm text-slate-600">Resumo</div>
            {loading && <div className="text-sm text-slate-400">Carregando...</div>}
            {!loading && summary && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded">🎫 Vendas: <div className="font-semibold">{summary.ticketsSold}</div></div>
                <div className="p-3 bg-slate-50 rounded">✅ Check-ins: <div className="font-semibold">{summary.checkins}</div></div>
                <div className="p-3 bg-slate-50 rounded">💵 Receita: <div className="font-semibold">R$ {summary.revenue?.toFixed?.(2) ?? summary.revenue}</div></div>
                <div className="p-3 bg-slate-50 rounded">⏳ Pagamentos pendentes: <div className="font-semibold">{summary.pendingPayments}</div></div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-600">Ações</div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 bg-sky-600 text-white rounded">Ver vendas detalhadas</button>
              <button className="px-3 py-2 bg-slate-100 rounded">Abrir relatório</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
