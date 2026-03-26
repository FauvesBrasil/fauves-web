import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from "./pages/Index";
import WhatToDoCity from "./pages/WhatToDoCity";
import About from "./pages/About";
import Careers from "./pages/Careers";
import EventsByCategory from "./pages/EventsByCategory";
import HalfPriceLaw from './pages/HalfPriceLaw';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ScrollToTop from './components/ScrollToTop';
import OrganizerReportsPage from "./pages/ReportsPage";
import OrganizerReportsOrders from "./pages/OrganizerReportsOrders";
import OrganizerReportsSales from "./pages/OrganizerReportsSales";
import OrganizerFinances from "./pages/OrganizerFinances";
import OrganizerFinanceEvent from "./pages/OrganizerFinanceEvent";
import Event from "./pages/Event";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TestSupabase from "./pages/TestSupabase"; // <-- importe o componente de teste
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ProducerJourneyDemo from './pages/ProducerJourneyDemo';
import ProducerJourneyPage from './pages/ProducerJourneyPage';
import SearchResults from './pages/SearchResults';
import AccountSettings from "./pages/AccountSettings";
import CreateEditEvent from "./pages/CreateEditEvent";
import CreateTickets from "./pages/CreateTickets";
import PublishDetails from "./pages/PublishDetails";
import EventPanel from "./pages/EventPanel";
import OrganizerEvents from "./pages/OrganizerEvents";
import PublicCollection from "./pages/PublicCollection";
import OrganizationPublicProfile from "./pages/OrganizationPublicProfile";
import ExpressDoor from "./pages/ExpressDoor";
import { Navigate, useParams } from "react-router-dom";
import OrdersManager from "./pages/OrdersManager";
import MarketingLink from "./pages/MarketingLink";
import MarketingPixels from "./pages/MarketingPixels";
import MarketingAmbassadors from "./pages/MarketingAmbassadors";
import MarketingTools from "./pages/MarketingTools";
import SatisfactionSurvey from "./pages/SatisfactionSurvey";
import PublicSatisfactionForm from "./pages/PublicSatisfactionForm";
import Checkout from "./pages/Checkout";
import CheckoutPix from "./pages/CheckoutPix";
import Review from "./pages/Review";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import CheckoutCanceled from './pages/CheckoutCanceled';
import SelectTickets from "./pages/SelectTickets";
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { initApiDetection } from '@/lib/apiBase';
import { LocationProvider } from '@/context/LocationContext';
import OrganizationTransitionOverlay from '@/components/OrganizationTransitionOverlay';
import OrganizerSettingsV2 from './pages/OrganizerSettingsV2';
import Notifications from './pages/Notifications';

