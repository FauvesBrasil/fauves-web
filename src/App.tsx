import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import React, { Suspense, Component, useLayoutEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import IndexV2 from "./pages/IndexV2";
import FauvesHome from "./pages/FauvesHome";
import SignInPage from "./pages/SignInPage";
import FullMapPage from "./pages/FullMapPage";
import About from "./pages/About";
import Careers from "./pages/Careers";
import EventsByCategory from "./pages/EventsByCategory";
import HalfPriceLaw from './pages/HalfPriceLaw';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SecurityPolicy from './pages/SecurityPolicy';
import CopyrightPolicy from './pages/CopyrightPolicy';
import ScrollToTop from './components/ScrollToTop';
import OrganizerReportsPage from "./pages/ReportsPage";
import OrganizerReportsOrders from "./pages/OrganizerReportsOrders";
import OrganizerReportsSales from "./pages/OrganizerReportsSales";
import OrganizerFinances from "./pages/OrganizerFinances";
import OrganizerFinanceEvent from "./pages/OrganizerFinanceEvent";
import EventPageV2 from "./pages/EventPageV2";

import Profile from "./pages/Profile";
import PublicUserProfile from "./pages/PublicUserProfile";
import DiscoverV2 from "./pages/DiscoverV2";
import OrganizationsV2 from "./pages/OrganizationsV2";
import CreateOrganizationV2 from "./pages/CreateOrganizationV2";
import NotFound from "./pages/NotFound";
import TestSupabase from "./pages/TestSupabase"; // <-- importe o componente de teste
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ProducerJourneyDemo from './pages/ProducerJourneyDemo';
import ProducerJourneyPage from './pages/ProducerJourneyPage';
import SearchResults from './pages/SearchResults';
import AccountSettingsV2 from "./pages/AccountSettingsV2";
import CreateEventV2 from "./pages/CreateEventV2";
import CreateTickets from "./pages/CreateTickets";
import PublishDetails from "./pages/PublishDetails";
import EventPanelV2 from "./pages/EventPanelV2";
import OrganizerEvents from "./pages/OrganizerEvents";
import DesignSystem from "./pages/DesignSystem";
import Events from "./pages/Events";
import PublicCollection from "./pages/PublicCollection";
import OrganizationPublicProfile from "./pages/OrganizationPublicProfile";
import PublicSlugDispatcher from "./pages/PublicSlugDispatcher";
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
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, initApiDetection } from '@/lib/apiBase';
import { LocationProvider } from '@/context/LocationContext';
import OrganizationTransitionOverlay from '@/components/OrganizationTransitionOverlay';
import OrganizerSettingsV2 from './pages/OrganizerSettingsV2';
import Notifications from './pages/Notifications';
import PricingPage from './pages/PricingPage';
import CalendarEmbed from './pages/CalendarEmbed';
import ConnectionStatusToast from '@/components/ConnectionStatusToast';
import ChatwootController from '@/components/ChatwootController';
import { resetDocumentScrollLocks } from '@/lib/documentScrollLock';

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
const AdminLeads = React.lazy(() => import('./pages/AdminLeads'));

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
import EventAnalytics from './pages/EventAnalytics';
import IssuedTickets from './pages/IssuedTickets';
import ResetPassword from './pages/ResetPassword';
import HowItWorks from './pages/HowItWorks';
import LoginModal from './components/LoginModal';
import LoginWelcomeOverlay from './components/v2/LoginWelcomeOverlay';

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

class AppErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { /* no-op in prod */ }
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


// Redireciona /user/:userId → /u/:userId (compatibilidade com links antigos)
const UserProfileRedirect = () => {
  const { userId } = useParams<{ userId: string }>();
  return <Navigate to={`/u/${userId}`} replace />;
};

// Mantém os links antigos funcionando, mas usa a cidade na raiz como URL canônica.
const LegacyCityRedirect = () => {
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  return <Navigate to={`/${citySlug}`} replace />;
};

const getRoutesKey = (pathname: string) => {
  if (pathname.startsWith('/event/manage/')) {
    const parts = pathname.split('/');
    if (parts.length >= 4) {
      if (parts[4] === 'analytics') {
        return pathname;
      }
      return `/event/manage/${parts[3]}`;
    }
  }
  return pathname;
};

