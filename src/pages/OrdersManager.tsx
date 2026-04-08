import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import SelectEventModal from '@/components/SelectEventModal';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { WarpDialog } from '@/components/WarpDialog';
import reportsSvg from '@/assets/reports.svg';

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
}

const OrdersManager: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal de seleção de eventos
  const [showSelectModal, setShowSelectModal] = useState(false);
  // Pega eventIds ou eventId da query string (aceita ambos para compatibilidade)
  const eventIdsFromQuery = (() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('eventIds') || params.get('eventId');
    return ids ? ids.split(',') : [];
  })();
  // selected event ids (may be multiple) persisted from query or selection
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(eventIdsFromQuery);

  // If eventIds are provided in the query string, pre-select the first one.
  useEffect(() => {
    if (eventIdsFromQuery.length > 0) {
      // if multiple ids provided keep the first as active filter (UI supports single select)
      setEventFilter(eventIdsFromQuery[0]);
      setSelectedEventIds(eventIdsFromQuery);
    }
    // NOTE: we intentionally DO NOT auto-open the SelectEventModal on load anymore.
  }, []);
  // If the page was opened with eventIds in the querystring, try to fetch the event name
  useEffect(() => {
    if (!selectedEventIds || !selectedEventIds.length) return;
    const first = selectedEventIds[0];
    if (events.find(ev => ev.id === first)) return;
    (async () => {
      try {
        const r = await fetch(`/api/events/${first}`);
        if (r.ok) {
          const ev = await r.json();
          if (ev && ev.id) setEvents(prev => [...prev.filter(p => p.id !== ev.id), { id: ev.id, name: ev.name || ev.title || ev.id }]);
        }
      } catch (e) { }
    })();
  }, [selectedEventIds]);
  // Ao confirmar seleção, atualiza a URL (grava eventIds + eventId para compatibilidade)
  const handleSelectConfirm = (selectedIds: string[], selectedEvent?: { id: string; name?: string }) => {
    setShowSelectModal(false);
    if (selectedIds.length > 0) {
      // update local state immediately so UI shows selection
      setSelectedEventIds(selectedIds);
      setEventFilter(selectedIds[0]);

      // update URL without reloading so the view is shareable
      try {
        const params = new URLSearchParams(window.location.search);
        params.set('eventIds', selectedIds.join(','));
        params.set('eventId', selectedIds[0]);
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      } catch (e) {
        // ignore
      }

      // ensure we have the event name available to display in the top selector
      const firstId = selectedIds[0];
      if (selectedEvent && selectedEvent.id) {
        setEvents(prev => [...prev.filter(p => p.id !== selectedEvent.id), { id: selectedEvent.id, name: selectedEvent.name || selectedEvent.id }]);
      } else if (!events.find(ev => ev.id === firstId)) {
        // try to fetch the event name from the API as a fallback
        (async () => {
          try {
            const r = await fetch(`/api/events/${firstId}`);
            if (r.ok) {
              const ev = await r.json();
              if (ev && ev.id) setEvents(prev => [...prev.filter(p => p.id !== ev.id), { id: ev.id, name: ev.name || ev.title || ev.id }]);
            }
          } catch (err) {
            // ignore missing name
          }
        })();
      }
    }
  };
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [refundStatus, setRefundStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [refundMessage, setRefundMessage] = useState<string>('');
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [debounced, setDebounced] = useState(search);
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ id: string; action: 'cancel' | 'reopen' | null }>({ id: '', action: null });

  // Confirmation dialog states
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState<boolean>(false);
  const [confirmActionLoading, setConfirmActionLoading] = useState<boolean>(false);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  // --- Helpers & static data (were missing -> white screen due to ReferenceError) ---
  const skeletonRows = useMemo(() => Array.from({ length: 8 }), []);

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

  // Mock data removed - now showing real data only

  // Pagination helpers
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total]);
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  useEffect(() => { const h = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(h); }, [search]);

  // Use user from AuthContext instead of Supabase
  useEffect(() => {
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email);
    } else {
      setUserId(null);
      setUserEmail(null);
    }
  }, [user]);

  const fetchData = async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ userId, limit: String(pageSize), offset: String(page * pageSize) });
      if (selectedOrg?.id) qs.set('organizationId', selectedOrg.id);
      if (selectedEventIds && selectedEventIds.length) {
        qs.set('eventIds', selectedEventIds.join(','));
        qs.set('eventId', selectedEventIds[0]);
      } else if (eventFilter !== 'all') {
        qs.set('eventId', eventFilter);
      }
      if (debounced) qs.set('search', debounced);
      if (statusFilter !== 'all') qs.set('paymentStatus', statusFilter);
      const r = await fetch(`/api/orders?${qs.toString()}`);
      const j = await r.json();
      setOrders(j.items || []);
      setTotal(j.total || 0);
      // events dropdown (lazy derive from orders first; fallback fetch by-user)
      const derived: { id: string; name: string }[] = Array.from(
        new Map<string, { id: string; name: string }>(
          (j.items || []).map((o: any) => [o.eventId, { id: o.eventId, name: o.eventName || 'Evento' }])
        ).values()
      );
      if (derived.length) setEvents(prev => (prev.length ? prev : derived));
      if (!derived.length) {
        try {
          if (selectedOrg?.id) {
            const re = await fetch(`/api/organization/${selectedOrg.id}/events`);
            const list = await re.json();
            if (Array.isArray(list)) setEvents(list.map((e: any) => ({ id: e.id, name: e.name || e.title || e.id })));
          } else {
            const re = await fetch(`/api/events/by-user?userId=${userId}`);
            const list = await re.json();
            if (Array.isArray(list)) setEvents(list.map((e: any) => ({ id: e.id, name: e.name })));
          }
        } catch { }
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [userId, debounced, eventFilter, page, statusFilter, selectedEventIds, selectedOrg?.id]);

  // Reset event selection when organization changes
  useEffect(() => {
    setSelectedEventIds([]);
    setEventFilter('all');
    setPage(0);
  }, [selectedOrg?.id]);

  // Keep eventFilter in the URL so the view can be shared / reloaded with the same scope
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ids = selectedEventIds && selectedEventIds.length
        ? selectedEventIds
        : (eventFilter && eventFilter !== 'all' ? [eventFilter] : []);
      if (ids.length) {
        params.set('eventIds', ids.join(','));
        params.set('eventId', ids[0]);
      } else {
        params.delete('eventId');
        params.delete('eventIds');
      }
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      // ignore
    }
  }, [eventFilter, selectedEventIds]);

  // server summary removed (counts panel and server-side summary were intentionally removed)

  // Fetch audit logs when detail loads
  useEffect(() => {
    if (!selected || !selected.id || selected.id.startsWith('static-') || !userId) { setLogs([]); return; }
    setLogsLoading(true);
    const qs = new URLSearchParams({ userId });
    if (selectedOrg?.id) qs.set('organizationId', selectedOrg.id);
    fetch(`/api/orders/${selected.id}/logs?${qs.toString()}`)
      .then(r => r.json())
      .then(l => setLogs(Array.isArray(l) ? l : []))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [selected, userId, selectedOrg?.id]);

  const filtered = useMemo(() => {
    const base = orders;
    if (statusFilter === 'all') return base;
    return base.filter(o => (o.paymentStatus || 'PENDING') === statusFilter);
  }, [orders, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) {
      const ps = o.paymentStatus || 'PENDING';
      c[ps] = (c[ps] || 0) + 1;
    }
    return c;
  }, [orders]);

  const renderPaymentBadge = (status?: string) => {
    if (!status) status = 'PENDING';
    const map: Record<string, { label: string; classes: string }> = {
      PENDING: { label: 'Aguardando', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
      PAID: { label: 'Pago', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      CANCELED: { label: 'Cancelado', classes: 'bg-red-50 text-red-600 border border-red-200' },
      REFUNDED: { label: 'Reembolsado', classes: 'bg-indigo-50 text-indigo-700 border border-indigo-200' }
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
    // Static demo order => mock detail
    if (o.id.startsWith('static-')) {
      setTimeout(() => {
        setDetail({
          id: o.id,
          code: o.code,
          eventId: o.eventId,
          eventName: o.eventName,
          createdAt: o.createdAt,
          participantsCount: o.participantsCount,
          totalAmount: o.totalAmount,
          refundStatus: null,
          tickets: [1, 2, 3].slice(0, o.participantsCount).map(i => ({ id: `t-${o.id}-${i}`, code: `${o.code}-TK${i}`, pricePaid: (o.totalAmount / o.participantsCount), createdAt: o.createdAt })),
          isStatic: true
        });
        setDetailLoading(false);
      }, 250);
      return;
    }
    if (!userId && !userEmail) { setDetailError('Usuário não autenticado'); setDetailLoading(false); return; }
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    else if (userEmail) params.set('userEmail', userEmail);
    if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
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
    if ((!userId && !userEmail) || !selectedOrg?.id) return;
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    else if (userEmail) params.set('userEmail', userEmail!);
    params.set('organizationId', selectedOrg.id);
    window.open(`/api/ticket/order/${orderId}/pdf?${params.toString()}`, '_blank');
  };


  // Close any open dropdown when clicking elsewhere
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('[data-row-menu]')) setOpenMenuId(null);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const performRowAction = async (o: OrderRow, action: string) => {
    if ((action === 'cancel' || action === 'reopen') && !(pendingConfirm.id === o.id && pendingConfirm.action === action)) {
      setPendingConfirm({ id: o.id, action: action as any });
      return;
    }
    if (!userId && !userEmail) return;
    setRowActionLoading(action + o.id);
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    else if (userEmail) params.set('userEmail', userEmail);
    if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
    const base = `/api/orders/${o.id}`;
    let endpoint = '';
    if (action === 'pay') endpoint = base + '/pay';
    else if (action === 'cancel') endpoint = base + '/cancel';
    else if (action === 'reopen') endpoint = base + '/reopen';
    else if (action === 'refund') endpoint = base + '/refund';
    else if (action === 'refund-complete') endpoint = base + '/refund/complete';
    else if (action === 'resend') endpoint = base + '/resend';
    try {
      const r = await fetch(endpoint + '?' + params.toString(), { method: 'POST' });
      const j = await r.json();
      if (j.status === 'ok') {
        setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, paymentStatus: j.paymentStatus || ord.paymentStatus, refundStatus: j.refundStatus || ord.refundStatus, refundAmount: j.amount || ord.refundAmount } : ord));
        if (selected && selected.id === o.id) {
          setDetail((prev: any) => prev ? { ...prev, paymentStatus: j.paymentStatus || prev.paymentStatus, refundStatus: j.refundStatus || prev.refundStatus, refundAmount: j.amount || prev.refundAmount } : prev);
        }
      }
    } catch { } finally {
      setRowActionLoading(null);
      setOpenMenuId(null);
    }
  };

  return (
    <OrganizerLayout>
      <div className="relative min-h-screen w-full bg-transparent dark:bg-[#0b0b0b] dark:text-white">
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          user={user}
        />
        <SidebarMenu className="max-md:hidden" activeKeyOverride="pedidos" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 max-md:pt-20">
          <AppHeader />
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mt-16 px-2 max-md:mt-10 max-sm:mt-6">{/* content area */}
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">Gerenciador de pedidos</h1>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px] -mt-3 max-sm:text-sm">Gerencie todos os pedidos, incluindo edição de informações do comprador, reenvio de ingressos e processamento de reembolsos. Para baixar uma lista de pedidos, visualize o Relatório de pedidos.</p>
            {/* Top row: Actions on left, event selector, search on right */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 max-md:justify-between w-full md:w-auto">
                  <div className="relative">
                    <button onClick={() => setShowActionsMenu(s => !s)} className="px-3 py-2 rounded-lg border bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:text-white text-sm whitespace-nowrap">Ações ▾</button>
                    {showActionsMenu && (
                      <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#0b0b0b] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-40 p-2 text-sm">
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          <li>
                            <button
                              onClick={() => {
                                const params = new URLSearchParams();
                                if (userId) params.set('userId', userId);
                                if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                                if (debounced) params.set('search', debounced);
                                if (statusFilter !== 'all') params.set('paymentStatus', statusFilter);
                                if (selectedEventIds && selectedEventIds.length) {
                                  params.set('eventIds', selectedEventIds.join(','));
                                  params.set('eventId', selectedEventIds[0]);
                                } else if (eventFilter !== 'all') {
                                  params.set('eventId', eventFilter);
                                }
                                params.set('valid', '1');
                                const url = '/api/orders/export?' + params.toString();
                                window.location.href = url;
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-gray-300 rounded"
                            >
                              Baixar pedidos válidos (.csv)
                              <div className="text-xs text-zinc-400">Somente pedidos válidos</div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                const params = new URLSearchParams();
                                if (userId) params.set('userId', userId);
                                if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                                if (debounced) params.set('search', debounced);
                                if (statusFilter !== 'all') params.set('paymentStatus', statusFilter);
                                if (selectedEventIds && selectedEventIds.length) {
                                  params.set('eventIds', selectedEventIds.join(','));
                                  params.set('eventId', selectedEventIds[0]);
                                } else if (eventFilter !== 'all') {
                                  params.set('eventId', eventFilter);
                                }
                                const url = '/api/orders/export?' + params.toString();
                                window.location.href = url;
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-gray-300 rounded"
                            >
                              Baixar todos os pedidos (.csv)
                              <div className="text-xs text-zinc-400">Incluir pedidos reembolsados</div>
                            </button>
                          </li>
                          <li>
                            <button onClick={() => { setShowSelectModal(true); setShowActionsMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-gray-300 rounded">Selecione com uma lista<div className="text-xs text-zinc-400">ex: Encontrar e reembolsar usando uma lista</div></button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Event selector aligned with actions */}
                  <div className="flex items-center gap-2 flex-1 md:flex-initial overflow-hidden">
                    <div className="h-[40px] px-3 rounded-lg border bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:text-white flex items-center text-sm truncate flex-1 md:w-auto min-w-0">
                      <span className="truncate">
                        {selectedEventIds.length
                          ? (events.find(ev => ev.id === selectedEventIds[0])?.name || selectedEventIds[0])
                          : (eventFilter === 'all' ? 'Todos eventos' : (events.find(ev => ev.id === eventFilter)?.name || eventFilter))}
                      </span>
                    </div>
                    <button onClick={() => setShowSelectModal(true)} title="Selecionar" className="h-[40px] px-3 rounded-lg border border-[#E5E7EB] bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:text-white text-sm whitespace-nowrap hover:bg-zinc-50 dark:hover:bg-[#1F1F1F]">Selecionar</button>
                    {eventFilter !== 'all' && (
                      <button onClick={() => { setEventFilter('all'); setPage(0); }} className="h-9 px-3 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm dark:text-white">Limpar</button>
                    )}
                  </div>
                </div>

                <div className="flex-1 hidden md:block" />

                <div className="w-full md:min-w-[300px] md:w-auto">
                  <input
                    className="w-full h-[40px] md:h-[54px] px-4 md:px-5 rounded-lg md:rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm md:text-[15px] bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:placeholder:text-slate-400 dark:text-white"
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de pedidos - Desktop Table */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#121212] shadow-sm mt-3 max-md:hidden">
              <table className="w-full text-left">
                <thead className="bg-[#F6F7FB] dark:bg-[#0b0b0b] text-slate-600 dark:text-slate-300 text-xs font-medium tracking-wide border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-4 px-6">Pedido / Comprador</th>
                    <th className="py-4 px-6">Evento</th>
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Ingressos</th>
                    <th className="py-4 px-6">Preço</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[13px]">
                  {loading ? (
                    skeletonRows.map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-6"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6"><div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6"><div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                        <td className="py-4 px-6 text-right"><div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16">
                        <div className="flex flex-col items-center justify-center">
                          <img src={reportsSvg} alt="Nenhum pedido" className="w-32 h-32 mb-4 opacity-50 grayscale dark:invert" />
                          <div className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Nenhum pedido encontrado</div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                            {selectedEventIds.length > 0 || eventFilter !== 'all'
                              ? 'Não há pedidos para o(s) evento(s) selecionado(s).'
                              : 'Selecione um evento para visualizar os pedidos ou aguarde novos pedidos serem criados.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(o => (
                    <tr key={o.id} className="hover:bg-[#F8F9FC] dark:hover:bg-[#1A1A1A] transition cursor-pointer" onClick={() => openOrder(o)} title="Ver detalhes do pedido">
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">#{o.code}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{(o as any).purchaserName || (o as any).purchaserEmail || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{o.eventName || 'Evento'}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatDate(o.createdAt)}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{o.participantsCount}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatMoney(o.totalAmount)} {refundIcon(o)}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          {renderPaymentBadge(o.paymentStatus)}
                          {o.refundStatus ? renderRefundBadge(o.refundStatus) : null}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-300 relative" data-row-menu onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setOpenMenuId(m => m === o.id ? null : o.id)} className="px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">⋮</button>
                        {openMenuId === o.id && (
                          <div className="absolute right-4 top-10 w-52 bg-white dark:bg-[#0b0b0b] rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 py-1" data-row-menu>
                            <button
                              onClick={() => { openOrder(o); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm dark:text-white"
                            >
                              Ver detalhes
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                if (!userId && !userEmail) return;
                                const params = new URLSearchParams();
                                if (userId) params.set('userId', userId);
                                else if (userEmail) params.set('userEmail', userEmail!);
                                if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                                fetch(`/api/orders/${o.id}/resend?${params.toString()}`, { method: 'POST' })
                                  .then(r => r.json())
                                  .then(d => {
                                    if (d.status === 'ok') alert(`E-mails enfileirados: ${d.queued}`);
                                    else alert(d.error || 'Falha ao reenviar');
                                  })
                                  .catch(() => alert('Erro de rede'));
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm dark:text-white"
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

            {/* Mobile Cards (Visible only on mobile) */}
            <div className="hidden max-md:flex flex-col gap-3 mt-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-[#121212] rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 h-32"></div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <img src={reportsSvg} alt="Nenhum pedido" className="w-24 h-24 mb-4 opacity-50 grayscale dark:invert" />
                  <div className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Nenhum pedido</div>
                </div>
              ) : (
                filtered.map(o => (
                  <div key={o.id} onClick={() => openOrder(o)} className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-[#1F1F1F] rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">#{o.code}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{(o as any).purchaserName || (o as any).purchaserEmail || 'Sem nome'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">{formatMoney(o.totalAmount)}</span>
                        {renderPaymentBadge(o.paymentStatus)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500">Evento</span>
                        <span className="font-medium truncate block max-w-[140px]">{o.eventName || 'Evento'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500">Data</span>
                        <span className="font-medium">{formatDate(o.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
              <div>
                Página {page + 1} de {totalPages} • {total} pedidos
              </div>
              <div className="flex gap-2">
                <button disabled={!canPrev} onClick={() => canPrev && setPage(p => p - 1)} className={`px-3 py-1 rounded-lg border text-sm font-medium ${canPrev ? 'bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-zinc-800' : 'opacity-40 cursor-not-allowed'}`}>Anterior</button>
                <button disabled={!canNext} onClick={() => canNext && setPage(p => p + 1)} className={`px-3 py-1 rounded-lg border text-sm font-medium ${canNext ? 'bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-zinc-800' : 'opacity-40 cursor-not-allowed'}`}>Próxima</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SelectEventModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onConfirm={handleSelectConfirm} />
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 max-md:p-0 max-md:items-end" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#0b0b0b] dark:text-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-md:h-full max-md:rounded-none flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-700 flex items-start justify-between gap-4 shrink-0">
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
            <div className="p-6 space-y-5 text-sm overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-0.5">Evento</span>
                  <span className="font-medium text-zinc-800 dark:text-white">{selected.eventName || 'Evento'}</span>
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
              {/* Extended purchase + event block */}
              {detail && (
                <div className="grid grid-cols-2 gap-4 bg-white/60 dark:bg-[#121212]/60 border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 text-[12px]">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Comprador</div>
                    <div className="font-medium text-zinc-800 dark:text-white">{detail.purchaserName || '-'}</div>
                    <div className="text-zinc-500 dark:text-slate-400 text-[11px]">{detail.purchaserEmail || ''}</div>
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
                    <div className="font-medium text-zinc-800">{new Date(detail.createdAt || selected.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Início do evento</div>
                    <div className="font-medium text-zinc-800">{detail.eventStartDate ? new Date(detail.eventStartDate).toLocaleString('pt-BR') : '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Local</div>
                    <div className="font-medium text-zinc-800">{detail.eventLocation || detail.eventLocationCity ? `${detail.eventLocation || ''}${detail.eventLocationCity ? ' - ' + detail.eventLocationCity : ''}${detail.eventLocationUf ? '/' + detail.eventLocationUf : ''}` : '-'}</div>
                  </div>
                </div>
              )}
              <div className="bg-zinc-50 dark:bg-[#0b0b0b] border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 text-[12px] leading-relaxed text-zinc-600 dark:text-slate-300 min-h-[120px]">
                {detailLoading && <div className="animate-pulse text-zinc-500">Carregando detalhes...</div>}
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
                  <div className="text-zinc-500 text-xs">Selecione um pedido para ver detalhes.</div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#0b0b0b] shrink-0">
              <div className="flex gap-2">
                <button
                  disabled={!detail || resendStatus === 'loading' || detail?.isStatic || detail?.paymentStatus !== 'PAID'}
                  onClick={() => {
                    if (!detail || (!userId && !userEmail)) return;
                    setResendStatus('loading');
                    setResendMessage('');
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId);
                    else if (userEmail) params.set('userEmail', userEmail!);
                    if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
                    fetch(`/api/orders/${detail.id}/resend?${params.toString()}`, { method: 'POST' })
                      .then(r => r.json())
                      .then(d => {
                        if (d.status === 'ok') { setResendStatus('success'); setResendMessage(`E-mails enfileirados: ${d.queued}`); }
                        else { setResendStatus('error'); setResendMessage(d.error || 'Falha ao reenviar'); }
                      })
                      .catch(() => { setResendStatus('error'); setResendMessage('Erro de rede'); })
                      .finally(() => setTimeout(() => setResendStatus('idle'), 4000));
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!detail || resendStatus === 'loading' || detail?.paymentStatus !== 'PAID' ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {resendStatus === 'loading' ? 'Reenviando...' : 'Reenviar ingressos'}
                </button>
                {resendMessage && (
                  <span className={`text-xs self-center ${resendStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{resendMessage}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  );
};

export default OrdersManager;
