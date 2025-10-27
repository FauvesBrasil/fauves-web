import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function EventCard({ event, onDetails } : any){
  const statusClass = event.status === 'published' ? 'bg-emerald-100 text-emerald-700' : event.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700';
  const subtitle = event.organizationName || event.organizer || '—';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow relative">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg">{event.name}</div>
          <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        </div>
        <button onClick={()=>onDetails(event)} className="text-slate-400 hover:text-slate-600" aria-label="Ver detalhes">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3 text-sm text-slate-600">
  <div>{new Date(event.startDate).toLocaleString()} • {((typeof event.location === 'string' && event.location.includes('Local será anunciado')) ? (event.location.split(':').slice(1).join(':').trim() || 'Online') : (event.location || 'Online'))}</div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className={`px-2 py-1 rounded text-xs font-semibold ${statusClass}`}>{event.status || 'draft'}</div>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          <div>🎫 {event.ticketsSold || 0}</div>
          <div>✅ {event.checkins || 0}</div>
          <div>💵 {event.revenue ? `R$ ${event.revenue.toFixed(2)}` : 'R$ 0,00'}</div>
        </div>
      </div>

      {event.hasAlerts ? <div className="absolute top-3 left-3 text-rose-600 text-xs font-semibold">⚠ Alerta</div> : null}
    </div>
  );
}
