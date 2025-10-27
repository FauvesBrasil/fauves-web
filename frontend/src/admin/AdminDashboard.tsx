import React, { useEffect, useState } from 'react';
import { SectionCard } from '@/components/SectionCard';
import { DashboardCard } from '@/admin/components/DashboardCard';
import EventsHighlight from '@/admin/components/EventsHighlight';
import OrganizerRanking from '@/admin/components/OrganizerRanking';
import NextEventsTimeline from '@/admin/components/NextEventsTimeline';
import { getAdminMetrics, getNextEvents, getOrganizerRanking } from '@/lib/api/admin';
import { useAuth } from '@/context/AuthContext';

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
    <div className="max-w-[1200px] mx-auto flex flex-col gap-5 p-2">
      <div className="grid grid-cols-4 gap-4">
        <DashboardCard title="Vendas do Dia" value={metrics? metrics.salesToday : '—'} hint="+8%" />
        <DashboardCard title="Check-ins" value={metrics? String(metrics.checkins) : '—'} hint="+2%" />
        <DashboardCard title="Eventos Ativos" value={metrics? String(metrics.eventsActive) : '—'} hint="-1%" />
        <DashboardCard title="Tickets Abertos" value={metrics? String(metrics.openTickets) : '—'} hint="+12%" />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <SectionCard title="Eventos em Destaque Agora" description="Eventos com indicadores de saúde operacinal e financeiro" padded>
          {loading ? <div>Carregando eventos...</div> : <EventsHighlight />}
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Ranking de Organizadores" description="Receita e movimento recente">
            {loading ? <div>Carregando ranking...</div> : <OrganizerRanking />}
          </SectionCard>

          <SectionCard title="Próximos Eventos" description="Linha do tempo dos próximos eventos">
            {loading ? <div>Carregando timeline...</div> : <NextEventsTimeline />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
