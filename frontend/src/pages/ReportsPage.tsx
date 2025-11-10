import React from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useOrganization } from '@/context/OrganizationContext';
import { ensureApiBase, apiUrl } from '@/lib/apiBase';

// Tabs and subtabs model
type TopTabKey = 'vendas'|'trafego'|'comunidade';
type SubTabKey =
  | 'vendas/overview' | 'vendas/promoters'
  | 'trafego/event-page' | 'trafego/my-page'
  | 'comunidade/overview' | 'comunidade/comportamento' | 'comunidade/socio' | 'comunidade/gostos';

const TOP_TABS: { key: TopTabKey; label: string }[] = [
  { key: 'vendas', label: 'Vendas' },
  { key: 'trafego', label: 'Tráfego' },
  { key: 'comunidade', label: 'Comunidade' },
];

const SUB_TABS: Record<TopTabKey, { key: SubTabKey; label: string }[]> = {
  vendas: [
    { key: 'vendas/overview', label: 'Visão geral' },
    { key: 'vendas/promoters', label: 'Promoters' },
  ],
  trafego: [
    { key: 'trafego/event-page', label: 'Página do Evento' },
    { key: 'trafego/my-page', label: 'Minha Página' },
  ],
  comunidade: [
    { key: 'comunidade/overview', label: 'Visão geral' },
    { key: 'comunidade/comportamento', label: 'Comportamento' },
    { key: 'comunidade/socio', label: 'Sócio-demográfico' },
    { key: 'comunidade/gostos', label: 'Gostos musicais' },
  ],
};

interface EventLite { id: string; name: string; startDate?: string|null }

