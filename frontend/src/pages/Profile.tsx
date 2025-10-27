import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Edit, ChevronRight } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';
import { getFirstName, getDisplayName } from '@/lib/user';
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

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    (async () => { await reloadTickets(); })();
    (async () => { await reloadOrders(); })();
    return () => { cancelled = true; };
  }, [loading, user]);

  const reloadTickets = async () => {
    let cancelled = false;
    setTicketsLoading(true);
    try {
      if (!user) {
        setTickets([]);
        return;
      }
      const q = user.id ? `userId=${encodeURIComponent(user.id)}` : `userEmail=${encodeURIComponent(user.email || '')}`;
      const r = await fetch(`/api/my/tickets?${q}`);
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
      const r = await fetch(`/api/orders?${q}`);
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
        const res = await fetch('/api/ticket/transfer', {
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
          setTimeout(() => { reloadTickets().catch(() => {}); }, 50);
        }
      } catch (e: any) {
        setTransferError(e?.message || 'Erro ao transferir ingresso');
        toast({ title: 'Erro', description: e?.message || 'Erro ao transferir ingresso', variant: 'destructive' as any });
      } finally {
        setTransferLoading(false);
      }
    };
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    React.useEffect(() => {
      if (!ticket?.code) return;
      QRCode.toDataURL(String(ticket.code)).then((d) => setQrDataUrl(d)).catch(() => setQrDataUrl(null));
    }, [ticket?.code]);

    const onPrint = () => {
      const w = window.open('', '_blank', 'width=600,height=800');
      if (!w) return;
      const html = `
        <html><head><title>Ingresso ${ticket.code}</title><style>body{font-family:Arial,sans-serif;padding:20px;} .ticket{max-width:420px;border:1px solid #ddd;padding:16px;border-radius:12px;} .qr{width:200px;height:200px;margin:auto;display:block;}</style></head>
        <body>
          <div class="ticket">
            <h2>${(ticket.eventName||'Evento')}</h2>
            <p>Ingresso: ${ticket.ticketTypeName||'—'}</p>
            <p>Código: ${ticket.code}</p>
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr"/>` : ''}
          </div>
        </body></html>`;
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); }, 300);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-[420px] max-w-full bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-xl overflow-hidden z-60">
          <div className="flex items-center justify-between p-4 border-b dark:border-[#1F1F1F]">
            <div className="text-lg font-semibold text-indigo-950 dark:text-white">Ingresso #{ticket.code}</div>
            <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <div className="p-4">
            <div className="h-36 bg-gradient-to-r from-indigo-300 to-teal-200 rounded-md mb-4 flex items-center justify-center text-white">Imagem do evento</div>
            <div className="text-center mb-2">
              <div className="inline-block px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 font-semibold">{ticket.status === 'ISSUED' ? 'ATIVO PARA USO' : ticket.status}</div>
            </div>
            <h3 className="text-center text-lg font-semibold text-indigo-950 dark:text-white">{ticket.eventName || 'Evento'}</h3>
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">#{ticket.code}</div>
              <div className="flex gap-3 justify-center mb-4">
              <Button onClick={onPrint} className="bg-indigo-700 text-white">Imprimir</Button>
              {!isCourtesy ? (
                <>
                  <Button onClick={openTransferDialog} className="bg-[#EF4118] text-white">Transferir</Button>
                  <AlertDialog open={transferOpen} onOpenChange={(v) => { if (!v) setTransferOpen(false); }}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Transferir ingresso</AlertDialogTitle>
                        <AlertDialogDescription>Confirme o e-mail do destinatário para transferir este ingresso.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="mt-4">
                          <input ref={inputRef} className="w-full border rounded-md px-3 py-2" value={transferTargetEmail} onChange={(e) => setTransferTargetEmail(e.target.value)} placeholder="email@exemplo.com" aria-label="email destinatário" />
                          {transferError && <div className="mt-2 text-sm text-red-600">{transferError}</div>}
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
              ) : (
                <Button className="bg-[#E9E9E9] text-slate-400" disabled>Transferir</Button>
              )}
            </div>

            <div className="bg-[#F8F9FC] dark:bg-[#161616] rounded-md p-3 text-sm">
              <div className="flex justify-between py-2"><div className="text-slate-500">Participante</div><div className="font-medium">{(ticket.userName) || (ticket.guestEmail) || '—'}</div></div>
              <div className="flex justify-between py-2"><div className="text-slate-500">Ingresso</div><div className="font-medium">{ticket.ticketTypeName || '—'}</div></div>
            </div>

            {/* QR */}
            <div className="mt-4 flex justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-36 h-36 border shadow-sm" />
              ) : (
                <div className="w-36 h-36 bg-white border shadow-sm" />
              )}
            </div>
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
      <div className="max-w-[1352px] mx-auto px-5 py-10 max-md:px-5 max-md:py-5 max-sm:px-4">
  <div className="flex gap-[100px] items-start mx-auto w-fit max-md:flex-col max-md:gap-8 max-md:items-center max-md:text-center max-sm:gap-2.5">
          {/* Profile Section Sticky */}
          <div className="sticky top-24 self-start flex flex-row items-center gap-5">
            <div className="relative">
              <div className="w-[100px] h-[100px] rounded-full bg-[#F7F7F7] dark:bg-[#1b1b1b] border border-[rgba(9,23,71,0.05)] dark:border-[#1F1F1F] shadow-[0_4px_8px_rgba(9,23,71,0.10)] flex items-center justify-center">
                {/* Avatar: ajuste conforme seu backend salva foto */}
                <Avatar className="w-[100px] h-[100px]">
                  <AvatarImage src={''} alt="Profile" />
                  <AvatarFallback className="bg-[#F7F7F7] dark:bg-[#1b1b1b] text-[#091747] dark:text-white text-2xl font-semibold">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-2 max-md:justify-center">
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
              <p className="text-sm font-medium text-[#091747] dark:text-white max-md:text-center">
                16 pedidos • 1 seguindo
              </p>
            </div>
          </div>
          {/* Dados Section */}
          <div className="max-w-[520px] max-md:max-w-full">
            {/* Ingressos Section */}
            <section className="mb-16">
              <h2 className="text-xl font-semibold text-[#091747] dark:text-white mb-5 max-sm:text-lg">
                Ingressos
              </h2>
              {/* Tickets list (comprados ou recebidos) */}
              {ticketsLoading ? (
                <div className="space-y-3">
                  <ProfilePageSkeleton />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-6">
                  <div className="mx-auto w-full max-w-[520px] border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center">
                    <img src={ticketEmptyIco} alt="Nenhum ingresso" className="max-w-[80px] w-full h-auto" />
                    <div className="mt-4 text-sm text-slate-600 font-medium">Nenhum ingresso encontrado</div>
                  </div>
                </div>
              ) : (
                tickets.map((t) => {
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
                          <div className="w-[50px] h-[50px] bg-zinc-300 rounded-md max-sm:w-10 max-sm:h-10" />
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
                <h2 className="text-xl font-semibold text-[#091747] dark:text-white max-sm:text-lg">
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
                orders.map((order) => {
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
                          <div className="w-[200px] h-[100px] bg-zinc-300 rounded-md max-sm:w-40 max-sm:h-20" />
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
                              {items.length} ingresso(s) • {order.total || order.amount || '—'}
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
              <h2 className="text-xl font-semibold text-[#091747] dark:text-white mb-5 max-sm:text-lg">
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
      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default Profile;
