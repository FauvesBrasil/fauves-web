import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from 'react';

import Index from "./pages/Index";
import OrganizerReportsPage from "./pages/ReportsPage";
import OrganizerReportsOrders from "./pages/OrganizerReportsOrders";
import OrganizerReportsSales from "./pages/OrganizerReportsSales";
import OrganizerFinances from "./pages/OrganizerFinances";
import Event from "./pages/Event";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TestSupabase from "./pages/TestSupabase"; // <-- importe o componente de teste
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ProducerJourneyDemo from './pages/ProducerJourneyDemo';
import SearchResults from './pages/SearchResults';
import AccountSettings from "./pages/AccountSettings";
import CreateEditEvent from "./pages/CreateEditEvent";
import CreateTickets from "./pages/CreateTickets";
import PublishDetails from "./pages/PublishDetails";
import CreateOrganization from "./pages/CreateOrganization";
import EventPanel from "./pages/EventPanel";
import OrganizerEvents from "./pages/OrganizerEvents";
import PublicCollection from "./pages/PublicCollection";
import OrganizationPublicProfile from "./pages/OrganizationPublicProfile";
import OrdersManager from "./pages/OrdersManager";
import MarketingTools from "./pages/MarketingTools";
import MarketingLink from "./pages/MarketingLink";
import MarketingPixels from "./pages/MarketingPixels";
import Checkout from "./pages/Checkout";
import CheckoutPix from "./pages/CheckoutPix";
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { initApiDetection } from '@/lib/apiBase';
import { LocationProvider } from '@/context/LocationContext';
import OrganizationTransitionOverlay from '@/components/OrganizationTransitionOverlay';
import OrganizerSettingsPage from './pages/OrganizerSettingsPage';
import AdminLayout from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminEvents from './pages/AdminEvents';
import AdminOrders from './pages/AdminOrders';
const AdminCategoriesLazy = React.lazy(() => import('./pages/AdminCategories'));
import ParticipantesPedidos from "./pages/ParticipantesPedidos";
import ParticipantesLista from "./pages/ParticipantesLista";
import ParticipantesCheckin from "./pages/ParticipantesCheckin";
import GerenciarEquipe from "./pages/GerenciarEquipe";

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props:any){ super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error:any){ return { hasError: true, error }; }
  componentDidCatch(error:any, info:any){ console.error('[AppErrorBoundary]', error, info); }
  render(){
    if(this.state.hasError){
      return <div style={{padding:40,fontFamily:'sans-serif'}}>
        <h2>Ocorreu um erro inesperado.</h2>
        <p style={{color:'#666',fontSize:14}}>Tente recarregar a página. Se persistir, entre em contato com o suporte.</p>
        <pre style={{whiteSpace:'pre-wrap',fontSize:12,background:'#f8f8f8',padding:12,borderRadius:8,maxHeight:200,overflow:'auto'}}>{String(this.state.error?.message || this.state.error)}</pre>
        <a href="/" style={{color:'#2563eb',textDecoration:'underline'}}>Voltar ao início</a>
      </div>;
    }
    return this.props.children as any;
  }
}

const AppInner = () => {
  const { selectedOrg, transitioning, fromOrgName } = useOrganization();
  return (
    <>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/event/:slugOrId" element={<Event />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/producer-journey-demo" element={<ProducerJourneyDemo />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/create-event" element={<CreateEditEvent />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/create-tickets" element={<CreateTickets />} />
          <Route path="/publish-details" element={<PublishDetails />} />
          <Route path="/criar-organizacao" element={<CreateOrganization />} />
          <Route path="/painel-evento/:id" element={<EventPanel />} />
          <Route path="/test-supabase" element={<TestSupabase />} />
          <Route path="/organizer-events" element={<OrganizerEvents />} />
          <Route path="/organizer-orders" element={<OrdersManager />} />
          <Route path="/organizer-marketing" element={<MarketingTools />} />
          <Route path="/marketing/link-rastreamento" element={<MarketingLink />} />
          <Route path="/marketing/link-rastreamento/:id" element={<MarketingLink />} />
          <Route path="/marketing/pixels" element={<MarketingPixels />} />
          <Route path="/marketing/pixels/:id" element={<MarketingPixels />} />
          <Route path="/colecoes/:slug" element={<PublicCollection />} />
          <Route path="/org/:slug" element={<OrganizationPublicProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/pix" element={<CheckoutPix />} />
          <Route path="/organizer-settings" element={<OrganizerSettingsPage />} />
          <Route path="/organizer-reports" element={<OrganizerReportsPage />} />
          <Route path="/organizer-reports/orders" element={<OrganizerReportsOrders />} />
          <Route path="/organizer-reports/sales" element={<OrganizerReportsSales />} />
          <Route path="/organizer-finances" element={<OrganizerFinances />} />
          <Route path="/participantes/pedidos/:eventId" element={<ParticipantesPedidos />} />
          <Route path="/participantes/lista/:eventId" element={<ParticipantesLista />} />
          <Route path="/participantes/checkin/:eventId" element={<ParticipantesCheckin />} />
          <Route path="/gerenciar-equipe/:eventId" element={<GerenciarEquipe />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<AdminUsers />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="categories" element={<Suspense fallback={<div>Carregando...</div>}><AdminCategoriesLazy /></Suspense>} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <OrganizationTransitionOverlay
        transitioning={transitioning}
        fromName={fromOrgName || selectedOrg?.name || ''}
        toName={selectedOrg?.name || ''}
      />
    </>
  );
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <OrganizationProvider>
        <LocationProvider>
          <Bootstrap />
          <AppErrorBoundary>
            <AppInner />
          </AppErrorBoundary>
        </LocationProvider>
      </OrganizationProvider>
    </AuthProvider>
  </TooltipProvider>
);

function Bootstrap(){
  // Warm API resolution as early as possible and prefetch organizations when auth is ready.
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useOrganization();
  React.useEffect(() => {
    // warm API base resolution (non-blocking)
    try { initApiDetection(); } catch(e) {}
  }, []);

  React.useEffect(() => {
    // when user becomes available, prefetch organizations
    if (!authLoading && user) {
      try { refresh(); } catch(e) { console.warn('prefetch orgs failed', e); }
    }
  }, [user, authLoading, refresh]);

  return null;
}

export default App;