function OrganizerReportsPage() {
  const navigate = useNavigate();
  const { selectedOrg } = useOrganization();

  const [topTab, setTopTab] = React.useState<TopTabKey>('vendas');
  const [subTab, setSubTab] = React.useState<SubTabKey>('vendas/overview');
  const [events, setEvents] = React.useState<EventLite[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [activeEventId, setActiveEventId] = React.useState<string>('');
  const [orgTrafficSeries, setOrgTrafficSeries] = React.useState<{ date: string; total: number }[]>([]);
  const [communitySeries, setCommunitySeries] = React.useState<{ date: string; contatos: number; seguidores: number; email: number }[]>([]);
  const [locationTab, setLocationTab] = React.useState<'estado'|'cidade'>('estado');
  const [seasonMode, setSeasonMode] = React.useState<'dias'|'meses'>('dias');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedOrg?.id) { setEvents([]); setActiveEventId(''); return; }
      setLoadingEvents(true);
      try {
        await ensureApiBase().catch(() => {});
        const path = `/api/organization/${selectedOrg.id}/events`;
        const attempts = [ apiUrl(path), `http://localhost:4000${path}` ];
        let loaded: any[] | null = null;
        for (const u of attempts) {
          try {
            const r = await fetch(u, { headers: { 'Accept': 'application/json' } });
            if (!r.ok) continue;
            const j = await r.json();
            if (Array.isArray(j)) { loaded = j; break; }
          } catch {}
        }
        if (cancelled) return;
        const mapped: EventLite[] = (loaded || []).map(e => ({ id: e.id, name: e.name, startDate: e.startDate || e.startDateUtc || null }));
        setEvents(mapped);
        setActiveEventId(prev => mapped.some(m => m.id===prev) ? prev : (mapped[0]?.id || ''));
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrg?.id]);

  // Demo data for "Minha Página" chart (last ~90 days; one visit sample)
  React.useEffect(() => {
    if (subTab !== 'trafego/my-page') return;
    const today = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const days = 90;
    const sampleIndex = Math.max(0, Math.floor(days / 3));
    const base: { date: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      d.setDate(d.getDate() - i);
      base.push({ date: fmt(d), total: 0 });
    }
    if (base[sampleIndex]) base[sampleIndex].total = 1;
    setOrgTrafficSeries(base);
  }, [subTab]);

  // Demo data for Comunidade/Visão geral (3 series flat)
  React.useEffect(() => {
    if (subTab !== 'comunidade/overview') return;
    const today = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short' });
    const monthsBack = 6;
    const series: { date: string; contatos: number; seguidores: number; email: number }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      series.push({ date: fmt(d), contatos: 0, seguidores: 0, email: 0 });
    }
    setCommunitySeries(series);
  }, [subTab]);

  const EmptySalesOverview = (
    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
      <div className="text-lg font-semibold text-slate-900 dark:text-white">Ainda não há dados de vendas</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assim que seus primeiros ingressos estiverem à venda, detalhes sobre suas vendas aparecerão aqui</div>
      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex justify-center items-start">
      <SidebarMenu />
      <div className="rounded-3xl w-[1352px] min-h-screen bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Análises</h1>

          {/* Top tabs */}
          <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-[#1F1F1F] -mb-2">
            {TOP_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTopTab(t.key); setSubTab(SUB_TABS[t.key][0].key); }}
                className={`pb-2 text-base font-bold transition ${topTab === t.key ? 'border-b-2 border-indigo-600 text-indigo-700 dark:border-white dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:dark:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sub tabs for active top tab */}
          <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-[#1F1F1F] pb-2">
            {SUB_TABS[topTab].map(st => (
              <button
                key={st.key}
                onClick={() => setSubTab(st.key)}
                className={`text-sm font-medium ${subTab === st.key ? 'text-indigo-600 border-b-2 border-indigo-600 pb-2' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:dark:text-white'}`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <main className="flex-1 pb-[100px]">
            {subTab === 'vendas/overview' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visão geral das vendas</h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Analise e otimize suas vendas</div>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar evento</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      value={activeEventId}
                      onChange={e => setActiveEventId(e.target.value)}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Sem eventos ainda</option>
                      ) : (
                        events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                      )}
                    </select>
                  </div>
                </div>
                {EmptySalesOverview}
              </>
            )}

            {subTab === 'vendas/promoters' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Promoters</h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Ha promoters vendendo ingressos para seu evento?</div>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar evento</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      value={activeEventId}
                      onChange={e => setActiveEventId(e.target.value)}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Nenhum evento publicado ainda</option>
                      ) : (
                        events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">Ainda nao ha dados de vendas</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assim que seus primeiros ingressos estiverem a venda, os detalhes das suas vendas de promoter aparecerao aqui</div>
                  <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                </div>
              </>
            )}

            {subTab === 'trafego/event-page' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tráfego do evento</h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400">As pessoas veem o seu evento?</div>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar evento</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      value={activeEventId}
                      onChange={e => setActiveEventId(e.target.value)}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Nenhum evento publicado ainda</option>
                      ) : (
                        events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados de tráfego ainda</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Depois que seu evento for publicado, os detalhes sobre as visitas ao seu evento aparecerão aqui</div>
                  <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                </div>
              </>
            )}

            {subTab === 'trafego/my-page' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tráfego da Minha Página</h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400">As pessoas veem sua página de produtor?</div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Atualizado {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>

                {/* KPIs */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total de visitas nos últimos 3 meses</div>
                    <div className="text-3xl font-semibold text-slate-900 dark:text-white mt-3">1</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-6">
                      <span className="text-indigo-500 align-middle">●</span> <span className="align-middle">hoje</span>
                    </div>
                  </div>
                </div>

                {/* Evolução */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-10">Como as visitas estão evoluindo com o tempo?</h3>
                <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Total de visitas nos últimos 3 meses</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={orgTrafficSeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} interval="preserveStartEnd" />
                        <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <Tooltip
                          contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: any) => [String(value), 'Total']}
                          labelFormatter={(label: any) => label}
                        />
                        <Line type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fontes */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-10">De onde as visitas vem?</h3>
                <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Vendas por fonte</div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">Fauves</span>
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-200">1</div>
                    <div className="text-sm text-slate-800 dark:text-slate-200">100%</div>
                  </div>
                  <button className="mt-3 text-sm text-indigo-700 hover:text-indigo-800">Como as fontes são determinadas?</button>
                </div>
              </>
            )}

            {subTab === 'comunidade/overview' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visão geral</h1>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar eventos</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Selecionar eventos</option>
                      ) : (
                        <>
                          <option>Todos os eventos</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* KPIs */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label:'Contatos', value:0 },
                    { label:'Seguidores na Fauves', value:0 },
                    { label:'Inscritos no email', value:0 },
                    { label:'Inscritos no push', value:0 },
                  ].map((k)=> (
                    <div key={k.label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{k.label}</div>
                      <div className="text-3xl font-semibold text-slate-900 dark:text-white mt-3">{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Presence and last purchase */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Presença no evento</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Os seus contatos foram a 0,0 eventos em média</div>
                    <div className="h-48 mt-6 rounded bg-[#151515] dark:bg-[#0e0e0e] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tempo desde a última compra</div>
                    <table className="w-full text-sm mt-4">
                      <tbody className="text-slate-500 dark:text-slate-400">
                        {['< 3 meses','3 a 6 meses','6 a 12 meses','12 a 24 meses','> 24 meses'].map((row, i)=> (
                          <tr key={row} className="border-b border-zinc-200/50 dark:border-zinc-700/50">
                            <td className="py-2">{row}</td>
                            <td className="py-2 text-right">0</td>
                            <td className="py-2 text-right">0%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                  </div>
                </div>

                {/* Community growth */}
                <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Crescimento da comunidade</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={communitySeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <YAxis allowDecimals={false} domain={[0,'dataMax + 1']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} formatter={(v:any, n:any)=>[String(v), n==='contatos'?'Contatos': n==='seguidores'?'Seguidores na Fauves':'Inscritos no email']} />
                        <Line type="monotone" dataKey="contatos" name="Contatos" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="seguidores" name="Seguidores na Fauves" stroke="#a78bfa" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="email" name="Inscritos no email" stroke="#22d3ee" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 inline-block rounded-sm"/>Contatos</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-400 inline-block rounded-sm"/>Seguidores na Fauves</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-400 inline-block rounded-sm"/>Inscritos no email</div>
                  </div>
                </div>

                {/* Growth per event */}
                <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Crescimento da comunidade por evento</div>
                  <table className="w-full text-sm">
                    <thead className="text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="text-left py-2">Eventos</th>
                        <th className="text-right py-2">Participantes</th>
                        <th className="text-right py-2">Contatos</th>
                        <th className="text-right py-2">Novos contatos</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-500 dark:text-slate-400">
                      <tr className="border-t border-zinc-200/50 dark:border-zinc-700/50">
                        <td className="py-3">—</td>
                        <td className="py-3 text-right">0</td>
                        <td className="py-3 text-right">0</td>
                        <td className="py-3 text-right">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {subTab === 'comunidade/socio' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sócio-demográfico</h1>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar eventos</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Selecionar eventos</option>
                      ) : (
                        <>
                          <option>Todos os eventos</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gênero */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 h-[360px] relative">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gênero</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                    <div className="absolute left-5 bottom-4 text-xs text-slate-500 dark:text-slate-400">Esta informação é conhecida em 0 contatos</div>
                  </div>

                  {/* Idade */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 h-[360px] relative">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idade</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Os seus contatos tem -- anos em média</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                    <div className="absolute left-5 bottom-4 text-xs text-slate-500 dark:text-slate-400">Esta informação é conhecida em 0 contatos</div>
                  </div>
                </div>

                {/* Localização */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 h-[360px] relative">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Localização dos contatos</div>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={()=> setLocationTab('estado')} className={`px-3 py-1.5 text-xs rounded ${locationTab==='estado' ? 'bg-zinc-200 dark:bg-zinc-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Estado</button>
                      <button onClick={()=> setLocationTab('cidade')} className={`px-3 py-1.5 text-xs rounded ${locationTab==='cidade' ? 'bg-zinc-200 dark:bg-zinc-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Cidade</button>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-0 h-[360px] relative overflow-hidden">
                    {/* Map placeholder */}
                    <div className="absolute right-2 top-2 z-10"><button className="w-8 h-8 rounded bg-black/40 text-white text-xs">⤢</button></div>
                    <div className="absolute inset-0 bg-[#0f0f0f]" />
                    <div className="absolute left-4 bottom-3 text-[10px] text-slate-400">© mapa (placeholder)</div>
                  </div>
                </div>
              </>
            )}

            {subTab === 'comunidade/gostos' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gostos musicais</h1>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar eventos</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Selecionar eventos</option>
                      ) : (
                        <>
                          <option>Todos os eventos</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gêneros musicais populares */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 h-[420px] relative">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gêneros musicais populares</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gêneros musicais de eventos de outros produtores que a sua comunidade já foi.</div>
                    <table className="w-full text-sm mt-4">
                      <thead className="text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="text-left py-2">Gêneros</th>
                          <th className="text-right py-2">Contatos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-6" colSpan={2}>
                            <div className="flex items-center justify-center">
                              <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Artistas populares */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 h-[420px] relative">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Artistas populares</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Artistas de eventos de outros produtores que a sua comunidade já foi.</div>
                    <table className="w-full text-sm mt-4">
                      <thead className="text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="text-left py-2">Artistas</th>
                          <th className="text-right py-2">Contatos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-6" colSpan={2}>
                            <div className="flex items-center justify-center">
                              <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {subTab === 'comunidade/comportamento' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Comportamento</h1>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar eventos</label>
                    <select
                      disabled={loadingEvents || events.length===0}
                      className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                    >
                      {events.length===0 ? (
                        <option>Selecionar eventos</option>
                      ) : (
                        <>
                          <option>Todos os eventos</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* KPIs */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Média de valor por compra</div>
                    <div className="mt-3 w-28 h-7 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Média de ingressos por compra</div>
                    <div className="mt-3 w-28 h-7 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Média de antecipação dos pedidos</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">0 <span className="text-base font-normal text-slate-500 dark:text-slate-400">horas</span></div>
                  </div>
                </div>

                {/* Sazonalidade dos pedidos */}
                <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sazonalidade dos pedidos</div>
                    <div className="flex gap-2">
                      <button onClick={()=> setSeasonMode('dias')} className={`px-2 py-1 rounded text-xs ${seasonMode==='dias'?'bg-zinc-200 dark:bg-zinc-700 text-slate-900 dark:text-white':'text-slate-500 dark:text-slate-400'}`}>Dias</button>
                      <button onClick={()=> setSeasonMode('meses')} className={`px-2 py-1 rounded text-xs ${seasonMode==='meses'?'bg-zinc-200 dark:bg-zinc-700 text-slate-900 dark:text-white':'text-slate-500 dark:text-slate-400'}`}>Meses</button>
                    </div>
                  </div>
                  <div className="h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(seasonMode==='dias' ? ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'] : ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']).map(l=>({ label:l, total:0 }))}>
                        <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <YAxis allowDecimals={false} domain={[0,'dataMax + 1']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} formatter={(v:any)=>[String(v),'Total']} />
                        <Line type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                  </div>
                </div>

                {/* Antecipação dos pedidos */}
                <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Antecipação dos pedidos</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">A média de antecipação de pedido dos seus participantes é de <span className="font-semibold text-slate-900 dark:text-white">0 horas</span></div>
                  <div className="h-64 mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { label:'depois do início', total:0 },
                        { label:'< 24 horas', total:0 },
                        { label:'24 h a 1 semana', total:0 },
                        { label:'1 a 2 semanas', total:0 },
                        { label:'2 a 3 semanas', total:0 },
                        { label:'3 a 4 semanas', total:0 },
                        { label:'> 1 mês', total:0 },
                      ]}>
                        <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} interval={0} angle={0} height={50} />
                        <YAxis allowDecimals={false} domain={[0,'dataMax + 1']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                        <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} formatter={(v:any)=>[String(v),'Total']} />
                        <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {subTab !== 'vendas/overview' && subTab !== 'vendas/promoters' && subTab !== 'trafego/event-page' && subTab !== 'trafego/my-page' && subTab !== 'comunidade/overview' && subTab !== 'comunidade/comportamento' && subTab !== 'comunidade/socio' && subTab !== 'comunidade/gostos' && (
              <div className="text-slate-400 dark:text-slate-500 text-sm">Em breve</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default OrganizerReportsPage;
