import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminEvents(){
  const { token } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  useEffect(()=>{(async ()=>{
    if(!token) return;
    const res = await fetch(`/api/admin/events?page=${page}&perPage=20`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    setEvents(data.events || []);
  })()},[token,page]);

  const editEvent = async (e:any)=>{
    if(!token) return;
    const newName = prompt('Nome do evento:', e.name) || undefined;
    const newStatus = prompt('Status (published,draft,deleted):', e.status) || undefined;
    const newDate = prompt('Start date (ISO):', e.startDate) || undefined;
    const body: any = { eventId: e.id };
    if(newName) body.name = newName;
    if(newStatus) body.status = newStatus;
    if(newDate) body.startDate = newDate;
    const res = await fetch('/api/admin/update-event', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
    if(!res.ok) return alert('Falha ao editar evento');
    const j = await res.json();
    if(j.ok) setEvents(prev=> prev.map(x=> x.id===e.id ? j.event : x));
  };

  const deleteEvent = async (e:any)=>{
    if(!token) return;
    if(!confirm('Apagar evento (marcar como deleted)?')) return;
    const res = await fetch('/api/admin/delete-event', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ eventId: e.id }) });
    if(!res.ok) return alert('Falha ao apagar evento');
    const j = await res.json();
    if(j.ok) setEvents(prev=> prev.filter(x=> x.id!==e.id));
  };

  return <div>
    <h1>Eventos</h1>
    <table style={{width:'100%'}}>
      <thead><tr><th>Nome</th><th>Slug</th><th>Data</th><th>Status</th></tr></thead>
      <tbody>
        {events.map(e=> <tr key={e.id}><td>{e.name}</td><td>{e.slug}</td><td>{new Date(e.startDate).toLocaleString()}</td><td>{e.status}</td><td style={{display:'flex',gap:8}}><button onClick={()=>editEvent(e)}>Editar</button><button onClick={()=>deleteEvent(e)} style={{color:'crimson'}}>Apagar</button></td></tr>)}
      </tbody>
    </table>
  </div>;
}