const AppInner = () => {
  const { selectedOrg, transitioning, fromOrgName } = useOrganization();
  const location = useLocation();
  const mountedRouteRef = useRef(false);

  useLayoutEffect(() => {
    if (!mountedRouteRef.current) {
      resetDocumentScrollLocks();
      mountedRouteRef.current = true;
    }
    return resetDocumentScrollLocks;
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={getRoutesKey(location.pathname)}>
          <Route path="/" element={<FauvesHome />} />
          <Route path="/v2" element={<IndexV2 />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/map" element={<FullMapPage />} />
          <Route path="/v2/map" element={<Navigate to="/map" replace />} />
          <Route path="/:calendarSlug/map" element={<FullMapPage />} />
          <Route path="/o-que-fazer-em/:citySlug" element={<LegacyCityRedirect />} />
          <Route path="/quem-somos" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/carreiras" element={<Careers />} />
          <Route path="/eventos/:categorySlug" element={<EventsByCategory />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/lei-da-meia-entrada" element={<HalfPriceLaw />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/seguranca" element={<SecurityPolicy />} />
          <Route path="/dmca" element={<CopyrightPolicy />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/u/:userId" element={<PublicUserProfile />} />
          <Route path="/user/:userId" element={<UserProfileRedirect />} />
          <Route path="/events" element={<Events />} />
          <Route path="/meus-ingressos" element={<Navigate to="/events" replace />} />
          <Route path="/embed/calendar/:calendarId/events" element={<CalendarEmbed />} />
          <Route path="/organizer-dashboard" element={<Navigate to="/organizer-events" replace />} />
          <Route path="/jornada-produtor" element={<ProtectedOrganizerRoute><ProducerJourneyPage /></ProtectedOrganizerRoute>} />
          <Route path="/producer-journey-demo" element={<ProducerJourneyDemo />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/create" element={<ProtectedOrganizerRoute><CreateEventV2 /></ProtectedOrganizerRoute>} />
          <Route path="/events/create" element={<ProtectedOrganizerRoute><CreateEventV2 /></ProtectedOrganizerRoute>} />
          <Route path="/account-settings" element={<AccountSettingsV2 />} />
          <Route path="/account-settings/:tab" element={<AccountSettingsV2 />} />
          <Route path="/v2/account-settings" element={<AccountSettingsV2 />} />
          <Route path="/v2/account-settings/:tab" element={<AccountSettingsV2 />} />
          <Route path="/calendar/manage/:calendarId" element={<ProtectedOrganizerRoute><OrganizerSettingsV2 /></ProtectedOrganizerRoute>} />
          <Route path="/create-tickets" element={<ProtectedOrganizerRoute requireEventId><CreateTickets /></ProtectedOrganizerRoute>} />
          <Route path="/publish-details" element={<ProtectedOrganizerRoute requireEventId><PublishDetails /></ProtectedOrganizerRoute>} />
          <Route path="/ingressos-emitidos/:eventId" element={<ProtectedOrganizerRoute requireEventId><IssuedTickets /></ProtectedOrganizerRoute>} />
          <Route path="/event/manage/:id" element={<ProtectedOrganizerRoute><EventPanelV2 /></ProtectedOrganizerRoute>} />
          <Route path="/event/manage/:id/:tab" element={<ProtectedOrganizerRoute><EventPanelV2 /></ProtectedOrganizerRoute>} />
          <Route path="/event/manage/:id/analytics" element={<ProtectedOrganizerRoute><EventAnalytics /></ProtectedOrganizerRoute>} />
          <Route path="/test-supabase" element={<TestSupabase />} />
          <Route path="/design-system" element={<DesignSystem />} />
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
          <Route path="/org/:slugOrId" element={<OrganizationRedirect />} />
          <Route path="/organization/:slugOrId" element={<OrganizationRedirect />} />
          <Route path="/venues/:slug/door" element={<ExpressDoor />} />
          <Route path="/select-tickets/:eventId" element={<SelectTickets />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/review" element={<Review />} />
          <Route path="/checkout/pix" element={<CheckoutPix />} />
          <Route path="/checkout/canceled" element={<CheckoutCanceled />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/discover" element={<DiscoverV2 />} />
          <Route path="/organizations" element={<OrganizationsV2 />} />
          <Route path="/organizations/create-calendar" element={<CreateOrganizationV2 />} />
          <Route path="/organizations/create-organization" element={<Navigate to="/organizations/create-calendar" replace />} />
          <Route path="/v2/discover" element={<DiscoverV2 />} />
          <Route path="/v2/event/:slugOrId" element={<EventPageV2 />} />
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
            <Route path="leads" element={<AdminLeads />} />

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
          <Route path="/event/:slugOrId" element={<EventPageV2 />} />
          {/* Root path wildcard (Event/Organization) - MUST be last to not conflict with other routes */}
          <Route path="/:slugOrId" element={<PublicSlugDispatcher />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <OrganizationTransitionOverlay
        transitioning={transitioning}
        fromName={fromOrgName || selectedOrg?.name || ''}
        toName={selectedOrg?.name || ''}
      />
      <LoginWelcomeOverlay />
      <ChatwootController />

      <AuthModalWrapper />
    </>
  );
};

const AuthModalWrapper = () => {
  const { isLoginModalOpen, closeLoginModal, loginModalRedirect } = useAuth();
  return (
    <LoginModal 
      open={isLoginModalOpen} 
      onClose={closeLoginModal} 
      redirectPath={loginModalRedirect || '/events'} 
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectionStatusToast />
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
  return <Navigate to={`/${slugOrId}`} replace />;
};

function Bootstrap() {
  // Warm API resolution as early as possible and prefetch organizations when auth is ready.
  const { user, token, loading: authLoading } = useAuth();
  const { setMode } = useTheme();
  const { refresh } = useOrganization();
  const syncedThemeUserRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // warm API base resolution (non-blocking)
    try { initApiDetection(); } catch (e) { }
  }, []);

  React.useEffect(() => {
    // when user becomes available, prefetch organizations
    if (!authLoading && user) {
      try { refresh(); } catch (e) { }
    }
  }, [user, authLoading, refresh]);

  React.useEffect(() => {
    if (authLoading || !user || !token || syncedThemeUserRef.current === user.id) return;
    syncedThemeUserRef.current = user.id;
    let active = true;
    fetchApi('/account-settings/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async response => response.ok ? response.json() : null)
      .then(preferences => {
        if (!active) return;
        const displayMode = preferences?.displayMode;
        if (displayMode === 'light' || displayMode === 'dark' || displayMode === 'system') {
          setMode(displayMode);
        }
      })
      .catch(() => {
        // Keep the locally persisted choice when the preference API is unavailable.
      });
    return () => { active = false; };
  }, [authLoading, setMode, token, user]);

  return null;
}

export default App;