// Lazy-loaded admin pages (only load when accessed)
const AdminLayout = React.lazy(() => import('./pages/Admin'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminOrganizations = React.lazy(() => import('./pages/AdminOrganizations'));
const AdminArtists = React.lazy(() => import('./pages/AdminArtists'));
const AdminEvents = React.lazy(() => import('./pages/AdminEvents'));
const AdminEventDetails = React.lazy(() => import('./pages/AdminEventDetails'));
const AdminOrganizationDetails = React.lazy(() => import('./pages/AdminOrganizationDetails'));
const AdminUserDetails = React.lazy(() => import('./pages/AdminUserDetails'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const AdminOrderDetails = React.lazy(() => import('./pages/AdminOrderDetails'));
const AdminSupport = React.lazy(() => import('./pages/AdminSupport'));
const AdminReports = React.lazy(() => import('./pages/AdminReports'));
const AdminTeam = React.lazy(() => import('./pages/AdminTeam'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminCategoriesLazy = React.lazy(() => import('./pages/AdminCategories'));
const AdminSlidesLazy = React.lazy(() => import('./pages/AdminSlides'));
const AdminHelpCategories = React.lazy(() => import('./pages/AdminHelpCategories'));
const AdminHelpArticles = React.lazy(() => import('./pages/AdminHelpArticles'));
const AdminHelpArticleEditor = React.lazy(() => import('./pages/AdminHelpArticleEditor'));
const AdminAnnouncements = React.lazy(() => import('./pages/AdminAnnouncements'));
const AdminAnnouncementEditor = React.lazy(() => import('./pages/AdminAnnouncementEditor'));
const AdminEmails = React.lazy(() => import('./pages/AdminEmails'));
const AdminEmailEditor = React.lazy(() => import('./pages/AdminEmailEditor'));
const AdminTicketDetail = React.lazy(() => import('./pages/AdminTicketDetail'));
const AdminLiveChat = React.lazy(() => import('./pages/AdminLiveChat'));
const AdminHelpdesk = React.lazy(() => import('./pages/AdminHelpdesk'));
const AdminKnowledgeBase = React.lazy(() => import('./pages/AdminKnowledgeBase'));

// Non-admin imports (still eager loaded)
import ParticipantesPedidos from "./pages/ParticipantesPedidos";
import ParticipantesLista from "./pages/ParticipantesLista";
import ParticipantesCheckin from "./pages/ParticipantesCheckin";
import GerenciarEquipe from "./pages/GerenciarEquipe";
import { ProtectedOrganizerRoute } from "./components/ProtectedOrganizerRoute";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

import ArtistPage from './pages/ArtistPage';
import HelpCenter from './pages/HelpCenter';
import HelpOrganizer from './pages/HelpOrganizer';
import HelpArticle from './pages/HelpArticle';
import HelpCategory from './pages/HelpCategory';
import MyTickets from './pages/MyTickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import ChatWidget from './components/ChatWidget';
import EventAnalytics from './pages/EventAnalytics';
import IssuedTickets from './pages/IssuedTickets';
import ResetPassword from './pages/ResetPassword';

// Lazy load admin analytics
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data fresh for 30s
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Only retry failed requests once
    },
  },
});

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('[AppErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Ocorreu um erro inesperado.</h2>
        <p style={{ color: '#666', fontSize: 14 }}>Tente recarregar a página. Se persistir, entre em contato com o suporte.</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f8f8f8', padding: 12, borderRadius: 8, maxHeight: 200, overflow: 'auto' }}>{String(this.state.error?.message || this.state.error)}</pre>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>Voltar ao início</a>
      </div>;
    }
    return this.props.children as any;
  }
}

