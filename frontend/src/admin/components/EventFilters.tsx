import React from 'react';

export default function EventFilters({ q, setQ, status, setStatus, orgs=[] } : any){
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar evento ou organizador" className="p-2 rounded border border-slate-100 w-64" />
        <select value={status} onChange={e=>setStatus(e.target.value)} className="p-2 rounded border border-slate-100">
          <option value="all">Todos</option>
          <option value="pre-sale">Pré-venda</option>
          <option value="live">Em andamento</option>
          <option value="finished">Finalizados</option>
          <option value="alerts">Com alerta</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select className="p-2 rounded border border-slate-100">
          <option>Organizador</option>
        </select>
        <input type="date" className="p-2 rounded border border-slate-100" />
      </div>
    </div>
  );
}
