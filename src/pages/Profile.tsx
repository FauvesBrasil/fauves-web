import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Edit, 
  ChevronRight, 
  Ticket, 
  ShoppingBag, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Printer, 
  Trash2, 
  Share2,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  QrCode,
  Loader2,
  ArrowRightLeft,
  X, // 👈 FIX: Added missing X icon
  Info,
  HelpCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // 👈 FIX: Added Footer
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogAction, 
  AlertDialogCancel 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getFirstName, getDisplayName } from '@/lib/user';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import ProfilePageSkeleton from '@/components/skeletons/ProfilePageSkeleton';

// --- Shared Components for Premium Feel ---

const SectionTitle = ({ children, icon: Icon, count }: { children: React.ReactNode; icon?: any; count?: number }) => (
  <div className="flex items-center justify-between mb-6 px-2">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-[#2A2AD7]" />}
      <h2 className="text-xl font-black text-[#091747] dark:text-white tracking-tight">{children}</h2>
      {count !== undefined && (
        <span className="bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">{count}</span>
      )}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: any) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50/50 dark:bg-[#0d0d0d] border-2 border-dashed border-gray-100 dark:border-[#1A1A1A] rounded-[32px] animate-in fade-in zoom-in-95 duration-500">
    <div className="w-16 h-16 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm flex items-center justify-center mb-4 ring-1 ring-gray-100 dark:ring-[#222]">
      <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
    <h3 className="text-lg font-bold text-[#091747] dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-[240px] mb-6">{description}</p>
    {actionLabel && (
      <button 
        onClick={onAction}
        className="text-sm font-bold text-[#2A2AD7] hover:underline"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// --- MAIN PAGE COMPONENT ---

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('tickets');
  const [showInactiveTickets, setShowInactiveTickets] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [following, setFollowing] = useState<any[]>([]);
  const [followingLoading, setFollowingLoading] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  const userName = getFirstName(user) || getDisplayName(user) || 'Perfil';
  const photoUrl = user?.photoUrl ? (user.photoUrl.startsWith('http') ? user.photoUrl : apiUrl(user.photoUrl)) : '';

  useEffect(() => {
    if (loading || !user) return;
    reloadTickets();
    reloadOrders();
    reloadFollowing();
  }, [loading, user]);

  const reloadTickets = async () => {
    setTicketsLoading(true);
    try {
      const q = user?.id ? `userId=${user.id}` : `userEmail=${user?.email}`;
      const res = await fetchApi(`/api/my/tickets?${q}&include=event`);
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Error loading tickets:', e);
    } finally { setTicketsLoading(false); }
  };

  const reloadOrders = async () => {
    setOrdersLoading(true);
    try {
      const q = user?.id ? `userId=${user.id}` : `userEmail=${user?.email}`;
      const res = await fetchApi(`/api/orders?${q}&include=event`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Error loading orders:', e);
    } finally { setOrdersLoading(false); }
  };

  const reloadFollowing = async () => {
    setFollowingLoading(true);
    try {
      // 👈 FIX: Try to get real organizations related to user
      const res = await fetchApi(`/api/organization?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setFollowing(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error loading following:', e);
    } finally { setFollowingLoading(false); }
  };

  const getFilteredTickets = () => {
    let filtered = showInactiveTickets ? tickets : tickets.filter(t => t.status === 'ISSUED');
    return filtered.sort((a,b) => new Date(a.eventStartDate || a.event?.startDate || 0).getTime() - new Date(b.eventStartDate || b.event?.startDate || 0).getTime());
  };

  // --- INTERNAL COMPONENTS ---

  const TicketCard = ({ t }: { t: any }) => {
    const date = t.eventStartDate || t.event?.startDate ? new Date(t.eventStartDate || t.event?.startDate) : null;
    const month = date ? date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '—';
    const day = date ? date.getDate() : '—';
    const isInactive = t.status !== 'ISSUED';

    return (
      <Card 
        role="button"
        onClick={() => setSelectedTicket(t)}
        className={`group relative flex items-center p-0 border-none bg-white dark:bg-[#0d0d0d] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[28px] overflow-hidden mb-4 ${isInactive ? 'opacity-70 saturate-50' : ''}`}
      >
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#151515] border-r border-dashed border-gray-100 dark:border-[#222] relative shrink-0">
          <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{month}</div>
          <div className="text-3xl font-black text-[#091747] dark:text-white leading-none mt-1">{day}</div>
          <div className="absolute top-0 right-0 w-4 h-4 bg-[#FDFDFD] dark:bg-[#0b0b0b] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#FDFDFD] dark:bg-[#0b0b0b] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="flex-1 px-5 py-4 flex items-center justify-between min-w-0">
          <div className="min-w-0">
             <h3 className="text-base font-bold text-[#091747] dark:text-white truncate mb-1 pr-4">{t.eventName || t.event?.name || 'Evento'}</h3>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{t.code?.slice(-6)}</span>
               <div className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${t.status === 'ISSUED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                 {t.status === 'ISSUED' ? 'Ativo' : t.status === 'CANCELED' ? 'Cancelado' : t.status}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#f3f3fe] dark:bg-[#151515] flex items-center justify-center group-hover:scale-110 transition-transform">
               <ChevronRight className="w-5 h-5 text-[#2A2AD7]" />
             </div>
          </div>
        </div>
      </Card>
    );
  };

  const OrderCard = ({ order }: { order: any }) => {
    const date = new Date(order.createdAt || order.date || 0);
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const total = order.totalAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount) : '—';
    
    return (
      <Card 
        role="button"
        onClick={() => setSelectedOrder(order)}
        className="flex items-center p-4 bg-white dark:bg-[#0d0d0d] border-none shadow-sm hover:shadow-lg transition-all rounded-[24px] mb-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#151515] flex items-center justify-center shrink-0">
          <ShoppingBag className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-bold text-[#091747] dark:text-white truncate pr-2">{order.eventName || order.event?.name || 'Resumo do pedido'}</h4>
            <span className="text-xs font-bold text-[#2A2AD7] whitespace-nowrap">{total}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span>#{order.code?.slice(-8)}</span>
            <span>•</span>
            <span>{dateStr}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-200 ml-3" />
      </Card>
    );
  };

  // --- MODALS ---

  const TicketModal = ({ ticket, onClose }: { ticket: any; onClose: () => void }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
      const gen = () => {
        QRCode.toDataURL(JSON.stringify({ c: ticket.code, ts: Date.now() }), { margin: 1, width: 600 })
          .then(setQrDataUrl);
      };
      gen();
      const interval = setInterval(() => { gen(); setRefreshKey(k => k + 1); }, 30000);
      return () => clearInterval(interval);
    }, [ticket.code]);

    const handleTransfer = async () => {
      setTransferLoading(true);
      try {
        const res = await fetchApi('/api/ticket/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, targetEmail: transferEmail }),
        });
        if (res.ok) {
          toast({ title: 'Sucesso!', description: 'Ingresso transferido com sucesso.' });
          setTransferOpen(false);
          onClose();
          reloadTickets();
        } else {
          toast({ title: 'Erro', description: 'Não foi possível transferir.', variant: 'destructive' });
        }
      } finally { setTransferLoading(false); }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#091747]/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
        <div className="relative w-full max-w-[420px] bg-white dark:bg-[#0b0b0b] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
           {/* Header with Event Image */}
           <div className="relative h-48">
             <img 
               src={ticket.event?.bannerUrl || ticket.event?.image ? ( (ticket.event.bannerUrl || ticket.event.image).startsWith('http') ? (ticket.event.bannerUrl || ticket.event.image) : apiUrl(ticket.event.bannerUrl || ticket.event.image)) : ''} 
               className="w-full h-full object-cover" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0b0b0b] to-transparent" />
             <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="px-8 pb-10 -mt-10 text-center relative z-10">
              <h2 className="text-2xl font-black text-[#091747] dark:text-white mb-2 leading-tight">{ticket.eventName || ticket.event?.name}</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">#{ticket.code}</p>
              
              <div className="relative inline-block mb-8 p-6 bg-white rounded-3xl shadow-2xl">
                {qrDataUrl ? (
                  <img src={qrDataUrl} className="w-56 h-56 animate-in fade-in zoom-in-90 duration-700" key={refreshKey} />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center"><Loader2 className="animate-spin text-gray-200" /></div>
                )}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2A2AD7] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg whitespace-nowrap">
                   Atualiza em tempo real
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTransferOpen(true)}
                  className="flex items-center justify-center gap-2 h-14 bg-gray-50 dark:bg-[#1A1A1A] rounded-full text-sm font-bold text-[#091747] dark:text-white hover:bg-gray-100 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Transferir
                </button>
                <button 
                  onClick={() => {
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${qrDataUrl}" style="width: 80%" /></body></html>`);
                      w.print();
                    }
                  }}
                  className="flex items-center justify-center gap-2 h-14 bg-gray-50 dark:bg-[#1A1A1A] rounded-full text-sm font-bold text-[#091747] dark:text-white hover:bg-gray-100 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
           </div>
        </div>

        <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
          <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-[#091747] dark:text-white">Transferir ingresso</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500">
                O destinatário receberá um e-mail com as instruções para acessar o ingresso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-6">
              <input 
                type="email" 
                placeholder="E-mail do amigo" 
                value={transferEmail}
                onChange={e => setTransferEmail(e.target.value)}
                className="w-full h-14 px-6 rounded-full bg-gray-50 dark:bg-[#1A1A1A] border-none focus:ring-2 focus:ring-[#2A2AD7] outline-none"
              />
            </div>
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="w-full h-14 rounded-full font-bold m-0 border-none bg-gray-100">Cancelar</AlertDialogCancel>
              <button 
                onClick={handleTransfer}
                disabled={transferLoading || !transferEmail.includes('@')}
                className="w-full h-14 bg-[#2A2AD7] text-white rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {transferLoading && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const OrderModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#091747]/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
        <div className="relative w-full max-w-[480px] bg-white dark:bg-[#0b0b0b] rounded-[40px] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95">
           <div className="flex justify-between items-center mb-8">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#1A1A1A] flex items-center justify-center text-[#2A2AD7]">
                <ShoppingBag className="w-6 h-6" />
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
           </div>
           
           <h2 className="text-2xl font-black text-[#091747] dark:text-white mb-2">Detalhes do Pedido</h2>
           <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-8">Pedido #{order.code}</p>

           <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-3xl p-6">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Evento</h4>
                 <p className="text-lg font-bold text-[#091747] dark:text-white leading-tight">{order.eventName || order.event?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-3xl p-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</h4>
                   <p className="text-sm font-bold text-[#091747] dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-3xl p-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</h4>
                   <p className="text-sm font-extrabold text-[#2A2AD7]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}</p>
                </div>
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#222]">
              <p className="text-center text-xs text-gray-400">Em caso de dúvidas sobre este pedido, entre em contato com o organizador através do suporte.</p>
           </div>
        </div>
      </div>
    );
  };

  if (loading) return <ProfilePageSkeleton />;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0b0b0b] text-[#091747] dark:text-gray-100">
      <Header />
      
      <div className="pt-[100px] sm:pt-[120px] pb-20">
        <div className="max-w-[1100px] mx-auto px-6">
          
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative group">
              <div className="w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-[40px] overflow-hidden border-4 border-white dark:border-[#151515] shadow-2xl relative">
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={photoUrl} className="object-cover" />
                  <AvatarFallback className="bg-[#f3f4fe] dark:bg-[#151515] text-[#091747] dark:text-indigo-400 text-3xl font-black">{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <button 
                onClick={() => navigate('/account-settings')}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl flex items-center justify-center text-[#2A2AD7] hover:scale-110 active:scale-95 transition-all"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center md:text-left flex-1">
               <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                 <h1 className="text-3xl sm:text-4xl font-black text-[#091747] dark:text-white tracking-tighter">{userName}</h1>
                 <Badge className="w-fit mx-auto md:mx-0 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-[#2A2AD7] border-none text-[10px] font-black uppercase tracking-widest rounded-full">Explore</Badge>
               </div>
               <p className="text-gray-400 font-bold text-sm tracking-tight flex items-center justify-center md:justify-start gap-4">
                  <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> {tickets.length} Ingressos</span>
                  <span className="hidden sm:inline w-1 h-1 bg-gray-200 rounded-full" />
                  <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> {orders.length} Pedidos</span>
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
               <div className="flex gap-2 p-1.5 bg-gray-100/50 dark:bg-[#0d0d0d] rounded-[24px] mb-8 w-fit mx-auto sm:mx-0">
                  {['tickets', 'orders', 'following'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${activeTab === tab 
                          ? 'bg-white dark:bg-[#1a1a1a] text-[#2A2AD7] shadow-sm' 
                          : 'text-gray-400 hover:text-[#091747] dark:hover:text-white'
                        }
                      `}
                    >
                      {tab === 'tickets' ? 'Ingressos' : tab === 'orders' ? 'Pedidos' : 'Seguindo'}
                    </button>
                  ))}
               </div>

               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                  {activeTab === 'tickets' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <SectionTitle icon={Ticket} count={getFilteredTickets().length}>Meus Ingressos</SectionTitle>
                        {tickets.length > 0 && (
                          <button 
                            onClick={() => setShowInactiveTickets(!showInactiveTickets)}
                            className="text-[10px] font-black text-gray-400 hover:text-[#2A2AD7] uppercase tracking-widest mb-6"
                          >
                            {showInactiveTickets ? 'Ocultar passados' : 'Mostrar inativos'}
                          </button>
                        )}
                      </div>
                      
                      {ticketsLoading ? <ProfilePageSkeleton /> : (
                        getFilteredTickets().length > 0 ? (
                          getFilteredTickets().map(t => <TicketCard key={t.id} t={t} />)
                        ) : (
                          <EmptyState 
                            icon={Ticket} 
                            title="Nenhum ingresso ativo" 
                            description="Você ainda não possui ingressos para os próximos eventos."
                            actionLabel="Explorar eventos"
                            onAction={() => navigate('/')}
                          />
                        )
                      )}
                    </div>
                  )}

                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <SectionTitle icon={ShoppingBag} count={orders.length}>Histórico de Pedidos</SectionTitle>
                      {ordersLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#2A2AD7]" /></div> : (
                        orders.length > 0 ? (
                          orders.map(o => <OrderCard key={o.id || o.code} order={o} />)
                        ) : (
                          <EmptyState 
                            icon={ShoppingBag} 
                            title="Lista de pedidos vazia" 
                            description="Seus pedidos realizados aparecerão listados aqui."
                            actionLabel="Explorar eventos"
                            onAction={() => navigate('/')}
                          />
                        )
                      )}
                    </div>
                  )}

                  {activeTab === 'following' && (
                    <div className="space-y-4">
                      <SectionTitle icon={Users} count={following.length}>Organizações Seguidas</SectionTitle>
                      {followingLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#2A2AD7]" /></div> : (
                        following.length > 0 ? (
                          following.map(org => (
                            <div key={org.id} className="p-6 bg-white dark:bg-[#0d0d0d] rounded-[32px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#151515] overflow-hidden flex items-center justify-center font-black">
                                   {org.logoUrl ? <img src={org.logoUrl.startsWith('http') ? org.logoUrl : apiUrl(org.logoUrl)} className="w-full h-full object-cover" /> : org.name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="font-bold text-[#091747] dark:text-white truncate">{org.name}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ">Organização verificada</p>
                                 </div>
                              </div>
                              <button className="px-5 py-2.5 rounded-full border border-gray-100 dark:border-[#222] text-xs font-black hover:bg-gray-50 transition-colors shrink-0 ml-4">Seguindo</button>
                            </div>
                          ))
                        ) : (
                           <EmptyState 
                            icon={Users} 
                            title="Nenhuma organização" 
                            description="As organizações que você seguir aparecerão aqui para acesso rápido."
                            actionLabel="Explorar Fauves"
                            onAction={() => navigate('/')}
                          />
                        )
                      )}
                    </div>
                  )}
               </div>
            </div>

            {/* Side Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-4 translate-y-12">
               <div className="bg-[#2A2AD7] rounded-[40px] p-10 text-white relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                  <QrCode className="w-12 h-12 mb-6" />
                  <h3 className="text-2xl font-black leading-tight mb-4 tracking-tighter">Acesso rápido no dia do evento</h3>
                  <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">Seus ingressos possuem QR Codes dinâmicos que se atualizam por segurança. Certifique-se de estar logado!</p>
                  <div className="h-1 bg-white/20 rounded-full w-20 mb-8" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Fauves Safe Ticket v2.1</p>
               </div>
               
               <div className="mt-8 p-10 bg-gray-100/50 dark:bg-[#0d0d0d] rounded-[40px]">
                  <h4 className="text-[#091747] dark:text-white font-black mb-4">Central de Ajuda</h4>
                  <p className="text-gray-400 text-xs font-medium mb-6">Precisa de assistência com seus ingressos ou pedidos? Nossa equipe está pronta para ajudar.</p>
                  <button className="text-xs font-black text-[#2A2AD7] uppercase tracking-widest flex items-center gap-2">Suporte Fauves <ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Modals Layer */}
      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default Profile;
