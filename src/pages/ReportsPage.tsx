import React from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { ensureApiBase, apiUrl, fetchApi } from '@/lib/apiBase';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';

// Tabs and subtabs model
type TopTabKey = 'vendas' | 'trafego' | 'comunidade';
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

interface EventLite { id: string; name: string; startDate?: string | null }

// Interface para dados de vendas
interface SalesData {
  totalGross: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  netRevenue: number;
  availableBalance: number;
  platformFeePercent: number;
  dailySales: { date: string; orderCount: number; revenue: number }[];
  ticketSales: { ticketTypeName: string; price: number; count: number; total: number }[];
  loading: boolean;
}

// Interface para dados de promoters
interface PromoterLink {
  id: string;
  alias: string;
  url: string;
  views: number;
  sold: number;
  revenue: number;
  conversionRate: string;
}

interface PromoterData {
  links: PromoterLink[];
  summary: {
    totalLinks: number;
    totalViews: number;
    totalSold: number;
    totalRevenue: number;
    avgConversion: string;
  };
  loading: boolean;
}

// Interface para dados de tráfego
interface TrafficData {
  totalViews: number;
  totalSold: number;
  conversionRate: string;
  dailyViews: { date: string; views: number }[];
  sources: number;
  followers?: number;
  eventsCount?: number;
  loading: boolean;
}

// Interface para dados de comunidade
interface CommunityData {
  contacts: number;
  followers: number;
  emailList: number;
  eventsCount: number;
  monthlySeries: { date: string; contacts: number; followers: number; email: number }[];
  loading: boolean;
}

// Interface para dados de comportamento
interface BehaviorData {
  avgOrderValue: string;
  avgTicketsPerOrder: string;
  avgAnticipationHours: number;
  seasonalityByDay: number[]; // [Seg, Ter, Qua, Qui, Sex, Sab, Dom]
  anticipationBuckets: {
    afterStart: number;
    lessThan24h: number;
    day1ToWeek: number;
    week1To2: number;
    week2To3: number;
    week3To4: number;
    moreThan1Month: number;
  };
  loading: boolean;
}

// Interface para dados demográficos
interface DemographicsData {
  contactsCount: number;
  avgAge: number;
  ageRanges: Record<string, number>;
  stateDistribution: { name: string; count: number }[];
  cityDistribution: { name: string; count: number }[];
  loading: boolean;
}

// Interface para gostos musicais
interface MusicTastesData {
  contactsCount: number;
  genres: { name: string; count: number }[];
  artists: { name: string; count: number }[];
  loading: boolean;
}

function OrganizerReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();
  const { user } = useAuth();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [topTab, setTopTab] = React.useState<TopTabKey>('vendas');
  const [subTab, setSubTab] = React.useState<SubTabKey>('vendas/overview');
  const [events, setEvents] = React.useState<EventLite[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [activeEventId, setActiveEventId] = React.useState<string>('');
  const [orgTrafficSeries, setOrgTrafficSeries] = React.useState<{ date: string; total: number }[]>([]);
  const [communitySeries, setCommunitySeries] = React.useState<{ date: string; contatos: number; seguidores: number; email: number }[]>([]);

  // Estado para dados de vendas reais
  const [salesData, setSalesData] = React.useState<SalesData>({
    totalGross: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    netRevenue: 0,
    availableBalance: 0,
    platformFeePercent: 15,
    dailySales: [],
    ticketSales: [],
    loading: false,
  });

  // Estado para dados de promoters
  const [promoterData, setPromoterData] = React.useState<PromoterData>({
    links: [],
    summary: {
      totalLinks: 0,
      totalViews: 0,
      totalSold: 0,
      totalRevenue: 0,
      avgConversion: '0.00',
    },
    loading: false,
  });

  // Estado para dados de tráfego
  const [trafficData, setTrafficData] = React.useState<TrafficData>({
    totalViews: 0,
    totalSold: 0,
    conversionRate: '0.00',
    dailyViews: [],
    sources: 0,
    loading: false,
  });

  // Estado para dados de tráfego da organização (Minha Página)
  const [orgTrafficData, setOrgTrafficData] = React.useState<TrafficData>({
    totalViews: 0,
    totalSold: 0,
    conversionRate: '0.00',
    dailyViews: [],
    sources: 0,
    followers: 0,
    eventsCount: 0,
    loading: false,
  });

  // Estado para dados de comunidade
  const [communityData, setCommunityData] = React.useState<CommunityData>({
    contacts: 0,
    followers: 0,
    emailList: 0,
    eventsCount: 0,
    monthlySeries: [],
    loading: false,
  });

  // Estado para dados de comportamento
  const [behaviorData, setBehaviorData] = React.useState<BehaviorData>({
    avgOrderValue: '0.00',
    avgTicketsPerOrder: '0.0',
    avgAnticipationHours: 0,
    seasonalityByDay: [0, 0, 0, 0, 0, 0, 0],
    anticipationBuckets: {
      afterStart: 0,
      lessThan24h: 0,
      day1ToWeek: 0,
      week1To2: 0,
      week2To3: 0,
      week3To4: 0,
      moreThan1Month: 0,
    },
    loading: false,
  });

  // Estado para dados demográficos
  const [demographicsData, setDemographicsData] = React.useState<DemographicsData>({
    contactsCount: 0,
    avgAge: 0,
    ageRanges: { '-18': 0, '18-20': 0, '21-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '41-45': 0, '46+': 0 },
    stateDistribution: [],
    cityDistribution: [],
    loading: false,
  });

  // Estado para toggle Estado/Cidade
  const [locationView, setLocationView] = React.useState<'estado' | 'cidade'>('estado');

  // Estado para gostos musicais
  const [musicTastesData, setMusicTastesData] = React.useState<MusicTastesData>({
    contactsCount: 0,
    genres: [],
    artists: [],
    loading: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedOrg?.id) { setEvents([]); setActiveEventId(''); return; }
      setLoadingEvents(true);
      try {
        const path = `/api/organization/${selectedOrg.id}/events`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });
        if (cancelled) return;
        if (!r.ok) {
          setEvents([]);
          return;
        }
        const loaded = await r.json().catch(() => []);
        if (cancelled) return;
        const mapped: EventLite[] = (loaded || []).map(e => ({ id: e.id, name: e.name, startDate: e.startDate || e.startDateUtc || null }));
        setEvents(mapped);
        setActiveEventId(prev => mapped.some(m => m.id === prev) ? prev : (mapped[0]?.id || ''));
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrg?.id]);

  // Buscar dados de vendas quando evento é selecionado
  React.useEffect(() => {
    if (!activeEventId) {
      console.log('[ReportsPage] Skipping fetch - no activeEventId');
      setSalesData(prev => ({ ...prev, loading: false }));
      return;
    }
    setSalesData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/event/${activeEventId}/financial`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });
        
        if (!r.ok) {
          console.log('[ReportsPage] No financial data (status ' + r.status + ')');
          setSalesData(prev => ({ ...prev, loading: false }));
          return;
        }

        const finData = await r.json().catch(() => null);
        console.log('[ReportsPage] Financial data received:', finData);

        if (finData && finData.ok && finData.financial) {
          const fin = finData.financial;
          console.log('[ReportsPage] Financial object details:', JSON.stringify(fin, null, 2));

          // Dados financeiros da API
          const totalGross = fin.grossRevenue || 0;
          const netRevenue = fin.netRevenue || 0;
          const availableBalance = fin.availableForWithdrawal || 0;
          const platformFeePercent = fin.platformFeePercent || 15;

          // Arrays para gráficos
          const dailySales = (fin.dailySales || []).map((d: any) => ({
            date: d.date,
            orderCount: Number(d.orderCount || 0),
            revenue: Number(d.revenue || 0),
          }));
          const ticketSales = (fin.ticketSales || []).map((t: any) => ({
            ticketTypeName: t.ticketTypeName,
            price: Number(t.price || 0),
            count: Number(t.count || 0),
            total: Number(t.total || 0),
          }));

          // totalOrders calculado do dailySales (PAID orders apenas)
          const totalOrders = dailySales.reduce((sum: number, d: any) => sum + d.orderCount, 0);
          const paidOrders = totalOrders;
          const pendingOrders = 0;

          console.log('[ReportsPage] Sales data calculated:', { totalGross, totalOrders, netRevenue, availableBalance });
          setSalesData({
            totalGross,
            totalOrders,
            paidOrders,
            pendingOrders,
            netRevenue,
            availableBalance,
            platformFeePercent,
            dailySales,
            ticketSales,
            loading: false,
          });
        } else {
          console.log('[ReportsPage] No financial data');
          setSalesData(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching sales data:', err);
        setSalesData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [activeEventId]);

  // Buscar dados de promoters (marketing links) quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'vendas/promoters' || !activeEventId) {
      return;
    }
    setPromoterData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/event/${activeEventId}/marketing-links`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) {
          console.log('[ReportsPage] No promoter data');
          setPromoterData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok) {
          setPromoterData({
            links: data.links || [],
            summary: data.summary || {
              totalLinks: 0,
              totalViews: 0,
              totalSold: 0,
              totalRevenue: 0,
              avgConversion: '0.00',
            },
            loading: false,
          });
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching promoter data:', err);
        setPromoterData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, activeEventId]);

  // Buscar dados de tráfego quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'trafego/event-page' || !activeEventId) {
      return;
    }
    setTrafficData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/event/${activeEventId}/traffic`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) {
          console.log('[ReportsPage] No traffic data');
          setTrafficData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.traffic) {
          setTrafficData({
            totalViews: data.traffic.totalViews || 0,
            totalSold: data.traffic.totalSold || 0,
            conversionRate: data.traffic.conversionRate || '0.00',
            dailyViews: data.traffic.dailyViews || [],
            sources: data.traffic.sources || 0,
            loading: false,
          });
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching traffic data:', err);
        setTrafficData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, activeEventId]);

  // Buscar dados de tráfego da organização (Minha Página)
  React.useEffect(() => {
    if (subTab !== 'trafego/my-page' || !selectedOrg?.id) {
      return;
    }
    setOrgTrafficData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/${selectedOrg.id}/traffic`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) {
          console.log('[ReportsPage] No org traffic data');
          setOrgTrafficData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.traffic) {
          setOrgTrafficData({
            totalViews: data.traffic.totalViews || 0,
            totalSold: data.traffic.totalSold || 0,
            conversionRate: data.traffic.conversionRate || '0.00',
            dailyViews: data.traffic.dailyViews || [],
            sources: data.traffic.sources || 0,
            followers: data.traffic.followers || 0,
            eventsCount: data.traffic.eventsCount || 0,
            loading: false,
          });
          // Also update the old orgTrafficSeries for chart compatibility
          setOrgTrafficSeries(
            (data.traffic.dailyViews || []).map((d: any) => ({
              date: d.date,
              total: d.views,
            }))
          );
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching org traffic data:', err);
        setOrgTrafficData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, selectedOrg?.id]);

  // Buscar dados de comunidade quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'comunidade/overview' || !selectedOrg?.id) {
      return;
    }
    setCommunityData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/${selectedOrg.id}/community`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) {
          console.log('[ReportsPage] No community data');
          setCommunityData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.community) {
          setCommunityData({
            contacts: data.community.contacts || 0,
            followers: data.community.followers || 0,
            emailList: data.community.emailList || 0,
            eventsCount: data.community.eventsCount || 0,
            monthlySeries: data.community.monthlySeries || [],
            loading: false,
          });
          // Also update the old communitySeries for chart compatibility
          setCommunitySeries(
            (data.community.monthlySeries || []).map((d: any) => ({
              date: d.date,
              contatos: d.contacts,
              seguidores: d.followers,
              email: d.email,
            }))
          );
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching community data:', err);
        setCommunityData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, selectedOrg?.id]);

  // Buscar dados de comportamento quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'comunidade/comportamento' || !selectedOrg?.id) {
      return;
    }
    setBehaviorData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/${selectedOrg.id}/behavior`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });
        
        if (!r.ok) {
          setBehaviorData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.behavior) {
          setBehaviorData({
            avgOrderValue: data.behavior.avgOrderValue || '0.00',
            avgTicketsPerOrder: data.behavior.avgTicketsPerOrder || '0.0',
            avgAnticipationHours: data.behavior.avgAnticipationHours || 0,
            seasonalityByDay: data.behavior.seasonalityByDay || [0, 0, 0, 0, 0, 0, 0],
            anticipationBuckets: data.behavior.anticipationBuckets || {
              afterStart: 0, lessThan24h: 0, day1ToWeek: 0, week1To2: 0, week2To3: 0, week3To4: 0, moreThan1Month: 0
            },
            loading: false,
          });
        } else {
          setBehaviorData(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching behavior:', err);
        setBehaviorData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, selectedOrg?.id]);

  // Buscar dados demográficos quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'comunidade/socio' || !selectedOrg?.id) {
      return;
    }
    setDemographicsData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/${selectedOrg.id}/demographics`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });
        
        if (!r.ok) {
          setDemographicsData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.demographics) {
          setDemographicsData({
            contactsCount: data.demographics.contactsCount || 0,
            avgAge: data.demographics.avgAge || 0,
            ageRanges: data.demographics.ageRanges || {},
            stateDistribution: data.demographics.stateDistribution || [],
            cityDistribution: data.demographics.cityDistribution || [],
            loading: false,
          });
        } else {
          setDemographicsData(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching demographics:', err);
        setDemographicsData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, selectedOrg?.id]);

  // Buscar dados de gostos musicais quando aba é selecionada
  React.useEffect(() => {
    if (subTab !== 'comunidade/gostos' || !selectedOrg?.id) {
      return;
    }
    setMusicTastesData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        const path = `/api/organization/${selectedOrg.id}/music-tastes`;
        const r = await fetchApi(path, { headers: { 'Accept': 'application/json' } });

        if (!r.ok) {
          setMusicTastesData(prev => ({ ...prev, loading: false }));
          return;
        }

        const data = await r.json().catch(() => null);
        if (data && data.ok && data.musicTastes) {
          setMusicTastesData({
            contactsCount: data.musicTastes.contactsCount || 0,
            genres: data.musicTastes.genres || [],
            artists: data.musicTastes.artists || [],
            loading: false,
          });
        } else {
          setMusicTastesData(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('[ReportsPage] Error fetching music tastes:', err);
        setMusicTastesData(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [subTab, selectedOrg?.id]);

  const EmptySalesOverview = (
    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
      <div className="text-lg font-semibold text-slate-900 dark:text-white">Ainda não há dados de vendas</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assim que seus primeiros ingressos estiverem à venda, detalhes sobre suas vendas aparecerão aqui</div>
      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
    </div>
  );

  return (
    <OrganizerLayout>
      <div className="relative min-h-screen w-full bg-transparent dark:bg-[#0b0b0b] dark:text-white">
        {/* Mobile Menu */}
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          organizations={orgs}
          selectedOrg={selectedOrg}
          selectOrganization={setSelectedOrgById}
          user={user}
        />

        <SidebarMenu activeKeyOverride="relatorios" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <AppHeader />
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mt-16 px-2 max-md:mt-10 max-sm:mt-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white max-sm:text-2xl">Análises</h1>

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
            <main className="flex-1 pb-24">
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
                        disabled={loadingEvents || events.length === 0}
                        value={activeEventId}
                        onChange={e => setActiveEventId(e.target.value)}
                        className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                      >
                        {events.length === 0 ? (
                          <option>Sem eventos ainda</option>
                        ) : (
                          events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Cards de métricas de vendas */}
                  {salesData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados de vendas...</div>
                    </div>
                  ) : salesData.totalGross === 0 && salesData.totalOrders === 0 ? (
                    EmptySalesOverview
                  ) : (
                    <>
                      {/* Cards de Métricas - 3 colunas */}
                      <div className="grid grid-cols-3 gap-4 mt-6 max-md:grid-cols-2 max-sm:grid-cols-1">
                        {/* Receita Bruta */}
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Receita Bruta</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                            {salesData.totalGross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>

                        {/* Receita Líquida */}
                        <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Receita Líquida</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                            {salesData.netRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Após taxa de {salesData.platformFeePercent}%</div>
                        </div>

                        {/* Saldo Disponível */}
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Saldo Disponível</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">
                            {salesData.availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">Pronto para saque</div>
                        </div>
                      </div>

                      {/* Segunda linha de Cards */}
                      <div className="grid grid-cols-3 gap-4 mt-4 max-md:grid-cols-2 max-sm:grid-cols-1">
                        {/* Total de Pedidos */}
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Total de Pedidos</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {salesData.totalOrders}
                          </div>
                        </div>

                        {/* Ticket Médio */}
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Ticket Médio</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {salesData.totalOrders > 0
                              ? (salesData.totalGross / salesData.totalOrders).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : 'R$ 0,00'
                            }
                          </div>
                        </div>

                        {/* Taxa da Plataforma */}
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Taxa da Plataforma</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {salesData.platformFeePercent}%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {(salesData.totalGross - salesData.netRevenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} retido
                          </div>
                        </div>
                      </div>

                      {/* Gráfico de Vendas por Dia */}
                      {salesData.dailySales.length > 0 && (
                        <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vendas dos últimos 30 dias</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={salesData.dailySales}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                                  labelFormatter={(label) => `Data: ${label}`}
                                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Vendas por Tipo de Ingresso */}
                      {salesData.ticketSales.length > 0 && (
                        <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vendas por Tipo de Ingresso</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                  <th className="text-left py-3 text-slate-600 dark:text-slate-400 font-medium">Tipo de Ingresso</th>
                                  <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Preço</th>
                                  <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Quantidade</th>
                                  <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {salesData.ticketSales.map((ts, idx) => (
                                  <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                                    <td className="py-3 text-slate-900 dark:text-white font-medium">{ts.ticketTypeName}</td>
                                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">{ts.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">{ts.count}</td>
                                    <td className="py-3 text-right text-slate-900 dark:text-white font-medium">{ts.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {subTab === 'vendas/promoters' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Links de Marketing</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Acompanhe o desempenho dos seus links de promoters</div>
                    </div>
                    <div className="w-64">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar evento</label>
                      <select
                        disabled={loadingEvents || events.length === 0}
                        value={activeEventId}
                        onChange={e => setActiveEventId(e.target.value)}
                        className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                      >
                        {events.length === 0 ? (
                          <option>Nenhum evento publicado ainda</option>
                        ) : (
                          events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Conteúdo de Promoters */}
                  {promoterData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados de promoters...</div>
                    </div>
                  ) : promoterData.links.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum link de marketing ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crie links de marketing para rastrear vendas por promoters</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Criar link de marketing</button>
                    </div>
                  ) : (
                    <>
                      {/* Cards de Resumo */}
                      <div className="grid grid-cols-5 gap-4 mt-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Total Links</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{promoterData.summary.totalLinks}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Visualizações</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{promoterData.summary.totalViews}</div>
                        </div>
                        <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Vendas</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{promoterData.summary.totalSold}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Receita</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{promoterData.summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Conversão Média</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{promoterData.summary.avgConversion}%</div>
                        </div>
                      </div>

                      {/* Tabela de Links */}
                      <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Links de Marketing</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                <th className="text-left py-3 text-slate-600 dark:text-slate-400 font-medium">Alias</th>
                                <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Views</th>
                                <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Vendas</th>
                                <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Receita</th>
                                <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-medium">Conversão</th>
                              </tr>
                            </thead>
                            <tbody>
                              {promoterData.links.map((link) => (
                                <tr key={link.id} className="border-b border-zinc-100 dark:border-zinc-800">
                                  <td className="py-3 text-slate-900 dark:text-white font-medium">{link.alias}</td>
                                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">{link.views}</td>
                                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">{link.sold}</td>
                                  <td className="py-3 text-right text-emerald-600 dark:text-emerald-500 font-medium">{link.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  <td className="py-3 text-right text-indigo-600 dark:text-indigo-400">{link.conversionRate}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {subTab === 'trafego/event-page' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tráfego do Evento</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Acompanhe as visualizações da página do seu evento</div>
                    </div>
                    <div className="w-64">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Selecionar evento</label>
                      <select
                        disabled={loadingEvents || events.length === 0}
                        value={activeEventId}
                        onChange={e => setActiveEventId(e.target.value)}
                        className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] px-3 text-sm text-slate-700 dark:text-white disabled:opacity-70"
                      >
                        {events.length === 0 ? (
                          <option>Nenhum evento publicado ainda</option>
                        ) : (
                          events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Conteúdo de Tráfego */}
                  {trafficData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados de tráfego...</div>
                    </div>
                  ) : trafficData.totalViews === 0 && trafficData.sources === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados de tráfego ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crie links de marketing para rastrear visualizações do seu evento</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Criar link de marketing</button>
                    </div>
                  ) : (
                    <>
                      {/* Cards de Métricas */}
                      <div className="grid grid-cols-4 gap-4 mt-6 max-md:grid-cols-2 max-sm:grid-cols-1">
                        <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Visualizações</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{trafficData.totalViews}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Conversões</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{trafficData.totalSold}</div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Taxa de Conversão</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{trafficData.conversionRate}%</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Fontes de Tráfego</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{trafficData.sources}</div>
                        </div>
                      </div>

                      {/* Gráfico de Visualizações */}
                      {trafficData.dailyViews.length > 0 && (
                        <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Visualizações dos últimos 30 dias</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trafficData.dailyViews}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <Tooltip
                                  formatter={(value: number) => [`${value}`, 'Views']}
                                  labelFormatter={(label) => `Data: ${label}`}
                                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {subTab === 'trafego/my-page' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tráfego da Minha Página</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Visitas agregadas de todos os seus eventos</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {orgTrafficData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados de tráfego...</div>
                    </div>
                  ) : orgTrafficData.totalViews === 0 && orgTrafficData.sources === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados de tráfego ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crie links de marketing nos seus eventos para rastrear visualizações</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                    </div>
                  ) : (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-5 gap-4 mt-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                        <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Visualizações</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{orgTrafficData.totalViews}</div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Últimos 90 dias</div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Seguidores</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{orgTrafficData.followers || 0}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Eventos</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{orgTrafficData.eventsCount || 0}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Conversões</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{orgTrafficData.totalSold}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Taxa de Conversão</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{orgTrafficData.conversionRate}%</div>
                        </div>
                      </div>

                      {/* Evolução */}
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-10">Como as visitas estão evoluindo com o tempo?</h3>
                      <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Total de visitas nos últimos 90 dias</div>
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
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-10">De onde as visitas vêm?</h3>
                      <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Fontes de tráfego</div>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" />
                            <span className="text-sm text-slate-800 dark:text-slate-200">Links de Marketing</span>
                          </div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">{orgTrafficData.sources}</div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">100%</div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {subTab === 'comunidade/overview' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visão geral da Comunidade</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Sua base de contatos, seguidores e inscritos de todos os eventos</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {communityData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados da comunidade...</div>
                    </div>
                  ) : communityData.contacts === 0 && communityData.followers === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados de comunidade ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Depois que você tiver vendas e seguidores, os dados aparecerão aqui</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                    </div>
                  ) : (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-4 gap-4 mt-6 max-md:grid-cols-2 max-sm:grid-cols-1">
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Contatos</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{communityData.contacts}</div>
                          <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Compradores únicos</div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Seguidores</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{communityData.followers}</div>
                          <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">Na Fauves</div>
                        </div>
                        <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-2">Lista de Email</div>
                          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-500">{communityData.emailList}</div>
                          <div className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1">Contatos + Seguidores</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Eventos</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{communityData.eventsCount}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Publicados</div>
                        </div>
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
                              {['< 3 meses', '3 a 6 meses', '6 a 12 meses', '12 a 24 meses', '> 24 meses'].map((row, i) => (
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
                              <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickMargin={6} />
                              <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} formatter={(v: any, n: any) => [String(v), n === 'contatos' ? 'Contatos' : n === 'seguidores' ? 'Seguidores na Shotgun' : 'Inscritos no email']} />
                              <Line type="monotone" dataKey="contatos" name="Contatos" stroke="#10b981" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="seguidores" name="Seguidores na Shotgun" stroke="#a78bfa" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="email" name="Inscritos no email" stroke="#22d3ee" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex gap-6 mt-3 text-xs text-slate-400">
                          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 inline-block rounded-sm" />Contatos</div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-400 inline-block rounded-sm" />Seguidores na Shotgun</div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-400 inline-block rounded-sm" />Inscritos no email</div>
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
                </>
              )}

              {/* Aba Comportamento */}
              {subTab === 'comunidade/comportamento' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Comportamento</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Padrões de compra dos seus clientes</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {behaviorData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados de comportamento...</div>
                    </div>
                  ) : (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-3 gap-4 mt-6 max-md:grid-cols-1">
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Média de valor por compra</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">R$ {behaviorData.avgOrderValue}</div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Média de ingressos por compra</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{behaviorData.avgTicketsPerOrder}</div>
                        </div>
                        <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-[#121212] p-5 shadow-sm">
                          <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-2">Média de antecipação dos pedidos</div>
                          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-500">{behaviorData.avgAnticipationHours} <span className="text-lg font-normal">horas</span></div>
                        </div>
                      </div>

                      {/* Sazonalidade dos pedidos */}
                      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Sazonalidade dos pedidos</div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { day: 'Seg', total: behaviorData.seasonalityByDay[0] },
                              { day: 'Ter', total: behaviorData.seasonalityByDay[1] },
                              { day: 'Qua', total: behaviorData.seasonalityByDay[2] },
                              { day: 'Qui', total: behaviorData.seasonalityByDay[3] },
                              { day: 'Sex', total: behaviorData.seasonalityByDay[4] },
                              { day: 'Sáb', total: behaviorData.seasonalityByDay[5] },
                              { day: 'Dom', total: behaviorData.seasonalityByDay[6] },
                            ]}>
                              <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                              <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} />
                              <Bar dataKey="total" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {behaviorData.seasonalityByDay.every(v => v === 0) && (
                          <div className="flex justify-center mt-4">
                            <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                          </div>
                        )}
                      </div>

                      {/* Antecipação dos pedidos */}
                      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Antecipação dos pedidos</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          A média de antecipação de pedido dos seus participantes é de <span className="text-cyan-500 font-semibold">{behaviorData.avgAnticipationHours} horas</span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { label: 'depois início', value: behaviorData.anticipationBuckets.afterStart },
                              { label: '< 24 horas', value: behaviorData.anticipationBuckets.lessThan24h },
                              { label: '24h a 1 sem', value: behaviorData.anticipationBuckets.day1ToWeek },
                              { label: '1 a 2 sem', value: behaviorData.anticipationBuckets.week1To2 },
                              { label: '2 a 3 sem', value: behaviorData.anticipationBuckets.week2To3 },
                              { label: '3 a 4 sem', value: behaviorData.anticipationBuckets.week3To4 },
                              { label: '> 1 mês', value: behaviorData.anticipationBuckets.moreThan1Month },
                            ]}>
                              <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={0} />
                              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                              <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} />
                              <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {Object.values(behaviorData.anticipationBuckets).every(v => v === 0) && (
                          <div className="flex justify-center mt-4">
                            <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Aba Sócio-demográfico */}
              {subTab === 'comunidade/socio' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sócio-demográfico</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Perfil demográfico dos seus contatos de todos os eventos</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {demographicsData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando dados demográficos...</div>
                    </div>
                  ) : demographicsData.contactsCount === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados demográficos ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Depois que você tiver compradores, os dados aparecerão aqui</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 mt-6 max-lg:grid-cols-1">
                      {/* Idade */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Idade</div>
                        <div className="text-xs text-cyan-500 mb-4">
                          Os seus contatos têm <span className="font-semibold">{demographicsData.avgAge} anos</span> em média
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(demographicsData.ageRanges).map(([range, count]) => ({ range, count }))} layout="vertical">
                              <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />
                              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                              <YAxis dataKey="range" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={50} />
                              <Tooltip contentStyle={{ background: '#2b2b2b', border: '1px solid #3b3b3b', borderRadius: 8, color: '#fff' }} />
                              <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {Object.values(demographicsData.ageRanges).every(v => v === 0) && (
                          <div className="flex justify-center mt-4">
                            <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                          </div>
                        )}
                        <div className="text-xs text-cyan-500 mt-4">
                          Esta informação é conhecida em <span className="font-semibold">{demographicsData.contactsCount} contatos</span>
                        </div>
                      </div>

                      {/* Localização */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Localização dos contatos</div>

                        {/* Toggle Estado/Cidade */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setLocationView('estado')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locationView === 'estado' ? 'bg-indigo-600 text-white' : 'bg-zinc-700/30 text-slate-400 hover:bg-zinc-700/50'}`}
                          >
                            Estado
                          </button>
                          <button
                            onClick={() => setLocationView('cidade')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locationView === 'cidade' ? 'bg-indigo-600 text-white' : 'bg-zinc-700/30 text-slate-400 hover:bg-zinc-700/50'}`}
                          >
                            Cidade
                          </button>
                        </div>

                        {/* Tabela de localização */}
                        <div className="max-h-64 overflow-y-auto">
                          {(locationView === 'estado' ? demographicsData.stateDistribution : demographicsData.cityDistribution).length === 0 ? (
                            <div className="flex justify-center py-8">
                              <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="text-slate-600 dark:text-slate-400 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                <tr>
                                  <th className="text-left py-2">{locationView === 'estado' ? 'Estado' : 'Cidade'}</th>
                                  <th className="text-right py-2">Contatos</th>
                                  <th className="text-right py-2">%</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-300">
                                {(locationView === 'estado' ? demographicsData.stateDistribution : demographicsData.cityDistribution).map((item, i) => {
                                  const total = (locationView === 'estado' ? demographicsData.stateDistribution : demographicsData.cityDistribution).reduce((s, x) => s + x.count, 0);
                                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                                  return (
                                    <tr key={i} className="border-b border-zinc-200/30 dark:border-zinc-700/30">
                                      <td className="py-2">{item.name}</td>
                                      <td className="py-2 text-right">{item.count}</td>
                                      <td className="py-2 text-right">{pct}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Aba Gostos Musicais */}
              {subTab === 'comunidade/gostos' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gostos musicais</h1>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Preferências musicais dos seus contatos baseado nos eventos frequentados</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {musicTastesData.loading ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-slate-500 dark:text-slate-400">Carregando gostos musicais...</div>
                    </div>
                  ) : musicTastesData.contactsCount === 0 ? (
                    <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem dados de gostos musicais ainda</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Depois que você tiver compradores, os dados aparecerão aqui</div>
                      <button onClick={() => navigate('/organizer-events')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Ir para meus eventos</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 mt-6 max-lg:grid-cols-1">
                      {/* Gêneros musicais populares */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Gêneros musicais populares</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Gêneros musicais de eventos de outros produtores que a sua comunidade já foi.
                        </div>

                        {musicTastesData.genres.length === 0 ? (
                          <div className="flex justify-center py-8">
                            <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                          </div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="text-slate-600 dark:text-slate-400 border-b border-zinc-200/50 dark:border-zinc-700/50">
                              <tr>
                                <th className="text-left py-2">Gêneros</th>
                                <th className="text-right py-2">Contatos</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-300">
                              {musicTastesData.genres.map((item, i) => (
                                <tr key={i} className="border-b border-zinc-200/30 dark:border-zinc-700/30">
                                  <td className="py-2">{item.name}</td>
                                  <td className="py-2 text-right">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Artistas populares */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Artistas populares</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Artistas de eventos de outros produtores que a sua comunidade já foi.
                        </div>

                        {musicTastesData.artists.length === 0 ? (
                          <div className="flex justify-center py-8">
                            <span className="px-3 py-1 rounded-full bg-zinc-700/60 text-white text-xs">Sem dados disponíveis por enquanto</span>
                          </div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="text-slate-600 dark:text-slate-400 border-b border-zinc-200/50 dark:border-zinc-700/50">
                              <tr>
                                <th className="text-left py-2">Artistas</th>
                                <th className="text-right py-2">Contatos</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-300">
                              {musicTastesData.artists.map((item, i) => (
                                <tr key={i} className="border-b border-zinc-200/30 dark:border-zinc-700/30">
                                  <td className="py-2">{item.name}</td>
                                  <td className="py-2 text-right">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {subTab !== 'vendas/overview' && subTab !== 'vendas/promoters' && subTab !== 'trafego/event-page' && subTab !== 'trafego/my-page' && subTab !== 'comunidade/overview' && subTab !== 'comunidade/comportamento' && subTab !== 'comunidade/socio' && subTab !== 'comunidade/gostos' && (
                <div className="text-slate-400 dark:text-slate-500 text-sm">Em breve</div>
              )}
            </main>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}

export default OrganizerReportsPage;
