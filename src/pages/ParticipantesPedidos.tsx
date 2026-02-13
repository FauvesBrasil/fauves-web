import React, { useState, useEffect } from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Download, ShoppingBag, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

interface OrderRow {
  id: string;
  code: string;
  eventId: string;
  eventName?: string;
  participantsCount: number;
  totalAmount: number;
  createdAt: string;
  paymentStatus?: string; // PENDING, PAID, CANCELED, REFUNDED
  refundStatus?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  purchaserName?: string;
  purchaserEmail?: string;
}

export default function ParticipantesPedidos() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();

  // Event data for mobile menus
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  // Orders data from API
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Modal and detail states
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});

  // Helper functions
  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return '-'; }
  };

  const formatMoney = (v: number) => {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return 'R$' + v.toFixed(2).replace('.', ',');
  };

  const renderRefundBadge = (status?: string | null) => {
    if (!status) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-zinc-100 text-zinc-500">-</span>;
    const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
      requested: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border border-indigo-200', label: 'Solicitado' },
      processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border border-amber-200', label: 'Processando' },
      refunded: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border border-emerald-200', label: 'Reembolsado' },
      rejected: { bg: 'bg-red-50', text: 'text-red-600', border: 'border border-red-200', label: 'Rejeitado' }
    };
    const st = styles[status] || { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border border-zinc-200', label: status };
    return <span title={status} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>;
  };

  const renderPaymentBadge = (status?: string) => {
    if (!status) status = 'PENDING';
    const map: Record<string, { label: string; classes: string }> = {
      PENDING: { label: 'Aguardando', classes: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300' },
      PAID: { label: 'Pago', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300' },
      CANCELED: { label: 'Cancelado', classes: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300' },
      REFUNDED: { label: 'Reembolsado', classes: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300' }
    };
    const st = map[status] || map.PENDING;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${st.classes}`}>{st.label}</span>;
  };

  const refundIcon = (o: OrderRow) => {
    if (!o.refundStatus) return null;
    const fullRefund = o.refundStatus === 'refunded' && o.refundAmount && Math.abs(o.refundAmount - o.totalAmount) < 0.01;
    const partial = (o.refundStatus === 'refunded' || o.refundStatus === 'processing') && o.refundAmount && o.refundAmount < o.totalAmount!;
    if (fullRefund) return <span title={`Reembolsado ${o.refundAmount?.toFixed(2)}`} className="ml-1 text-green-600" aria-label="Reembolso total">●</span>;
    if (partial) return <span title={`Parcial: R$${o.refundAmount?.toFixed(2)}`} className="ml-1 text-amber-600" aria-label="Reembolso parcial">◐</span>;
    if (o.refundStatus === 'processing') return <span title="Processando" className="ml-1 text-amber-600 animate-pulse" aria-label="Reembolso em processamento">○</span>;
    if (o.refundStatus === 'requested') return <span title="Solicitado" className="ml-1 text-indigo-600" aria-label="Reembolso solicitado">◌</span>;
    if (o.refundStatus === 'rejected') return <span title="Rejeitado" className="ml-1 text-red-600" aria-label="Reembolso rejeitado">✕</span>;
    return null;
  };

  // Load event details for mobile menus
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!eventId) return;
      try {
        const res = await fetchApi(`/api/event/${eventId}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart} às ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch { }
    }
    load();
    return () => { mounted = false; };
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    async function loadTickets() {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/ticket-type/event/${eventId}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setTicketTypes(data || []);
      } catch (e) {
        // ignore
      }
    }
    loadTickets();
    return () => { mounted = false; };
  }, [eventId]);

  // Load orders from API
  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      console.log('[ParticipantesPedidos] loadOrders check:', { eventId, userId: user?.id });
      if (!eventId || !user?.id) {
        console.log('[ParticipantesPedidos] Skipping loadOrders - missing eventId or userId');
        return;
      }
      setOrdersLoading(true);
      try {
        const params = new URLSearchParams({
          userId: user.id,
          eventId: eventId,
          limit: '100'
        });
        console.log('[ParticipantesPedidos] Fetching orders:', `/api/orders?${params}`);
        const res = await fetchApi(`/api/orders?${params}`);
        if (!res?.ok) {
          console.error('[ParticipantesPedidos] API error:', res?.status);
          return;
        }
        const data = await res.json();
        console.log('[ParticipantesPedidos] Orders loaded:', data);
        if (!mounted) return;

        // Map API response to OrderRow format - same structure as OrdersManager
        const mappedOrders: OrderRow[] = (data.items || []).map((o: any) => ({
          id: o.id,
          code: o.code,
          eventId: o.eventId,
          eventName: o.eventName || 'Evento',
          participantsCount: o.participantsCount || 0,
          totalAmount: o.totalAmount || 0,
          createdAt: o.createdAt,
          paymentStatus: o.paymentStatus || 'PENDING',
          refundStatus: o.refundStatus || null,
          refundAmount: o.refundAmount || null,
          refundedAt: o.refundedAt || null,
          purchaserName: o.purchaserName || '',
          purchaserEmail: o.purchaserEmail || ''
        }));
        setOrders(mappedOrders);
      } catch (e) {
        console.error('Failed to load orders:', e);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    }
    loadOrders();
    return () => { mounted = false; };
  }, [eventId, user?.id]);

  const totalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);

  // Open order details modal
  const openOrder = (o: OrderRow) => {
    setSelected(o);

    // Check if details are already cached
    if (detailsCache[o.id]) {
      setDetail(detailsCache[o.id]);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    setDetail(null); setDetailError(null); setDetailLoading(true);

    if (!user?.id) { setDetailError('Usuário não autenticado'); setDetailLoading(false); return; }

    const params = new URLSearchParams();
    params.set('userId', user.id);
    if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
    if (eventId) params.set('eventId', eventId);

    fetch(`/api/orders/${o.id}?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setDetailError(d.error === 'not authorized' ? 'Sem permissão para ver este pedido.' : d.error);
        } else {
          setDetail(d);
          // Cache the details
          setDetailsCache(prev => ({ ...prev, [o.id]: d }));
        }
      })
      .catch(() => setDetailError('Erro ao carregar detalhes'))
      .finally(() => setDetailLoading(false));
  };

  // Download PDF
  const downloadPDF = (orderId: string) => {
    if (!user?.id || !selectedOrg?.id) return;
    const params = new URLSearchParams();
    params.set('userId', user.id);
    params.set('organizationId', selectedOrg.id);
    window.open(`/api/ticket/order/${orderId}/pdf?${params.toString()}`, '_blank');
  };

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('[data-row-menu]')) setOpenMenuId(null);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
      {/* Mobile Menus */}
      <MobileTopBar
        onMenuOpen={() => setMobileMenuOpen(true)}
      />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
      />

      <EventMobileTopBar
        onMenuOpen={() => setEventMenuOpen(true)}
        title="Pedidos"
      />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={eventId || ''}
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <SidebarMenu className="max-md:hidden" />
      {eventId && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventIdOverride={eventId || null}
            panelRoute={eventId ? `/painel-evento/${eventId}` : undefined}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
            onBack={() => navigate('/organizer-events')}
          />
        </div>
      )}
      <AppHeader />
      <OrganizerLayout>
        <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 max-md:pl-4 pr-8 max-md:pr-4 min-h-screen max-md:pb-8 relative">
          <div className="mt-24 max-md:mt-[140px] max-w-[800px] mx-auto max-md:max-w-full w-full space-y-6 max-sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 max-md:hidden">
              <div>
                <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-1">Pedidos</h1>
                <p className="text-sm text-zinc-600 dark:text-slate-300">
                  Pedidos ({orders.length}) • Total {formatMoney(totalAmount)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap max-sm:gap-2">
                <Input placeholder="Buscar por ID, nome ou email..." className="w-72 max-md:w-full" />
              </div>
            </div>
            {/* Mobile only header */}
            <div className="hidden max-md:block space-y-3">
              <div>
                <h1 className="text-xl font-bold text-indigo-950 dark:text-white mb-1">Pedidos</h1>
                <p className="text-xs text-zinc-600 dark:text-slate-300">
                  Pedidos ({orders.length}) • Total {formatMoney(totalAmount)}
                </p>
              </div>
              <Input placeholder="Buscar..." className="w-full text-sm" />
            </div>

            {/* Loading State */}
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 dark:text-slate-400">Carregando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-zinc-200 dark:border-[#1F1F1F] bg-white dark:bg-[#121212] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-indigo-950 dark:text-white mb-2">Nenhum pedido encontrado</h3>
                <p className="text-sm text-zinc-500 dark:text-slate-400 max-w-sm">
                  Este evento ainda não possui pedidos. Quando os participantes comprarem ingressos, eles aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="rounded-2xl border border-zinc-200 dark:border-[#1F1F1F] bg-white dark:bg-[#121212] overflow-hidden max-md:hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-zinc-100 text-zinc-600 dark:bg-[#1F1F1F] dark:text-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left">Pedido / Comprador</th>
                          <th className="px-4 py-3 text-left">Data</th>
                          <th className="px-4 py-3 text-left">Ingressos</th>
                          <th className="px-4 py-3 text-left">Preço</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t border-zinc-100 dark:border-[#1F1F1F] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition cursor-pointer" onClick={() => openOrder(order)}>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">#{order.code}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{order.purchaserName || order.purchaserEmail || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.participantsCount}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatMoney(order.totalAmount)} {refundIcon(order)}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                {renderPaymentBadge(order.paymentStatus)}
                                {order.refundStatus ? renderRefundBadge(order.refundStatus) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300 relative" data-row-menu onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setOpenMenuId(m => m === order.id ? null : order.id)} className="px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">⋮</button>
                              {openMenuId === order.id && (
                                <div className="absolute right-4 top-10 w-52 bg-white dark:bg-[#0b0b0b] rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 py-1" data-row-menu>
                                  <button
                                    onClick={() => { openOrder(order); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
                                  >
                                    Ver detalhes
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      if (!user?.id) return;
                                      const params = new URLSearchParams();
                                      params.set('userId', user.id);
                                      if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                                      fetch(`/api/orders/${order.id}/resend?${params.toString()}`, { method: 'POST' })
                                        .then(r => r.json())
                                        .then(d => {
                                          if (d.status === 'ok') alert(`E-mails enfileirados: ${d.queued}`);
                                          else alert(d.error || 'Falha ao reenviar');
                                        })
                                        .catch(() => alert('Erro de rede'));
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
                                  >
                                    Reenviar ingressos
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="hidden max-md:block space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-zinc-200 dark:border-[#1F1F1F] bg-white dark:bg-[#121212] p-4 space-y-3"
                    >
                      {/* Header with order info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-indigo-600 dark:text-indigo-300 text-sm">#{order.code}</div>
                          <div className="text-xs text-zinc-700 dark:text-slate-300 mt-0.5">{order.purchaserName || order.purchaserEmail || '-'}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-indigo-900 dark:text-white text-base">{formatMoney(order.totalAmount)}</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-[#1F1F1F]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-slate-400">Data:</span>
                          <span className="text-zinc-700 dark:text-slate-200 font-medium">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-slate-400">Ingressos:</span>
                          <span className="text-zinc-700 dark:text-slate-200 font-medium">{order.participantsCount}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-[#1F1F1F]">
                        {renderPaymentBadge(order.paymentStatus)}
                        {order.refundStatus ? renderRefundBadge(order.refundStatus) : null}
                        {refundIcon(order)}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-2 py-2">
                          <Download className="w-3.5 h-3.5" /> Baixar PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </OrganizerLayout>

      {/* Order Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#0b0b0b] dark:text-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-700 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pedido #{selected.code}</h2>
                  {renderPaymentBadge(detail?.paymentStatus || selected.paymentStatus)}
                  {detail?.refundStatus ? renderRefundBadge(detail.refundStatus) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Criado em {new Date(selected.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-400 dark:text-slate-400 hover:text-zinc-600 transition" aria-label="Fechar">✕</button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-0.5">Evento</span>
                  <span className="font-medium text-zinc-800 dark:text-white">{selected.eventName || eventName || 'Evento'}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-0.5">Participantes</span>
                  <span className="font-medium text-zinc-800 dark:text-white">{selected.participantsCount}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-0.5">Valor Total</span>
                  <span className="font-medium text-zinc-800 dark:text-white">{formatMoney(selected.totalAmount)}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-0.5">ID</span>
                  <span className="font-mono text-[13px] text-zinc-700 dark:text-slate-300">{selected.id}</span>
                </div>
              </div>
              {detail && (
                <div className="grid grid-cols-2 gap-4 bg-white/60 dark:bg-[#121212]/60 border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 text-[12px]">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Comprador</div>
                    <div className="font-medium text-zinc-800 dark:text-white">{detail.purchaserName || selected.purchaserName || '-'}</div>
                    <div className="text-zinc-500 dark:text-slate-400 text-[11px]">{detail.purchaserEmail || selected.purchaserEmail || ''}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Pagamento</div>
                    <div className="font-medium text-zinc-800 dark:text-white">{detail.paymentMethod || 'PIX'}</div>
                    {detail.refundStatus && (
                      <div className="mt-1 text-[11px] text-amber-700 font-medium">Reembolso: {detail.refundStatus}{detail.refundAmount ? ` (R$${detail.refundAmount.toFixed(2).replace('.', ',')})` : ''}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Data do pedido</div>
                    <div className="font-medium text-zinc-800 dark:text-white">{formatDate(detail.createdAt || selected.createdAt)}</div>
                  </div>
                </div>
              )}
              <div className="bg-zinc-50 dark:bg-[#0b0b0b] border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 text-[12px] leading-relaxed text-zinc-600 dark:text-slate-300 min-h-[120px]">
                {detailLoading && <div className="animate-pulse text-zinc-500 dark:text-slate-400">Carregando detalhes...</div>}
                {detailError && <div className="text-red-500 text-xs">{detailError}</div>}
                {!detailLoading && !detailError && detail && (
                  <div className="space-y-3">
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500">Tickets</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-zinc-500">
                            <th className="py-1 pr-4">Código</th>
                            <th className="py-1 pr-4">Email</th>
                            <th className="py-1 pr-4">Tipo</th>
                            <th className="py-1 pr-2 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="align-top">
                          {detail.tickets?.map((t: any) => (
                            <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-700">
                              <td className="py-1 pr-4 font-mono text-indigo-600 dark:text-indigo-300">{t.code}</td>
                              <td className="py-1 pr-4 text-zinc-700 dark:text-slate-300">{t.userEmail || '-'}</td>
                              <td className="py-1 pr-4 text-zinc-700 dark:text-slate-300">{t.ticketTypeName || 'Pista'}</td>
                              <td className="py-1 pr-2 text-right text-zinc-700 dark:text-slate-300">{t.pricePaid ? 'R$' + t.pricePaid.toFixed(2).replace('.', ',') : '-'}</td>
                            </tr>
                          ))}
                          {(!detail.tickets || detail.tickets.length === 0) && <tr><td colSpan={4} className="py-2 text-zinc-500">Sem tickets</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!detailLoading && !detailError && !detail && (
                  <div className="text-zinc-500 text-xs">Carregando informações do pedido...</div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#0b0b0b]">
              <div className="flex gap-2">
                <button
                  disabled={!detail || detail.paymentStatus !== 'PAID'}
                  onClick={() => {
                    if (!detail || !user?.id) return;
                    const params = new URLSearchParams();
                    params.set('userId', user.id);
                    if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                    fetch(`/api/orders/${detail.id}/resend?${params.toString()}`, { method: 'POST' })
                      .then(r => r.json())
                      .then(d => {
                        if (d.status === 'ok') {
                          alert(`E-mails enfileirados: ${d.queued}`);
                        } else {
                          alert(d.error || 'Falha ao reenviar');
                        }
                      })
                      .catch(() => alert('Erro de rede'));
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!detail || detail.paymentStatus !== 'PAID' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  Reenviar ingressos
                </button>
              </div>
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
