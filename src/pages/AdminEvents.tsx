import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, TrendingUp, AlertCircle, Plus, RefreshCw } from 'lucide-react';

export default function AdminEvents(){
  const { token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if(!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events?page=1&perPage=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ${res.status}: ${text}`);
      }
      const data = await res.json();
      const evs = (data.events||[]).map((e:any)=> ({ ...e, ticketsSold:0, checkins:0, revenue:0, hasAlerts:false }));
      setEvents(evs);
      setLoading(false);

      // Fetch summaries
      await Promise.all(evs.slice(0,50).map(async (ev:any)=>{
        try{
          const sRes = await fetch(`/api/admin/event-summary?eventId=${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if(!sRes.ok) return;
          const j = await sRes.json();
          if(j.ok && j.summary) {
            setEvents(prev=> prev.map(x=> x.id===ev.id ? { ...x, ...j.summary } : x));
          }
        }catch(e){/* ignore */}
      }));
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [token]);

  const filtered = events.filter(e=>{
    if(q){ const s = (e.name+ (e.organizationName||'')).toLowerCase(); if(!s.includes(q.toLowerCase())) return false; }
    if(status==='all') return true;
    if(status==='active') return e.status==='published' || e.status==='active';
    if(status==='draft') return e.status==='draft';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Eventos & Vendas</h1>
          <p className="text-slate-600 text-sm">Gerencie todos os eventos da plataforma</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 h-9 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition font-medium">
          <Plus className="w-4 h-4" />
          <span>Criar Evento</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar eventos por nome..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="draft">Rascunhos</option>
          </select>
          <button 
            onClick={loadEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 h-9 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-slate-600">Carregando eventos...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 mb-0.5 text-sm">Erro ao carregar eventos</h3>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900 mb-1.5">Nenhum evento encontrado</h3>
          <p className="text-slate-600">
            {events.length === 0 ? 'Ainda não há eventos cadastrados.' : 'Nenhum evento corresponde aos filtros.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(e => (
            <div 
              key={e.id} 
              onClick={() => navigate(`/admin/events/${e.id}`)}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition group cursor-pointer"
            >
              {e.image && (
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <img src={e.image} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-slate-900 mb-1.5 line-clamp-1 text-sm">{e.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{e.startDate ? new Date(e.startDate).toLocaleDateString('pt-BR') : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.status === 'published' || e.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {e.status || 'draft'}
                  </span>
                  <div className="flex items-center gap-1 text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{e.ticketsSold || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
