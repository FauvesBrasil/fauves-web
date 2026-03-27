import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Edit, ChevronRight, Ticket, ShoppingBag, Users } from 'lucide-react';
import Header from '@/components/Header';
import orderEmptyIco from '@/assets/orderempty-ico.svg';
import ticketEmptyIco from '@/assets/emptyticket-ico.svg';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { getFirstName, getDisplayName } from '@/lib/user';
import { fetchApi } from '@/lib/apiBase';
import ProfilePageSkeleton from '@/components/skeletons/ProfilePageSkeleton';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    nome?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const userName = getFirstName(user) || getDisplayName(user) || 'Null';
  const [activeTab, setActiveTab] = useState('tickets');
  const [showInactiveTickets, setShowInactiveTickets] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Filtrar e ordenar ingressos
  const getFilteredTickets = () => {
    const now = new Date();

    // Filtrar por status
    let filtered = tickets;
    if (!showInactiveTickets) {
      filtered = tickets.filter(t => t.status === 'ISSUED');
    }

    // Ordenar por data do evento (próximos primeiro)
    return filtered.sort((a, b) => {
      const dateA = a.eventStartDate ? new Date(a.eventStartDate).getTime() : 0;
      const dateB = b.eventStartDate ? new Date(b.eventStartDate).getTime() : 0;

      // Eventos futuros primeiro, depois passados
      const isAFuture = dateA >= now.getTime();
      const isBFuture = dateB >= now.getTime();

      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;

      // Se ambos futuros ou ambos passados, mais próximo primeiro
      if (isAFuture) {
        return dateA - dateB; // Mais próximo primeiro
      } else {
        return dateB - dateA; // Mais recente primeiro
      }
    });
  };

  // Ordenar pedidos (mais recentes primeiro)
  const getSortedOrders = () => {
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date ? new Date(a.date).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date ? new Date(b.date).getTime() : 0);
      return dateB - dateA; // Mais recente primeiro
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    (async () => { await reloadTickets(); })();
    (async () => { await reloadOrders(); })();
    return () => { cancelled = true; };
  }, [loading, user]);

  // Auto-open ticket from notification link
  useEffect(() => {
    if (ticketsLoading || tickets.length === 0) return;

    // Check for openTicket query parameter
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('openTicket');

    if (ticketId) {
      // Find the ticket
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
      }

      // Remove the parameter from URL
      params.delete('openTicket');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [tickets, ticketsLoading]);

  const reloadTickets = async () => {
    let cancelled = false;
    setTicketsLoading(true);
    try {
      if (!user) {
        setTickets([]);
        return;
      }
      const q = user.id ? `userId=${encodeURIComponent(user.id)}` : `userEmail=${encodeURIComponent(user.email || '')}`;
      const r = await fetchApi(`/api/my/tickets?${q}&include=event`);
      if (!r.ok) {
        setTickets([]);
      } else {
        const j = await r.json().catch(() => ({}));
        const items = Array.isArray(j.items) ? j.items : (j.items || []);
        if (!cancelled) setTickets(items);
      }
    } catch (e) {
      if (!cancelled) setTickets([]);
    } finally {
      if (!cancelled) setTicketsLoading(false);
    }
  };

  const reloadOrders = async () => {
    let cancelled = false;
    setOrdersLoading(true);
    try {
      if (!user) {
        setOrders([]);
        return;
      }
      const q = user.id ? `userId=${encodeURIComponent(user.id)}` : `userEmail=${encodeURIComponent(user.email || '')}`;
      const r = await fetchApi(`/api/orders?${q}&include=event`);
      if (!r.ok) {
        setOrders([]);
      } else {
        const j = await r.json().catch(() => ({}));
        const items = Array.isArray(j.items) ? j.items : (j.items || []);
        if (!cancelled) setOrders(items);
      }
    } catch (e) {
      if (!cancelled) setOrders([]);
    } finally {
      if (!cancelled) setOrdersLoading(false);
    }
  };
  // Ticket detail modal component (defined here so it captures state)
  const TicketModal: React.FC<{ ticket: any; onClose: () => void }> = ({ ticket, onClose }) => {
    if (!ticket) return null;
    const isCourtesy = ticket.isCourtesy === true || (ticket.pricePaid === 0 || ticket.pricePaid === null && !!ticket.guestEmail);
    const { toast } = useToast();
    const [transferOpen, setTransferOpen] = React.useState(false);
    const [transferTargetEmail, setTransferTargetEmail] = React.useState('');
    const [transferLoading, setTransferLoading] = React.useState(false);
    const [transferError, setTransferError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const openTransferDialog = () => {
      if (isCourtesy) return;
      setTransferTargetEmail((ticket.guestEmail as string) || '');
      setTransferError(null);
      setTransferOpen(true);
    };

    React.useEffect(() => {
      if (transferOpen) {
        // focus input next tick
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, [transferOpen]);

    const isValidEmail = (value: string) => {
      const v = String(value || '').trim();
      // simple email regex
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    };

    const doTransfer = async () => {
      setTransferError(null);
      const target = transferTargetEmail?.trim();
      if (!isValidEmail(target)) {
        setTransferError('Informe um e-mail válido');
        return;
      }
      setTransferLoading(true);
      try {
        const res = await fetchApi('/api/ticket/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, targetEmail: target }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setTransferError(j.message || res.statusText || 'Falha ao transferir');
          toast({ title: 'Falha ao transferir', description: j.message || res.statusText, variant: 'destructive' as any });
        } else {
          toast({ title: 'Transferência efetuada', description: 'Ingresso transferido com sucesso' });
          setTransferOpen(false);
          onClose();
          setTimeout(() => { reloadTickets().catch(() => { }); }, 50);
        }
      } catch (e: any) {
        setTransferError(e?.message || 'Erro ao transferir ingresso');
        toast({ title: 'Erro', description: e?.message || 'Erro ao transferir ingresso', variant: 'destructive' as any });
      } finally {
        setTransferLoading(false);
      }
    };

    // Dynamic QR Code with timestamp for security
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    const [qrRefreshKey, setQrRefreshKey] = React.useState(0);

    // Generate QR code with timestamp
    React.useEffect(() => {
      if (!ticket?.code) return;

      const generateQR = () => {
        const timestamp = Date.now();
        // Include timestamp in QR for validation (backend can verify freshness)
        const qrData = JSON.stringify({
          code: ticket.code,
          ts: timestamp,
          id: ticket.id
        });

        QRCode.toDataURL(qrData, {
          margin: 1,
          width: 512,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then((d) => setQrDataUrl(d)).catch(() => setQrDataUrl(null));
      };

      generateQR();

      // Refresh QR every 30 seconds for security
      const interval = setInterval(() => {
        generateQR();
        setQrRefreshKey(prev => prev + 1);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }, [ticket?.code, ticket?.id]);

    const onPrint = () => {
      const w = window.open('', '_blank', 'width=600,height=800');
      if (!w) return;
      const html = `
        <html><head><title>Ingresso ${ticket.code}</title><style>body{font-family:Arial,sans-serif;padding:20px;} .ticket{max-width:420px;border:1px solid #ddd;padding:16px;border-radius:12px;} .qr{width:200px;height:200px;margin:auto;display:block;}</style></head>
        <body>
          <div class="ticket">
            <h2>${(ticket.eventName || 'Evento')}</h2>
            <p>Ingresso: ${ticket.ticketTypeName || '—'}</p>
            <p>Código: ${ticket.code}</p>
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr"/>` : ''}
          </div>
        </body></html>`;
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); }, 300);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Mobile: Full screen bottom sheet | Desktop: Centered modal */}
        <div className="relative w-full md:w-[440px] md:max-w-full bg-white dark:bg-[#0f0f0f] md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden z-60 max-h-[92vh] md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300">

          {/* Blurred Background Header */}
          <div className="relative h-64 md:h-56 overflow-hidden">
            {/* Background Image with Blur */}
            <div className="absolute inset-0">
              {ticket.event?.bannerUrl ? (
                <img
                  src={ticket.event.bannerUrl.startsWith('/uploads/') ? `/api${ticket.event.bannerUrl}` : ticket.event.bannerUrl}
                  alt=""
                  className="w-full h-full object-cover scale-110 blur-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
              )}
              {/* Gradient Overlay - Fades to white/dark */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white dark:to-[#0f0f0f]" />
            </div>

            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/20 ${ticket.status === 'ISSUED'
                ? 'bg-green-500/90 text-white'
                : ticket.status === 'CANCELED'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-yellow-500/90 text-white'
                }`}>
                {ticket.status === 'ISSUED' && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {ticket.status === 'ISSUED' ? 'ATIVO' : ticket.status}
              </div>
            </div>

            {/* Content Overlay - Event Name */}
            <div className="absolute inset-x-0 bottom-0 p-5 text-center">
              <h3 className="text-2xl md:text-xl font-bold text-white drop-shadow-lg mb-1 leading-tight">
                {ticket.eventName || 'Evento'}
              </h3>
              <p className="text-sm text-white/90 font-mono font-medium drop-shadow">
                #{ticket.code}
              </p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-white dark:bg-[#0f0f0f]">

            {/* QR Code - Hero Element */}
            <div className="flex flex-col items-center space-y-3 -mt-2">
              <div className="relative">
                {/* Decorative Corners */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-3 border-l-3 border-indigo-500 rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-3 border-r-3 border-indigo-500 rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-3 border-l-3 border-indigo-500 rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-3 border-r-3 border-indigo-500 rounded-br-lg" />

                {/* QR Code Container */}
                <div className="relative bg-white p-6 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
                  {qrDataUrl ? (
                    <>
                      {/* QR Code with subtle animation on refresh */}
                      <img
                        key={qrRefreshKey}
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-64 h-64 md:w-56 md:h-56 animate-in fade-in duration-300"
                      />

                      {/* Subtle diagonal watermark only */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none" style={{ transform: 'rotate(-45deg)' }}>
                        <div className="text-gray-600 font-bold text-xs whitespace-nowrap">
                          VÁLIDO APENAS NO APP
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-64 h-64 md:w-56 md:h-56 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  )}
                </div>
              </div>
              <div className="text-center space-y-1 max-w-full">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Apresente este QR Code no check-in do evento
                </p>
                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold flex items-center justify-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">Código dinâmico • Atualiza a cada 30s</span>
                </p>
              </div>
            </div>

            {/* Ticket Details Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 rounded-2xl p-4 space-y-3 border border-gray-200/50 dark:border-gray-700/30 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700/50">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Participante</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-right max-w-[60%] truncate">
                  {ticket.userName || ticket.guestEmail || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tipo de Ingresso</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-right max-w-[60%] truncate">
                  {ticket.ticketTypeName || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at Bottom */}
          <div className="sticky bottom-0 p-5 bg-white dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-gray-800/50 space-y-3">
            <div className="flex gap-3">
              {/* Print Button - Hidden on Mobile */}
              <button
                onClick={onPrint}
                className="hidden md:flex flex-1 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/30 items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>

              {/* Transfer Button - Only shown for NON-courtesy tickets */}
              {!isCourtesy && (
                <>
                  <button
                    onClick={openTransferDialog}
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-95 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transferir
                  </button>
                  <AlertDialog open={transferOpen} onOpenChange={(v) => { if (!v) setTransferOpen(false); }}>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Transferir ingresso</AlertDialogTitle>
                        <AlertDialogDescription>Confirme o e-mail do destinatário para transferir este ingresso.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="mt-4">
                        <input
                          ref={inputRef}
                          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          value={transferTargetEmail}
                          onChange={(e) => setTransferTargetEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          aria-label="email destinatário"
                        />
                        {transferError && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{transferError}</div>}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={transferLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => doTransfer()} disabled={transferLoading || !isValidEmail(transferTargetEmail)}>
                          {transferLoading ? (
                            <span className="inline-flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Enviando...</span>
                          ) : 'Confirmar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OrderModal: React.FC<{ order: any; onClose: () => void }> = ({ order, onClose }) => {
    if (!order) return null;
    const status = order.status || 'APROVADO';
    const statusBadge = status === 'APROVADO' ? 'Aprovado' : status;
    const tickets = Array.isArray(order.items) && order.items.length ? order.items : [{ id: order.id || '1', ticketTypeName: 'Camarote', code: order.ticketCode || '#KOTSSGXV8U' }];

    const purchaseDate = order.date || order.createdAt || '18/05/2025';
    const buyer = order.buyerName || userName || (user?.email || '—');
    const payment = order.paymentMethod || 'Pix';
    const total = order.total || order.amount || 'R$184,00';

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-[420px] max-w-full bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-xl overflow-hidden z-60">
          <div className="flex items-center justify-between p-4 border-b dark:border-[#1F1F1F]">
            <div className="text-lg font-semibold text-indigo-950 dark:text-white">Pedido #{order.code || order.id || '—'}</div>
            <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <div className="p-4">
            <div className="h-36 bg-gradient-to-r from-indigo-300 to-teal-200 rounded-md mb-4 flex items-center justify-center text-white">{order.bannerText || 'Imagem do evento'}</div>
            <div className="text-center mb-2">
              <div className="inline-block px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 font-semibold">{statusBadge}</div>
            </div>
            <h3 className="text-center text-lg font-semibold">{order.eventName || 'Evento'}</h3>
            <div className="text-center text-sm text-slate-500 mb-4">Pedido #{order.code || order.id || '—'}</div>

            <div className="bg-[#F8F9FC] rounded-md p-3 text-sm mb-4">
              <div className="flex justify-between py-2"><div className="text-slate-500">Ingressos</div><div className="font-medium">{tickets.length}</div></div>
              <div className="space-y-2 mt-2">
                {tickets.map((tk: any, idx: number) => (
                  <div key={tk.id || idx} className="bg-white rounded-md p-3 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">{tk.ticketTypeName || 'Ingresso'}</div>
                        <div className="font-medium">{tk.code || '—'}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-md p-3 text-sm border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-500 text-xs">Comprador</div>
                  <div className="font-medium">{buyer}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Data</div>
                  <div className="font-medium">{purchaseDate}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Forma de pagamento</div>
                  <div className="font-medium">{payment}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Valor da compra</div>
                  <div className="font-medium">{total}</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-[#EF4118] mt-4">Para realizar o cancelamento do seu pedido, entre em contato com a gente.</p>
          </div>
        </div>
      </div>
    );
  };
  if (loading) return <ProfilePageSkeleton />;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] text-indigo-950 dark:text-white">
      <Header />

      {/* Desktop Layout - hidden on mobile */}
      <div className="hidden md:block">
        <div className="max-w-[1352px] mx-auto px-5 py-10">
          <div className="flex gap-[100px] items-start mx-auto w-fit">
            {/* Profile Section Sticky */}
            <div className="sticky top-24 self-start flex flex-row items-center gap-5">
              <div className="relative">
                <div className="w-[100px] h-[100px] rounded-full bg-[#F7F7F7] dark:bg-[#1b1b1b] border border-[rgba(9,23,71,0.05)] dark:border-[#1F1F1F] shadow-[0_4px_8px_rgba(9,23,71,0.10)] flex items-center justify-center max-sm:w-20 max-sm:h-20">
                  {/* Avatar: ajuste conforme seu backend salva foto */}
                  <Avatar className="w-[100px] h-[100px] max-sm:w-20 max-sm:h-20">
                    <AvatarImage src={''} alt="Profile" />
                    <AvatarFallback className="bg-[#F7F7F7] dark:bg-[#1b1b1b] text-[#091747] dark:text-white text-2xl font-semibold max-sm:text-xl">
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-2 max-md:justify-center max-sm:justify-start">
                  <h1 className="text-2xl font-semibold text-[#091747] dark:text-white max-sm:text-xl">
                    {userName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 text-[#091747] dark:text-white hover:bg-transparent"
                    onClick={() => navigate('/account-settings')}
                  >
                    <Edit className="w-[19px] h-[19px]" />
                  </Button>
                </div>
                <p className="text-sm font-medium text-[#091747] dark:text-white max-md:text-center max-sm:text-left">
                  {orders.length} pedidos • 0 seguindo
                </p>
              </div>
            </div>
            {/* Dados Section */}
            <div className="max-w-[520px] max-md:max-w-full">
              {/* Ingressos Section */}
              <section className="mb-16">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-semibold text-[#091747] dark:text-white">
                    Ingressos
                  </h2>
                  {tickets.length > 0 && (
                    <button
                      onClick={() => setShowInactiveTickets(!showInactiveTickets)}
                      className="text-xs text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)] hover:text-[#091747] dark:hover:text-white font-medium"
                    >
                      {showInactiveTickets ? 'Ocultar inativos' : 'Mostrar inativos'}
                    </button>
                  )}
                </div>
                {/* Tickets list (comprados ou recebidos) */}
                {ticketsLoading ? (
                  <div className="space-y-3">
                    <ProfilePageSkeleton />
                  </div>
                ) : getFilteredTickets().length === 0 ? (
                  <div className="py-6">
                    <div className="mx-auto w-full max-w-[520px] border-2 border-dashed border-slate-200 dark:border-[#2A2A2A] rounded-lg p-8 flex flex-col items-center justify-center">
                      <img src={ticketEmptyIco} alt="Nenhum ingresso" className="max-w-[80px] w-full h-auto" />
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {showInactiveTickets ? 'Nenhum ingresso encontrado' : 'Nenhum ingresso ativo'}
                      </div>
                      {!showInactiveTickets && tickets.length > 0 && (
                        <button
                          onClick={() => setShowInactiveTickets(true)}
                          className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Mostrar ingressos inativos
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  getFilteredTickets().map((t) => {
                    const date = t.eventStartDate ? new Date(t.eventStartDate) : null;
                    const month = date ? date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '—';
                    const day = date ? String(date.getDate()).padStart(2, '0') : '—';
                    const status = t.status || 'ISSUED';
                    const statusBadge = status === 'ISSUED' ? 'ATIVO PARA USO' : status === 'CANCELED' ? 'CANCELADO' : 'RESERVADO';
                    const badgeClass = status === 'ISSUED' ? 'bg-[rgba(9,23,71,0.1)] text-[#091747]' : status === 'CANCELED' ? 'bg-[rgba(234,88,12,0.3)] text-orange-600' : 'bg-yellow-100 text-yellow-800';
                    return (
                      <Card key={t.id} className="mb-2.5 p-0 border-0 bg-white/40 dark:bg-[#242424]/80 rounded-xl h-20 max-sm:h-[70px]">
                        <button onClick={() => setSelectedTicket(t)} className="flex items-center h-full px-5 relative w-full text-left">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-center min-w-[27px]">
                              <div className="text-sm font-medium text-orange-600">{month}</div>
                              <div className="text-xl font-medium text-[#091747] dark:text-white">{day}</div>
                            </div>
                            <div className="w-[50px] h-[50px] bg-zinc-300 rounded-md max-sm:w-10 max-sm:h-10 flex-shrink-0 overflow-hidden">
                              {t.event?.bannerUrl && (
                                <img src={t.event.bannerUrl.startsWith('/uploads/') ? `/api${t.event.bannerUrl}` : t.event.bannerUrl} alt={t.eventName || 'Evento'} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-[#091747] dark:text-white mb-1">{t.eventName || 'Evento'}</h3>
                              <p className="text-xs text-[#091747] dark:text-white">{t.code || ''}</p>
                            </div>
                            <Badge className={`text-xs font-semibold px-3 py-1 rounded-full border-0 ${badgeClass} dark:text-white`}>
                              {statusBadge}
                            </Badge>
                          </div>
                          <ChevronRight className="w-[6px] h-[10px] text-[#091747] dark:text-white ml-4" />
                        </button>
                      </Card>
                    );
                  })
                )}
                <p className="text-sm text-[#091747] dark:text-white mb-16 max-sm:text-sm">
                  Seus ingressos serão arquivados após o encerramento do evento
                </p>
              </section>
              {/* Pedidos Section */}
              <section className="mb-16">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-semibold text-[#091747] dark:text-white max-sm:text-lg max-sm:text-left">
                    Pedidos
                  </h2>
                  {/* Status Filter */}
                  <div className="relative">
                    <select className="appearance-none bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm font-semibold text-[rgba(9,23,71,0.3)] pr-8 h-[35px] w-[147px] max-sm:h-8 max-sm:w-[120px]">
                      <option>Status</option>
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-[5px] h-[8px] text-[#091747] dark:text-white pointer-events-none" />
                  </div>
                </div>
                {/* Orders list */}
                {ordersLoading ? (
                  <div className="py-6 text-sm text-slate-500 dark:text-slate-400">Carregando pedidos...</div>
                ) : orders.length === 0 ? (
                  <div className="py-6">
                    <div className="mx-auto w-full max-w-[520px] border-2 border-dashed border-slate-200 dark:border-[#2A2A2A] rounded-lg p-8 flex flex-col items-center justify-center dark:bg-[#0b0b0b]">
                      <img src={orderEmptyIco} alt="Nenhum pedido" className="max-w-[80px] w-full h-auto" />
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">Nenhum pedido encontrado</div>
                    </div>
                  </div>
                ) : (
                  getSortedOrders().map((order) => {
                    const date = order.date ? new Date(order.date) : (order.createdAt ? new Date(order.createdAt) : null);
                    const month = date ? date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '—';
                    const day = date ? String(date.getDate()).padStart(2, '0') : '—';
                    const items = Array.isArray(order.items) ? order.items : (order.items || []);
                    return (
                      <Card key={order.id || order.code} className="mb-5 p-0 border-0 bg-white/40 dark:bg-[#242424]/80 rounded-xl h-[130px] max-sm:h-[120px]">
                        <button onClick={() => setSelectedOrder(order)} className="flex items-center h-full px-5 relative w-full text-left">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Date */}
                            <div className="text-center min-w-[27px]">
                              <div className="text-sm font-medium text-orange-600">{month}</div>
                              <div className="text-xl font-medium text-[#091747] dark:text-white">{day}</div>
                            </div>
                            {/* Event Image */}
                            <div className="w-[100px] h-[100px] bg-zinc-300 rounded-md max-sm:w-20 max-sm:h-20 flex-shrink-0 overflow-hidden">
                              {order.event?.bannerUrl && (
                                <img src={order.event.bannerUrl.startsWith('/uploads/') ? `/api${order.event.bannerUrl}` : order.event.bannerUrl} alt={order.eventName || 'Evento'} className="w-full h-full object-cover" />
                              )}
                            </div>
                            {/* Event Info */}
                            <div className="flex-1 flex flex-col justify-between h-[84px] py-2">
                              <div>
                                <p className="text-xs text-[#091747] dark:text-white mb-1">
                                  Pedido nº {order.code || order.id}
                                </p>
                                <h3 className="text-base font-semibold text-[#091747] dark:text-white">
                                  {order.eventName || 'Evento'}
                                </h3>
                              </div>
                              <p className="text-xs text-[#091747] dark:text-white">
                                {order.participantsCount || items.length || 0} ingresso(s) • {order.totalAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount) : '—'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-[6px] h-[10px] text-[#091747] dark:text-white ml-4" />
                        </button>
                      </Card>
                    );
                  })
                )}
                <p className="text-sm text-[#091747] dark:text-white mb-16 max-sm:text-sm">
                  Pedidos mais antigos poderão não aparecer mais na sua listagem.
                </p>
              </section>
              {/* Seguindo Section */}
              <section>
                <h2 className="text-xl font-semibold text-[#091747] dark:text-white mb-5 max-sm:text-lg max-sm:text-left">
                  Seguindo
                </h2>
                <Card className="p-0 border-0 bg-white/40 dark:bg-[#242424]/80 rounded-xl h-20">
                  <div className="flex items-center h-full px-5 relative">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Organization Avatar */}
                      <div className="w-[50px] h-[50px] bg-zinc-300 rounded-full max-sm:w-10 max-sm:h-10" />
                      {/* Organization Info */}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#091747] dark:text-white mb-1">
                          Fauves entretenimento
                        </h3>
                        <p className="text-xs text-[#091747] dark:text-white">1.9k seguidores</p>
                      </div>
                    </div>
                    <ChevronRight className="w-[6px] h-[10px] text-[#091747] dark:text-white ml-4" />
                  </div>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout with Tabs - visible only on mobile */}
      <div className="md:hidden">
        {/* Compact Profile Header */}
        <div className="bg-white dark:bg-[#0b0b0b] border-b border-[rgba(9,23,71,0.08)] dark:border-[#2A2A2A] px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16">
              <AvatarImage src={''} alt="Profile" />
              <AvatarFallback className="bg-[#F7F7F7] dark:bg-[#1b1b1b] text-[#091747] dark:text-white text-lg font-semibold">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-[#091747] dark:text-white">{userName}</h1>
                <Button variant="ghost" size="icon" className="w-4 h-4 text-[#091747] dark:text-white hover:bg-transparent p-0" onClick={() => navigate('/account-settings')}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-xs text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)]">
                {orders.length} pedidos • 0 seguindo
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-12 bg-white dark:bg-[#0b0b0b] border-b border-[rgba(9,23,71,0.08)] dark:border-[#2A2A2A] rounded-none p-0 justify-start">
            <TabsTrigger value="tickets" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 text-[rgba(9,23,71,0.5)] dark:text-[rgba(255,255,255,0.5)] data-[state=active]:text-[#091747] dark:data-[state=active]:text-white font-medium gap-1.5">
              <Ticket className="w-4 h-4" />
              <span className="text-xs">Ingressos</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 text-[rgba(9,23,71,0.5)] dark:text-[rgba(255,255,255,0.5)] data-[state=active]:text-[#091747] dark:data-[state=active]:text-white font-medium gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 text-[rgba(9,23,71,0.5)] dark:text-[rgba(255,255,255,0.5)] data-[state=active]:text-[#091747] dark:data-[state=active]:text-white font-medium gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-xs">Seguindo</span>
            </TabsTrigger>
          </TabsList>

          {/* Ingressos Content */}
          <TabsContent value="tickets" className="px-4 py-4 m-0">
            {tickets.length > 0 && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowInactiveTickets(!showInactiveTickets)}
                  className="text-xs text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)] hover:text-[#091747] dark:hover:text-white font-medium"
                >
                  {showInactiveTickets ? 'Ocultar inativos' : 'Mostrar inativos'}
                </button>
              </div>
            )}
            {ticketsLoading ? (
              <ProfilePageSkeleton />
            ) : getFilteredTickets().length === 0 ? (
              <div className="py-8 border-2 border-dashed border-slate-200 dark:border-[#2A2A2A] rounded-lg flex flex-col items-center">
                <img src={ticketEmptyIco} alt="Nenhum ingresso" className="w-20 h-auto opacity-50" />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {showInactiveTickets ? 'Nenhum ingresso encontrado' : 'Nenhum ingresso ativo'}
                </p>
                {!showInactiveTickets && tickets.length > 0 && (
                  <button
                    onClick={() => setShowInactiveTickets(true)}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Mostrar ingressos inativos
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {getFilteredTickets().map((t) => {
                  const date = t.eventStartDate ? new Date(t.eventStartDate) : null;
                  const month = date ? date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '—';
                  const day = date ? String(date.getDate()).padStart(2, '0') : '—';
                  const status = t.status || 'ISSUED';
                  const statusText = status === 'ISSUED' ? 'ATIVO' : status === 'CANCELED' ? 'CANCELADO' : 'RESERVADO';
                  const badgeClass = status === 'ISSUED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  return (
                    <Card key={t.id} className="p-0 border-0 bg-[rgba(9,23,71,0.03)] dark:bg-[#1a1a1a] rounded-lg overflow-hidden">
                      <button onClick={() => setSelectedTicket(t)} className="flex items-center p-3 gap-3 w-full text-left">
                        <div className="text-center min-w-[28px]">
                          <div className="text-[10px] font-semibold text-orange-600">{month}</div>
                          <div className="text-base font-bold text-[#091747] dark:text-white">{day}</div>
                        </div>
                        <div className="w-11 h-11 bg-slate-300 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                          {t.event?.bannerUrl && (
                            <img src={t.event.bannerUrl.startsWith('/uploads/') ? `/api${t.event.bannerUrl}` : t.event.bannerUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#091747] dark:text-white truncate mb-0.5">{t.eventName || 'Evento'}</h3>
                          <p className="text-xs text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)] mb-1.5">{t.code || ''}</p>
                          <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>{statusText}</Badge>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#091747] dark:text-white flex-shrink-0" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              Seus ingressos serão arquivados após o evento
            </p>
          </TabsContent>

          {/* Pedidos Content */}
          <TabsContent value="orders" className="px-4 py-4 m-0">
            {ordersLoading ? (
              <div className="text-sm text-slate-500">Carregando...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 border-2 border-dashed border-slate-200 dark:border-[#2A2A2A] rounded-lg flex flex-col items-center">
                <img src={orderEmptyIco} alt="Nenhum pedido" className="w-20 h-auto opacity-50" />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {getSortedOrders().map((order) => {
                  const date = order.date ? new Date(order.date) : (order.createdAt ? new Date(order.createdAt) : null);
                  const month = date ? date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '—';
                  const day = date ? String(date.getDate()).padStart(2, '0') : '—';
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <Card key={order.id || order.code} className="p-0 border-0 bg-[rgba(9,23,71,0.03)] dark:bg-[#1a1a1a] rounded-lg overflow-hidden">
                      <button onClick={() => setSelectedOrder(order)} className="flex items-center p-3 gap-3 w-full text-left">
                        <div className="text-center min-w-[28px]">
                          <div className="text-[10px] font-semibold text-orange-600">{month}</div>
                          <div className="text-base font-bold text-[#091747] dark:text-white">{day}</div>
                        </div>
                        <div className="w-20 h-14 bg-slate-300 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                          {order.event?.bannerUrl && (
                            <img src={order.event.bannerUrl.startsWith('/uploads/') ? `/api${order.event.bannerUrl}` : order.event.bannerUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)] mb-0.5">
                            Pedido nº {order.code || order.id}
                          </p>
                          <h3 className="text-sm font-semibold text-[#091747] dark:text-white truncate mb-1">{order.eventName || 'Evento'}</h3>
                          <p className="text-xs text-[rgba(9,23,71,0.7)] dark:text-[rgba(255,255,255,0.7)]">
                            {order.participantsCount || items.length || 0} ingresso(s) • {order.totalAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount) : '—'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#091747] dark:text-white flex-shrink-0" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              Pedidos antigos podem não aparecer na listagem
            </p>
          </TabsContent>

          {/* Seguindo Content */}
          <TabsContent value="following" className="px-4 py-4 m-0">
            <Card className="p-0 border-0 bg-[rgba(9,23,71,0.03)] dark:bg-[#1a1a1a] rounded-lg overflow-hidden">
              <div className="flex items-center p-3 gap-3">
                <div className="w-11 h-11 bg-slate-300 dark:bg-slate-700 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#091747] dark:text-white mb-0.5">Fauves entretenimento</h3>
                  <p className="text-xs text-[rgba(9,23,71,0.6)] dark:text-[rgba(255,255,255,0.6)]">1.9k seguidores</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#091747] dark:text-white flex-shrink-0" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default Profile;
