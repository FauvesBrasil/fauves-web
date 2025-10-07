import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';

import Index from "./pages/Index";
import Event from "./pages/Event";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TestSupabase from "./pages/TestSupabase"; // <-- importe o componente de teste
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AccountSettings from "./pages/AccountSettings";
import CreateEditEvent from "./pages/CreateEditEvent";
import CreateTickets from "./pages/CreateTickets";
import PublishDetails from "./pages/PublishDetails";
import CreateOrganization from "./pages/CreateOrganization";
import EventPanel from "./pages/EventPanel";
import OrganizerEvents from "./pages/OrganizerEvents";
import PublicCollection from "./pages/PublicCollection";
import OrdersManager from "./pages/OrdersManager";
import MarketingTools from "./pages/MarketingTools";
import Checkout from "./pages/Checkout";
import CheckoutPix from "./pages/CheckoutPix";
import { useOrganization } from '@/context/OrganizationContext';
import OrganizationTransitionOverlay from '@/components/OrganizationTransitionOverlay';

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
          <Route path="/colecoes/:slug" element={<PublicCollection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/pix" element={<CheckoutPix />} />
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
      <AppErrorBoundary>
        <AppInner />
      </AppErrorBoundary>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