const AppInner = () => {
  const { selectedOrg, transitioning, fromOrgName } = useOrganization();
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/o-que-fazer-em/:citySlug" element={<WhatToDoCity />} />
          <Route path="/quem-somos" element={<About />} />
          <Route path="/carreiras" element={<Careers />} />
          <Route path="/eventos/:categorySlug" element={<EventsByCategory />} />
          <Route path="/lei-da-meia-entrada" element={<HalfPriceLaw />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/jornada-produtor" element={<ProtectedOrganizerRoute><ProducerJourneyPage /></ProtectedOrganizerRoute>} />
          <Route path="/producer-journey-demo" element={<ProducerJourneyDemo />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/create-event" element={<ProtectedOrganizerRoute><CreateEditEvent /></ProtectedOrganizerRoute>} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/create-tickets" element={<ProtectedOrganizerRoute requireEventId><CreateTickets /></ProtectedOrganizerRoute>} />
          <Route path="/publish-details" element={<ProtectedOrganizerRoute requireEventId><PublishDetails /></ProtectedOrganizerRoute>} />
          <Route path="/ingressos-emitidos/:eventId" element={<ProtectedOrganizerRoute requireEventId><IssuedTickets /></ProtectedOrganizerRoute>} />
          <Route path="/painel-evento/:id/analytics" element={<ProtectedOrganizerRoute><EventAnalytics /></ProtectedOrganizerRoute>} />
          <Route path="/painel-evento/:id" element={<ProtectedOrganizerRoute><EventPanel /></ProtectedOrganizerRoute>} />
          <Route path="/test-supabase" element={<TestSupabase />} />
          <Route path="/organizer-events" element={<ProtectedOrganizerRoute><OrganizerEvents /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-orders" element={<ProtectedOrganizerRoute><OrdersManager /></ProtectedOrganizerRoute>} />
          {/* /organizer-marketing route removed */}
          <Route path="/marketing/link-rastreamento" element={<ProtectedOrganizerRoute><MarketingLink /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/link-rastreamento/:id" element={<ProtectedOrganizerRoute requireEventId><MarketingLink /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/pixels" element={<ProtectedOrganizerRoute><MarketingPixels /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/pixels/:id" element={<ProtectedOrganizerRoute requireEventId><MarketingPixels /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/embaixadores" element={<ProtectedOrganizerRoute><MarketingAmbassadors /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/embaixadores/:id" element={<ProtectedOrganizerRoute requireEventId><MarketingAmbassadors /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/cupons" element={<ProtectedOrganizerRoute><MarketingTools /></ProtectedOrganizerRoute>} />
          <Route path="/marketing/cupons/:id" element={<ProtectedOrganizerRoute requireEventId><MarketingTools /></ProtectedOrganizerRoute>} />
          <Route path="/pesquisa-satisfacao" element={<ProtectedOrganizerRoute><SatisfactionSurvey /></ProtectedOrganizerRoute>} />
          <Route path="/pesquisa-satisfacao/:id" element={<ProtectedOrganizerRoute requireEventId><SatisfactionSurvey /></ProtectedOrganizerRoute>} />
          {/* Public survey form (after event) */}
          <Route path="/after-event/:id" element={<PublicSatisfactionForm />} />
          {/* Backward-compat alias (can remove later) */}
          <Route path="/responder-pesquisa/:id" element={<PublicSatisfactionForm />} />
          <Route path="/colecoes/:slug" element={<PublicCollection />} />
          <Route path="/org/:slugOrId" element={<OrganizationPublicProfile />} />
          <Route path="/organization/:slugOrId" element={<OrganizationRedirect />} />
          <Route path="/venues/:slug/door" element={<ExpressDoor />} />
          <Route path="/select-tickets/:eventId" element={<SelectTickets />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/review" element={<Review />} />
          <Route path="/checkout/pix" element={<CheckoutPix />} />
          <Route path="/checkout/canceled" element={<CheckoutCanceled />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/organizer-settings" element={<ProtectedOrganizerRoute><OrganizerSettingsV2 /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-reports" element={<ProtectedOrganizerRoute><OrganizerReportsPage /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-reports/orders" element={<ProtectedOrganizerRoute><OrganizerReportsOrders /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-reports/sales" element={<ProtectedOrganizerRoute><OrganizerReportsSales /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-finances" element={<ProtectedOrganizerRoute><OrganizerFinances /></ProtectedOrganizerRoute>} />
          <Route path="/organizer-finances/:eventId" element={<ProtectedOrganizerRoute requireEventId><OrganizerFinanceEvent /></ProtectedOrganizerRoute>} />
          <Route path="/participantes/pedidos/:eventId" element={<ProtectedOrganizerRoute requireEventId><ParticipantesPedidos /></ProtectedOrganizerRoute>} />
          <Route path="/participantes/lista/:eventId" element={<ProtectedOrganizerRoute requireEventId><ParticipantesLista /></ProtectedOrganizerRoute>} />
          <Route path="/participantes/checkin/:eventId" element={<ProtectedOrganizerRoute requireEventId><ParticipantesCheckin /></ProtectedOrganizerRoute>} />
          <Route path="/gerenciar-equipe/:eventId" element={<ProtectedOrganizerRoute requireEventId><GerenciarEquipe /></ProtectedOrganizerRoute>} />
          <Route path="admin" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>}>
              <AdminLayout />
            </Suspense>
          }>
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetails />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="organizations/:orgId" element={<AdminOrganizationDetails />} />
            <Route path="artists" element={<AdminArtists />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/:eventId" element={<AdminEventDetails />} />
            <Route path="categories" element={<Suspense fallback={<div>Carregando...</div>}><AdminCategoriesLazy /></Suspense>} />
            <Route path="slides" element={<Suspense fallback={<div>Carregando...</div>}><AdminSlidesLazy /></Suspense>} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="order/:orderId" element={<AdminOrderDetails />} />

            {/* Helpdesk Section */}
            <Route path="helpdesk" element={<AdminHelpdesk />} />
            <Route path="helpdesk/tickets" element={<AdminSupport />} />
            <Route path="helpdesk/tickets/:id" element={<AdminTicketDetail />} />
            {/* Live Chat moved to standalone route for full screen */}
            <Route path="helpdesk/knowledge-base" element={<AdminKnowledgeBase />} />
            <Route path="helpdesk/knowledge-base/categories" element={<AdminHelpCategories />} />
            <Route path="helpdesk/knowledge-base/articles" element={<AdminHelpArticles />} />
            <Route path="helpdesk/knowledge-base/articles/novo" element={<AdminHelpArticleEditor />} />
            <Route path="helpdesk/knowledge-base/articles/:id" element={<AdminHelpArticleEditor />} />

            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="settings" element={<AdminSettings />} />

            import AdminEmails from './pages/AdminEmails';
            import AdminEmailEditor from './pages/AdminEmailEditor';

            // ... (in AdminLayout route)
            <Route path="emails" element={<AdminEmails />} />
            <Route path="emails/new" element={<AdminEmailEditor />} />
            <Route path="emails/:id" element={<AdminEmailEditor />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="announcements/new" element={<AdminAnnouncementEditor />} />
            <Route path="announcements/:id/edit" element={<AdminAnnouncementEditor />} />
          </Route>

          {/* Standalone Admin Routes (Full Screen) */}
          <Route path="/admin/helpdesk/live-chat" element={<ProtectedAdminRoute><AdminLiveChat /></ProtectedAdminRoute>} />


          {/* Artist page */}
          <Route path="/artista/:slugOrId" element={<ArtistPage />} />
          {/* Help Center - Customer */}
          <Route path="/ajuda" element={<HelpCenter />} />
          <Route path="/ajuda/:categorySlug" element={<HelpCategory />} />
          <Route path="/ajuda/artigo/:slug" element={<HelpArticle />} />
          {/* Help Center - Organizer */}
          <Route path="/ajuda/organizador" element={<HelpOrganizer />} />
          <Route path="/ajuda/organizador/categoria/:slug" element={<HelpCategory />} />
          <Route path="/ajuda/organizador/artigo/:slug" element={<HelpArticle />} />
          {/* Support Tickets */}
          <Route path="/ajuda/tickets" element={<MyTickets />} />
          <Route path="/ajuda/tickets/novo" element={<CreateTicket />} />
          <Route path="/ajuda/tickets/:id" element={<TicketDetail />} />
          {/* Fallback for old /event/ URLs */}
          <Route path="/event/:slugOrId" element={<Event />} />
          {/* Event slugs at root - MUST be last to not conflict with other routes */}
          <Route path="/:slugOrId" element={<Event />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <OrganizationTransitionOverlay
        transitioning={transitioning}
        fromName={fromOrgName || selectedOrg?.name || ''}
        toName={selectedOrg?.name || ''}
      />
      {/* Hide ChatWidget on admin and organizer pages */}
      {!location.pathname.startsWith('/admin') &&
        !location.pathname.startsWith('/organizer') &&
        !location.pathname.startsWith('/create-event') &&
        !location.pathname.startsWith('/create-tickets') &&
        !location.pathname.startsWith('/publish-details') &&
        !location.pathname.startsWith('/painel-evento') &&
        !location.pathname.startsWith('/marketing') &&
        !location.pathname.startsWith('/pesquisa-satisfacao') &&
        !location.pathname.startsWith('/participantes') &&
        !location.pathname.startsWith('/gerenciar-equipe') &&
        <ChatWidget />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OrganizationProvider>
          <LocationProvider>
            <Bootstrap />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <AppErrorBoundary>
                <AppInner />
              </AppErrorBoundary>
            </BrowserRouter>
          </LocationProvider>
        </OrganizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const OrganizationRedirect: React.FC = () => {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId || '';
  return <Navigate to={`/org/${slugOrId}`} replace />;
};

function Bootstrap() {
  // Warm API resolution as early as possible and prefetch organizations when auth is ready.
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useOrganization();
  React.useEffect(() => {
    // warm API base resolution (non-blocking)
    try { initApiDetection(); } catch (e) { }
  }, []);

  React.useEffect(() => {
    // when user becomes available, prefetch organizations
    if (!authLoading && user) {
      try { refresh(); } catch (e) { console.warn('prefetch orgs failed', e); }
    }
  }, [user, authLoading, refresh]);

  return null;
}

export default App;
