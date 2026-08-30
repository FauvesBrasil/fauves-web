import * as React from "react";
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchApi } from '@/lib/apiBase';
import { getEventPath } from '@/lib/eventUrl';
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import SidebarMenu from "@/components/SidebarMenu";
import { Button } from "@/components/ui/button";
import { CourtesyModal } from "@/components/CourtesyModal";
import { Clipboard, ClipboardCheck, Users, Ticket, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import AppHeader from "@/components/AppHeader";
import {
  CardTotalVendas,
  CardDisponivelRetirada,
  CardTicketMedio,
  CardCheckinStatus,
  SalesOverviewChart,
  TicketTypePieChart,
  RecentActivityFeed,
  CardAlertasFinanceiros,
} from '@/components/DashboardExtraCards';
import EventDashboardSkeleton, { QuickActionsCard } from '@/components/EventDashboardSkeleton';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import { OrganizerLayout } from "@/components/OrganizerLayout";
import { ScanAppCard } from "@/components/ScanAppCard";


const EventPanel: React.FC = () => {
  const { totalLeft } = useLayoutOffsets();
  const { user } = useAuth();
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId;
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dashboard State
  const [ticketTypes, setTicketTypes] = React.useState<any[]>([]);
  const [transactions, setTransactions] = React.useState<any[]>([]); // Recent orders
  const [salesTrend, setSalesTrend] = React.useState<any[]>([]); // Chart data
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    withdrawable: 0,
    avgTicket: 0,
    soldCount: 0,
    checkinCount: 0,
    capacity: 0,
  });

  const [copyOk, setCopyOk] = React.useState(false);
  // Courtesy form state
  const [courtesyEmail, setCourtesyEmail] = React.useState("");
  const [courtesyTicketTypeId, setCourtesyTicketTypeId] = React.useState<string>("");
  const { toast } = useToast();
  const [courtesyLoading, setCourtesyLoading] = React.useState(false);

  const isValidEmail = React.useCallback((s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()), []);
  const courtesyDisabled = courtesyLoading || !isValidEmail(courtesyEmail) || !courtesyTicketTypeId;

  // FIX: Destructure loading from OrganizationContext to correctly wait for it
  const { selectedOrg, orgs: organizations, setSelectedOrgById: selectOrganization, loading: orgLoading } = useOrganization();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [eventMenuOpen, setEventMenuOpen] = React.useState(false);
  const [courtesyModalOpen, setCourtesyModalOpen] = React.useState(false);

  const eventLink = React.useMemo(() => {
    if (!event || !id) return '';
    return window.location.origin + getEventPath({ id: event.id || id, slug: event.slug });
  }, [event, id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventLink);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    } catch (_) { }
  };

  const handleCreateCourtesy = async () => {
    if (!courtesyEmail || !courtesyTicketTypeId) return;
    setCourtesyLoading(true);
    try {
      const res = await fetchApi('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          ticketTypeId: courtesyTicketTypeId,
          email: courtesyEmail,
          issuedBy: user?.id
        })
      });
      if (!res.ok) throw new Error('Falha ao emitir cortesia');
      toast({ title: 'Cortesia enviada!', description: `Enviada para ${courtesyEmail}` });
      setCourtesyEmail("");
      setCourtesyModalOpen(false);
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível emitir a cortesia.', variant: 'destructive' });
    } finally {
      setCourtesyLoading(false);
    }
  };

  // Calculate ticket sales data for Pie Chart
  const pieData = ticketTypes.map(t => ({
    name: t.name,
    value: t.soldCount || 0
  })).filter(d => d.value > 0);

  // Fallback if no specific type data yet
  if (pieData.length === 0 && stats.soldCount > 0) {
    pieData.push({ name: 'Geral', value: stats.soldCount });
  }

  React.useEffect(() => {
    if (!id) return;

    // FIX: If org context is still loading, keep spinning but don't early return safely until we know status
    if (orgLoading) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Helper to check ownership
    const belongsToSelected = (evt: any) => {
      if (!selectedOrg) return false;
      return !!evt && (evt.organizerId === selectedOrg.id || evt.organizationId === selectedOrg.id);
    };

    const load = async () => {
      try {
        // 1. Fetch Event Basic Info first (critical for ownership check)
        const res = await fetchApi(`/api/event/${id}`);
        if (!res.ok) throw new Error('Falha ao carregar evento');
        const evt = await res.json();

        if (cancelled) return;

        setEvent(evt);

        // Ownership/Redirect Logic
        if (organizations.length > 0 && selectedOrg && !belongsToSelected(evt)) {
          const ownerOrg = organizations.find(o => o.id === evt.organizerId || o.id === evt.organizationId);
          if (ownerOrg) {
            selectOrganization(ownerOrg.id);
          }
        }

        // 2. Parallel Fetch of Dashboard Data
        // We catch individual errors so one failure doesn't break the whole dashboard
        const [
          ticketsRes,
          analyticsRes,
          ordersRes,
          finRes,
          tStatsRes,
          byTypeRes
        ] = await Promise.all([
          fetchApi(`/api/ticket-type/event/${id}`).catch(() => null),
          fetchApi(`/api/events/${id}/analytics/abandonment?days=30`).catch(() => null),
          fetchApi(`/api/orders?eventId=${id}&paymentStatus=PAID&limit=50`).catch(() => null),
          fetchApi(`/api/organization/event/${id}/financial`).catch(() => null),
          fetchApi(`/api/ticket/event/${id}/tickets?limit=1`).catch(() => null),
          fetchApi(`/api/ticket/event/${id}/by-type`).catch(() => null)
        ]);

        if (cancelled) return;

        // Unlock the UI early - we have the event
        setLoading(false);

        // Process Ticket Types
        let types = [];
        if (ticketsRes?.ok) {
          const data = await ticketsRes.json().catch(() => []);
          types = Array.isArray(data) ? data : [];
          setTicketTypes(types);
        }

        // Process Trends
        let trendData: any[] = [];
        if (analyticsRes?.ok) {
          const analytics = await analyticsRes.json().catch(() => ({}));
          if (analytics.dailyTrend) trendData = analytics.dailyTrend;
        }

        // Process Recent Orders
        let recentOrders: any[] = [];
        if (ordersRes?.ok) {
          const ordersData = await ordersRes.json().catch(() => ({}));
          recentOrders = ordersData.items || [];
          setTransactions(recentOrders);
        }

        // Process Financials
        let revenue = 0;
        let paidCount = 0;
        let withdrawable = 0;
        let avgTicket = 0;

        if (finRes?.ok) {
          const finData = await finRes.json().catch(() => ({}));
          if (finData.ok && finData.financial) {
            revenue = finData.financial.grossRevenue || 0;
            withdrawable = finData.financial.availableForWithdrawal || 0;
            paidCount = finData.financial.ticketCount || 0;
            avgTicket = paidCount > 0 ? revenue / paidCount : 0;
          }
        }

        // Process Ticket Stats
        let soldCount = 0;
        let checkinCount = 0;
        if (tStatsRes?.ok) {
          const tData = await tStatsRes.json().catch(() => ({}));
          if (tData.stats) {
            soldCount = tData.stats.sold || 0;
            checkinCount = tData.stats.checkedIn || 0;
          }
        }

        // Update Stats State once
        setStats({
          totalRevenue: revenue,
          withdrawable,
          avgTicket,
          soldCount,
          checkinCount,
          capacity: 0
        });

        // 7. Calculate Sales Trend Value
        const avg = paidCount > 0 ? (revenue / paidCount) : 50;
        const enrichedTrend = trendData.map((d: any) => ({
          date: d.date,
          value: (d.paid || 0) * avg
        })).reverse();
        setSalesTrend(enrichedTrend.reverse());

        // 8. Update Ticket Types with Sold Count for Pie Chart
        if (byTypeRes?.ok) {
          const byType = await byTypeRes.json().catch(() => []);
          const map: any = {};
          if (Array.isArray(byType)) {
            byType.forEach((x: any) => map[x.ticketTypeId] = Number(x.count));
            setTicketTypes(prev => prev.map(p => ({ ...p, soldCount: map[p.id] || 0 })));
          }
        }

      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, selectedOrg, organizations, selectOrganization, orgLoading]);

  // Loading state handling:
  // If we have 'event', we can show the sidebar and skeleton for dashboard.
  // If we don't have 'event' yet, we show full spinner.
  if (orgLoading || (!event && loading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
      <div className="mb-4">{error}</div>
      <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
    </div>
  );



  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full min-h-screen">

      {/* Mobile menus */}
      <div className="lg:hidden">
        <EventMobileTopBar
          title={event?.name || 'Painel do Evento'}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        <EventMobileDrawer
          isOpen={eventMenuOpen}
          onClose={() => setEventMenuOpen(false)}
          currentPath={location.pathname}
          eventId={event?.id || ''}
          eventName={event?.name}
          eventDate={event?.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : undefined}
          eventStatus={event?.status}
        />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          user={user}
          organizations={organizations}
          selectedOrg={selectedOrg}
          selectOrganization={selectOrganization}
        />
      </div>

      {/* Desktop Sidebars - Outside Layout for correct Z-index/Positioning */}
      <SidebarMenu className="max-lg:hidden" />
      <div className="max-lg:hidden">
        <EventDetailsSidebar
          eventIdOverride={event?.id}
          eventName={event?.name}
          eventCover={event?.coverUrl} // Note: check if coverUrl is valid prop if not seen
          eventDate={event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : undefined}
          ticketCount={stats.soldCount}
          fixed={true}
          fixedTop={0}
        />
      </div>

      <AppHeader />

      <OrganizerLayout>
        <div
          className="flex flex-col pl-8 max-md:pl-4 pr-8 max-md:pr-4 pb-16 max-md:pb-8 relative transition-all duration-300"
          style={{ marginLeft: totalLeft > 0 ? `${totalLeft}px` : '0px' }}
        >
          <div className="mt-24 max-md:mt-[140px] max-w-[1200px] w-full mx-auto space-y-8">
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Painel do Evento</h1>
                <p className="text-zinc-500 text-sm mt-1">Visão geral e métricas em tempo real</p>
              </div>
              <div className="flex items-center gap-2">
                <CourtesyModal
                  open={courtesyModalOpen}
                  onOpenChange={setCourtesyModalOpen}
                  email={courtesyEmail}
                  setEmail={setCourtesyEmail}
                  ticketTypeId={courtesyTicketTypeId}
                  setTicketTypeId={setCourtesyTicketTypeId}
                  ticketTypes={ticketTypes}
                  loading={courtesyLoading}
                  disabled={courtesyDisabled}
                  onSubmit={handleCreateCourtesy}
                />
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm" onClick={() => setCourtesyModalOpen(true)}>
                  <Ticket className="w-4 h-4" /> Emitir cortesia
                </Button>
                <Button variant="outline" className="gap-2" onClick={copyLink}>
                  {copyOk ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
                  {copyOk ? 'Copiado!' : 'Copiar link'}
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => navigate(`/event/manage/${id}/analytics`)}>
                  <Users className="w-4 h-4" /> Relatório completo
                </Button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardTotalVendas total={stats.totalRevenue} />
              <CardDisponivelRetirada valor={stats.withdrawable} details="Disponível para saque" />
              <CardTicketMedio valor={stats.avgTicket} />
              <CardCheckinStatus confirmados={stats.soldCount} checkins={stats.checkinCount} />
            </div>

            {/* Card do Scanner App - Logo após KPIs */}
            <div className="mt-6">
              <ScanAppCard accessCode={event?.accessCode} eventId={id!} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column (Charts) - Spans 2 cols */}
              <div className="lg:col-span-2 space-y-6">
                <SalesOverviewChart data={salesTrend} />
                <TicketTypePieChart data={pieData} />
              </div>


              {/* Right Column (Feed and Alerts) */}
              <div className="space-y-6">
                <RecentActivityFeed orders={transactions} />
                <CardAlertasFinanceiros alerts={[]} />
              </div>
            </div>
          </div>
        </div>
      </OrganizerLayout>

      <CourtesyModal
        isOpen={courtesyModalOpen}
        onClose={() => setCourtesyModalOpen(false)}
        email={courtesyEmail}
        setEmail={setCourtesyEmail}
        ticketTypeId={courtesyTicketTypeId}
        setTicketTypeId={setCourtesyTicketTypeId}
        ticketTypes={ticketTypes}
        loading={courtesyLoading}
        onSubmit={handleCreateCourtesy}
      />
    </div >
  );
};

export default EventPanel;
