import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import EventFilters from '@/admin/components/EventFilters';
import EventCard from '@/admin/components/EventCard';
import EventDrawer from '@/admin/components/EventDrawer';

export default function AdminEvents(){
  const { token } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);


  useEffect(()=>{(async ()=>{
    if(!token) return;
    // fetch list of events (only basic fields)
    const res = await fetch(`/api/admin/events?page=1&perPage=100`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    const evs = (data.events||[]).map((e:any)=> ({ ...e, ticketsSold:0, checkins:0, revenue:0, hasAlerts:false }));
    setEvents(evs);

    // fetch summaries per event in parallel (lightweight)
    await Promise.all(evs.slice(0,50).map(async (ev:any)=>{
      try{
        const sRes = await fetch(`/api/admin/event-summary?eventId=${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if(!sRes.ok) return;
        const j = await sRes.json();
        if(j.ok && j.summary) {
          setEvents(prev=> prev.map(x=> x.id===ev.id ? { ...x, ...j.summary } : x));
        }
      }catch(e){/* ignore per-event failure */}
    }));
  })()},[token]);

  const filtered = events.filter(e=>{
    if(q){ const s = (e.name+ (e.organizationName||'') + (e.organizer||'')).toLowerCase(); if(!s.includes(q.toLowerCase())) return false; }
    if(status==='all') return true;
    if(status==='alerts') return e.hasAlerts;
    if(status==='pre-sale') return e.status==='pre-sale' || e.status==='draft';
    if(status==='live') return e.status==='published' || e.status==='active';
    if(status==='finished') return e.status==='finished' || e.status==='deleted';
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Eventos & Vendas</h1>
        <div>
          <button className="px-4 py-2 bg-sky-600 text-white rounded">+ Criar Novo Evento</button>
        </div>
      </div>

      <EventFilters q={q} setQ={setQ} status={status} setStatus={setStatus} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(e=> <EventCard key={e.id} event={e} onDetails={(ev:any)=> setSelected(ev)} />)}
      </div>

      {selected && <EventDrawer event={selected} token={token} onClose={()=>setSelected(null)} />}
    </div>
  );
}
