import React, { useEffect, useState } from 'react';
import { DashboardCard } from '@/admin/components/DashboardCard';
import EventsHighlight from '@/admin/components/EventsHighlight';
import OrganizerRanking from '@/admin/components/OrganizerRanking';
import NextEventsTimeline from '@/admin/components/NextEventsTimeline';
import { getAdminMetrics, getNextEvents, getOrganizerRanking } from '@/lib/api/admin';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, CheckCircle, Calendar, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any|null>(null);
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      try{
        const [m, e, r] = await Promise.all([getAdminMetrics(token), getNextEvents(token), getOrganizerRanking(token)]);
        if(!mounted) return;
        setMetrics(m);
        setNextEvents(e);
        setRanking(r);
      }catch(err){ console.error('dashboard fetch', err); }
      finally{ if(mounted) setLoading(false); }
    })();
    return ()=>{ mounted = false; };
  },[token]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg p-5 text-white shadow-lg">
        <h1 className="text-2xl font-semibold mb-1">Olá, Admin! 👋</h1>
        <p className="text-teal-50 text-sm">Bem-vindo ao painel de controle da Fauves. Aqui está um resumo das atividades.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardCard 
          title="Vendas do Dia" 
          value={metrics ? `R$ ${Number(metrics.salesToday || 0).toFixed(2)}` : '—'} 
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
          loading={loading}
        />
        <DashboardCard 
          title="Check-ins Realizados" 
          value={metrics ? String(metrics.checkins) : '—'} 
          icon={CheckCircle}
          gradient="from-blue-500 to-indigo-600"
          loading={loading}
        />
        <DashboardCard 
          title="Eventos Ativos" 
          value={metrics ? String(metrics.eventsActive) : '—'} 
          icon={Calendar}
          gradient="from-purple-500 to-pink-600"
          loading={loading}
        />
        <DashboardCard 
          title="Tickets Pendentes" 
          value={metrics ? String(metrics.openTickets) : '—'} 
          icon={Clock}
          gradient="from-orange-500 to-red-600"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Events Highlight - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">Eventos em Destaque</h2>
              <p className="text-xs text-slate-600">Acompanhe os eventos com maior movimento</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <EventsHighlight data={nextEvents} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Ranking + Timeline */}
        <div className="space-y-5">
          {/* Organizer Ranking */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">Top Organizadores</h2>
              <p className="text-xs text-slate-600">Ranking por receita</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <OrganizerRanking data={ranking} />
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Próximos Eventos</h2>
              <p className="text-sm text-slate-600">Calendário futuro</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <NextEventsTimeline data={nextEvents} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
