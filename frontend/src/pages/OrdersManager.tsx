import React, { useEffect, useState, useMemo } from 'react';
import SelectEventModal from '@/components/SelectEventModal';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

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
          if (ev && ev.id) setEvents(prev => [ ...prev.filter(p=>p.id!==ev.id), { id: ev.id, name: ev.name || ev.title || ev.id }]);
        }
      } catch (e) {}
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
        setEvents(prev => [ ...prev.filter(p=>p.id!==selectedEvent.id), { id: selectedEvent.id, name: selectedEvent.name || selectedEvent.id }]);
      } else if (!events.find(ev => ev.id === firstId)) {
        // try to fetch the event name from the API as a fallback
        (async () => {
          try {
            const r = await fetch(`/api/events/${firstId}`);
            if (r.ok) {
              const ev = await r.json();
              if (ev && ev.id) setEvents(prev => [ ...prev.filter(p=>p.id!==ev.id), { id: ev.id, name: ev.name || ev.title || ev.id }]);
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
  const [resendStatus, setResendStatus] = useState<'idle'|'loading'|'success'|'error'>( 'idle');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [refundStatus, setRefundStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [refundMessage, setRefundMessage] = useState<string>('');
  const [events, setEvents] = useState<{id:string; name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTagsPanel, setShowTagsPanel] = useState(false);
  const tagsBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const tagsPanelRef = React.useRef<HTMLDivElement | null>(null);
  // single selected tag id (null = no tag selected)
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const tagOptions: { id: string; label: string; color: string }[] = [
    { id: 'ingresso', label: 'Ingresso', color: 'bg-amber-600' },
    { id: 'cortesia', label: 'Cortesia', color: 'bg-violet-600' },
    { id: 'doacao', label: 'Doação', color: 'bg-emerald-600' },
    { id: 'merch', label: 'Merchandising', color: 'bg-amber-500' },
    { id: 'promoter', label: 'Promoter', color: 'bg-rose-600' },
    { id: 'distribuidor', label: 'Distribuidor', color: 'bg-cyan-700' },
    { id: 'offline', label: 'Offline', color: 'bg-zinc-600' },
    { id: 'bilheteria', label: 'Bilheteria', color: 'bg-fuchsia-600' }
  ];
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
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{id:string; action:'cancel'|'reopen'|null}>({id:'', action:null});

  // --- Helpers & static data (were missing -> white screen due to ReferenceError) ---
  const skeletonRows = useMemo(() => Array.from({ length: 8 }), []);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return '—'; }
  };
  const formatMoney = (v: number) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return 'R$' + v.toFixed(2).replace('.', ',');
  };

  const renderRefundBadge = (status?: string | null) => {
    if (!status) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-zinc-100 text-zinc-500">—</span>;
    const styles: Record<string, {bg: string; text: string; border: string; label: string}> = {
      requested: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border border-indigo-200', label: 'Solicitado' },
      processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border border-amber-200', label: 'Processando' },
      refunded: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border border-emerald-200', label: 'Reembolsado' },
      rejected: { bg: 'bg-red-50', text: 'text-red-600', border: 'border border-red-200', label: 'Rejeitado' }
    };
    const st = styles[status] || { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border border-zinc-200', label: status };
    return <span title={status} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>;
  };

  const staticExamples: OrderRow[] = useMemo(() => [
    {
      id: 'static-1', code: 'EX001', eventId: 'evt-static-1', eventName: 'Festival de Teste',
      participantsCount: 3, totalAmount: 150, createdAt: new Date(Date.now() - 86400000).toISOString(), paymentStatus: 'PAID',
      refundStatus: 'requested', refundAmount: null, refundedAt: null
    },
    {
      id: 'static-2', code: 'EX002', eventId: 'evt-static-2', eventName: 'Conferência Live',
      participantsCount: 2, totalAmount: 200, createdAt: new Date(Date.now() - 3600*1000*5).toISOString(), paymentStatus: 'PENDING',
      refundStatus: 'processing', refundAmount: 50, refundedAt: null
    },
    {
      id: 'static-3', code: 'EX003', eventId: 'evt-static-3', eventName: 'Workshop Frontend',
      participantsCount: 1, totalAmount: 120, createdAt: new Date().toISOString(), paymentStatus: 'REFUNDED',
      refundStatus: 'refunded', refundAmount: 120, refundedAt: new Date().toISOString()
    },
    {
      id: 'static-4', code: 'EX004', eventId: 'evt-static-4', eventName: 'Meetup Comunidade',
      participantsCount: 4, totalAmount: 400, createdAt: new Date(Date.now() - 7200*1000).toISOString(), paymentStatus: 'CANCELED',
      refundStatus: 'rejected', refundAmount: 0, refundedAt: null
    }
  ], []);

  // Pagination helpers
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total]);
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  useEffect(() => { const h = setTimeout(()=> setDebounced(search), 350); return () => clearTimeout(h); }, [search]);

  useEffect(() => { (async () => { const { data } = await supabase.auth.getUser(); setUserId(data?.user?.id || null); setUserEmail(data?.user?.email || null); })(); }, []);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
  const qs = new URLSearchParams({ userId, limit: String(pageSize), offset: String(page * pageSize) });
      if (eventFilter !== 'all') qs.set('eventId', eventFilter);
  if (debounced) qs.set('search', debounced);
  if (statusFilter !== 'all') qs.set('paymentStatus', statusFilter);
  if (tagFilter) qs.set('tags', tagFilter);
      const r = await fetch(`/api/orders?${qs.toString()}`);
      const j = await r.json();
  setOrders(j.items || []);
  setTotal(j.total || 0);
      // events dropdown (lazy derive from orders first; fallback fetch by-user)
      const derived: {id:string; name:string}[] = Array.from(
        new Map<string, {id:string; name:string}>(
          (j.items || []).map((o: any) => [o.eventId, { id: o.eventId, name: o.eventName || 'Evento' }])
        ).values()
      );
      if (derived.length) setEvents(prev => (prev.length ? prev : derived));
      if (!derived.length) {
        try { const re = await fetch(`/api/events/by-user?userId=${userId}`); const list = await re.json(); if (Array.isArray(list)) setEvents(list.map((e:any)=>({ id:e.id, name:e.name })) ); } catch {}
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, debounced, eventFilter, page]);

  // Keep eventFilter in the URL so the view can be shared / reloaded with the same scope
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (eventFilter && eventFilter !== 'all') {
        params.set('eventId', eventFilter);
        params.set('eventIds', eventFilter);
      } else {
        params.delete('eventId');
        params.delete('eventIds');
      }
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      // ignore
    }
  }, [eventFilter]);

  // server summary removed (counts panel and server-side summary were intentionally removed)

  // Fetch audit logs when detail loads
  useEffect(()=> {
    if (!selected || !selected.id || selected.id.startsWith('static-') || !userId) { setLogs([]); return; }
    setLogsLoading(true);
    const qs = new URLSearchParams({ userId });
    fetch(`/api/orders/${selected.id}/logs?${qs.toString()}`)
      .then(r=> r.json())
      .then(l=> setLogs(Array.isArray(l)? l: []))
      .catch(()=> setLogs([]))
      .finally(()=> setLogsLoading(false));
  }, [selected, userId]);

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
    const map: Record<string, {label:string; classes:string}> = {
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
            tickets: [1,2,3].slice(0, o.participantsCount).map(i => ({ id: `t-${o.id}-${i}`, code: `${o.code}-TK${i}`, pricePaid: (o.totalAmount / o.participantsCount), createdAt: o.createdAt })),
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
    fetch(`/api/orders/${o.id}?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setDetailError(d.error === 'not authorized' ? 'Sem permissão para ver este pedido.' : d.error);
        } else {
          setDetail(d);
        }
      })
      .catch(() => setDetailError('Erro ao carregar detalhes'))
      .finally(() => setDetailLoading(false));
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

  // Close tags panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!showTagsPanel) return;
      if (tagsPanelRef.current && tagsPanelRef.current.contains(t)) return;
      if (tagsBtnRef.current && tagsBtnRef.current.contains(t as HTMLElement)) return;
      setShowTagsPanel(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [showTagsPanel]);

  const performRowAction = async (o: OrderRow, action: string) => {
    if ((action === 'cancel' || action === 'reopen') && !(pendingConfirm.id === o.id && pendingConfirm.action === action)) {
      setPendingConfirm({ id: o.id, action: action as any });
      return;
    }
    if (!userId) return;
    setRowActionLoading(action+o.id);
    const params = new URLSearchParams({ userId });
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
          setDetail((prev:any)=> prev ? { ...prev, paymentStatus: j.paymentStatus || prev.paymentStatus, refundStatus: j.refundStatus || prev.refundStatus, refundAmount: j.amount || prev.refundAmount } : prev);
        }
      }
    } catch {} finally {
      setRowActionLoading(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] dark:text-white flex justify-center items-start">{/* root layout */}
      <SidebarMenu activeKeyOverride="pedidos" />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-[100px]">{/* added bottom padding */}
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">{/* content area */}
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">Gerenciador de pedidos</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px] -mt-3 max-sm:text-sm">Gerencie todos os pedidos, incluindo edição de informações do comprador, reenvio de ingressos e processamento de reembolsos. Para baixar uma lista de pedidos, visualize o Relatório de pedidos.</p>
          {/* Top row: Actions on left, event selector, search on right */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowActionsMenu(s => !s)} className="px-3 py-2 rounded-lg border bg-white dark:bg-[#121212]">Ações ▾</button>
                {showActionsMenu && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#0b0b0b] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-40 p-2 text-sm">
                    <ul className="divide-y divide-zinc-100">
                      <li>
                        <button onClick={() => {
                          const params = new URLSearchParams(); if (userId) params.set('userId', userId); if (debounced) params.set('search', debounced); if (selectedEventIds && selectedEventIds.length) { params.set('eventIds', selectedEventIds.join(',')); params.set('eventId', selectedEventIds[0]); } else if (eventFilter !== 'all') params.set('eventId', eventFilter); if (tagFilter) params.set('tags', tagFilter); params.set('valid','1'); const url = `/api/orders/export?${params.toString()}`; window.location.href = url;
                        }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 rounded">Baixar pedidos válidos (.csv)<div className="text-xs text-zinc-400">Somente pedidos válidos</div></button>
                      </li>
                      <li>
                        <button onClick={() => {
                          const params = new URLSearchParams(); if (userId) params.set('userId', userId); if (debounced) params.set('search', debounced); if (selectedEventIds && selectedEventIds.length) { params.set('eventIds', selectedEventIds.join(',')); params.set('eventId', selectedEventIds[0]); } else if (eventFilter !== 'all') params.set('eventId', eventFilter); if (tagFilter) params.set('tags', tagFilter); const url = `/api/orders/export?${params.toString()}`; window.location.href = url;
                        }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 rounded">Baixar todos os pedidos (.csv)<div className="text-xs text-zinc-400">Incluir pedidos reembolsados</div></button>
                      </li>
                      <li>
                        <button onClick={() => { setShowSelectModal(true); setShowActionsMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 rounded">Selecione com uma lista<div className="text-xs text-zinc-400">ex: Encontrar e reembolsar usando uma lista</div></button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Event selector aligned with actions */}
              <div className="flex items-center gap-2">
                <div className="h-[40px] px-3 rounded-lg border bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:text-white flex items-center">
                  {eventFilter === 'all' ? 'Todos eventos' : (events.find(ev => ev.id === eventFilter)?.name || eventFilter)}
                </div>
                <button onClick={()=> setShowSelectModal(true)} title="Selecionar eventos" className="h-[40px] px-3 rounded-lg border border-[#E5E7EB] bg-white dark:bg-[#121212] dark:border-[#2b2b2b] text-sm">Selecionar</button>
                {eventFilter !== 'all' && (
                  <button onClick={() => { setEventFilter('all'); setPage(0);} } className="h-9 px-3 rounded-full border border-zinc-200 text-sm">Limpar</button>
                )}
              </div>
            </div>

            <div className="flex-1" />

            <div className="min-w-[300px]">
              <input
                className="w-full h-[54px] px-5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-indigo-200 text-[15px] bg-white dark:bg-[#121212] dark:border-[#2b2b2b] dark:placeholder:text-slate-400 dark:text-white"
                placeholder="Pesquisar por número de pedido, código de sequência..."
                value={search}
                onChange={e=>{ setSearch(e.target.value); setPage(0); }}
              />
            </div>
          </div>

          {/* Duplicate filters row removed - event selector is in the top row and tags panel is triggered from the table header. */}
          {/* Payment summary removed as requested */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm mt-3">
            <table className="w-full text-left">
              <thead className="bg-[#F6F7FB] dark:bg-[#0b0b0b] text-slate-600 dark:text-slate-300 text-xs font-medium tracking-wide">
                <tr>
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Comprador</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Ingressos</th>
                  <th className="py-4 px-6">Preço</th>
                  <th className="py-4 px-6">Tags <button ref={tagsBtnRef} onClick={() => setShowTagsPanel(s=>!s)} className="ml-2 text-xs px-2 py-1 rounded border">Filtrar</button></th>
                  <th className="py-4 px-6 text-right">Ingresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[13px]">
              {loading ? (
                skeletonRows.map((_,i)=>(
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-700 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <>
                  {staticExamples.map(o => (
                    <tr key={o.id} className="bg-indigo-50/40 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/20 hover:bg-indigo-50 transition cursor-pointer" onClick={()=> openOrder(o)} title="Ver detalhes do exemplo">
                      <td className="py-4 px-6 text-indigo-600 dark:text-indigo-300 font-semibold underline">#{o.code}<span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white align-middle">exemplo</span></td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">—</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatDate(o.createdAt)}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{o.participantsCount}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatMoney(o.totalAmount)}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">—</td>
                      <td className="py-4 px-6 text-right text-slate-400 dark:text-slate-300">—</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={7} className="py-6 px-6 text-center text-[12px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800">
                      Exibindo exemplos estáticos porque nenhum pedido real foi retornado. Gere pedidos ou integre o backend para vê-los aqui.
                    </td>
                  </tr>
                </>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-[#F8F9FC] dark:hover:bg-[#0f0f0f] transition cursor-pointer" onClick={() => openOrder(o)} title="Ver detalhes do pedido">
                  <td className="py-4 px-6 text-indigo-600 dark:text-indigo-300 font-semibold underline">#{o.code}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{(o as any).purchaserName || (o as any).purchaserEmail || '—'}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatDate(o.createdAt)}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{o.participantsCount}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{formatMoney(o.totalAmount)} {refundIcon(o)}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                    {(() => {
                      const tags = Array.isArray((o as any).tags) ? (o as any).tags : typeof (o as any).tags === 'string' && (o as any).tags ? (o as any).tags.split(',') : [];
                      if (!tags.length) return <span className="text-zinc-400">—</span>;
                      return <div className="flex flex-wrap gap-2">{tags.slice(0,3).map((t:any,idx:number)=>(<span key={idx} className="text-[12px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700">{t}</span>))}</div>;
                    })()}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-300 relative" data-row-menu onClick={(e)=> e.stopPropagation()}>
                    <button onClick={()=> setOpenMenuId(m=> m===o.id? null : o.id)} className="px-2 py-1 rounded-lg hover:bg-zinc-100">⋮</button>
                    {openMenuId === o.id && (
                      <div className="absolute right-4 top-10 w-48 bg-white dark:bg-[#0b0b0b] rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 p-1 text-[12px]" data-row-menu>
                        <ul className="divide-y divide-zinc-100">
                          <li>
                            <button disabled={['PAID','REFUNDED'].includes(o.paymentStatus||'')} onClick={()=> performRowAction(o,'pay')} className="w-full text-left px-3 py-2 disabled:opacity-40 hover:bg-zinc-50 rounded-lg">Marcar como pago</button>
                          </li>
                          <li className="relative">
                            {pendingConfirm.id === o.id && pendingConfirm.action === 'cancel' ? (
                              <div className="flex flex-col gap-1 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                                <span className="text-[11px] text-red-600">Confirmar cancelamento?</span>
                                <div className="flex gap-2">
                                  <button onClick={()=> performRowAction(o,'cancel')} className="px-2 py-1 text-[11px] rounded bg-red-600 text-white">Sim</button>
                                  <button onClick={()=> setPendingConfirm({id:'',action:null})} className="px-2 py-1 text-[11px] rounded bg-white border">Não</button>
                                </div>
                              </div>
                            ) : (
                              <button disabled={['CANCELED','REFUNDED'].includes(o.paymentStatus||'')} onClick={()=> performRowAction(o,'cancel')} className="w-full text-left px-3 py-2 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                            )}
                          </li>
                          <li>
                            {pendingConfirm.id === o.id && pendingConfirm.action === 'reopen' ? (
                              <div className="flex flex-col gap-1 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                <span className="text-[11px] text-indigo-700">Reabrir pedido?</span>
                                <div className="flex gap-2">
                                  <button onClick={()=> performRowAction(o,'reopen')} className="px-2 py-1 text-[11px] rounded bg-indigo-600 text-white">Sim</button>
                                  <button onClick={()=> setPendingConfirm({id:'',action:null})} className="px-2 py-1 text-[11px] rounded bg-white border">Não</button>
                                </div>
                              </div>
                              ) : (
                              <button disabled={(o.paymentStatus!=='CANCELED')} onClick={()=> performRowAction(o,'reopen')} className="w-full text-left px-3 py-2 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">Reabrir</button>
                            )}
                          </li>
                          <li>
                            <button disabled={!!o.refundStatus} onClick={()=> performRowAction(o,'refund')} className="w-full text-left px-3 py-2 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">Iniciar reembolso</button>
                          </li>
                          <li>
                            <button disabled={o.refundStatus!=='processing'} onClick={()=> performRowAction(o,'refund-complete')} className="w-full text-left px-3 py-2 disabled:opacity-40 hover:bg-zinc-50 rounded-lg">Concluir reembolso</button>
                          </li>
                          <li>
                            <button onClick={()=> performRowAction(o,'resend')} className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">Reenviar ingressos</button>
                          </li>
                        </ul>
                        {rowActionLoading?.endsWith(o.id) && <div className="mt-1 text-[11px] text-zinc-400 px-2 pb-1">Processando...</div>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            {showTagsPanel && (
              <div ref={tagsPanelRef} className="absolute top-14 right-6 z-50 w-72 bg-white dark:bg-[#0b0b0b] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3">
                <div className="text-sm font-medium mb-2">Filtrar tags</div>
                <div className="flex flex-col gap-3 max-h-40 overflow-auto mb-3">
                  {tagOptions.map(t => (
                    <label key={t.id} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tags-filter"
                        checked={tagFilter === t.id}
                        onChange={() => { setTagFilter(t.id); setPage(0); }}
                        className="w-4 h-4"
                      />
                      <span className={`text-[13px] px-2 py-0.5 rounded-full ${t.color} text-white`}>{t.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setTagFilter(null); setShowTagsPanel(false); }} className="px-3 py-1 rounded-lg border text-sm">Limpar</button>
                  <button onClick={() => setShowTagsPanel(false)} className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm">OK</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
            <div>
              Página {page + 1} de {totalPages} • {total} pedidos
            </div>
            <div className="flex gap-2">
              <button disabled={!canPrev} onClick={()=> canPrev && setPage(p=>p-1)} className={`px-3 py-1 rounded-lg border text-sm font-medium ${canPrev ? 'bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-zinc-800' : 'opacity-40 cursor-not-allowed'}`}>Anterior</button>
              <button disabled={!canNext} onClick={()=> canNext && setPage(p=>p+1)} className={`px-3 py-1 rounded-lg border text-sm font-medium ${canNext ? 'bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-zinc-800' : 'opacity-40 cursor-not-allowed'}`}>Próxima</button>
            </div>
          </div>
        </div>
  </div>
  <SelectEventModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onConfirm={handleSelectConfirm} />
    {selected && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={()=>setSelected(null)}>
        <div className="bg-white dark:bg-[#0b0b0b] dark:text-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-700 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pedido #{selected.code}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Criado em {new Date(selected.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <button onClick={()=>setSelected(null)} className="text-zinc-400 dark:text-slate-400 hover:text-zinc-600 transition" aria-label="Fechar">✕</button>
          </div>
          <div className="p-6 space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
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
                  <div className="font-medium text-zinc-800 dark:text-white">{detail.purchaserName || '—'}</div>
                  <div className="text-zinc-500 dark:text-slate-400 text-[11px]">{detail.purchaserEmail || ''}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Pagamento</div>
                  <div className="font-medium text-zinc-800 dark:text-white">{detail.paymentMethod || 'PIX'}</div>
                  {detail.refundStatus && (
                    <div className="mt-1 text-[11px] text-amber-700 font-medium">Reembolso: {detail.refundStatus}{detail.refundAmount ? ` (R$${detail.refundAmount.toFixed(2).replace('.',',')})` : ''}</div>
                  )}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Data do pedido</div>
                  <div className="font-medium text-zinc-800">{new Date(detail.createdAt || selected.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Início do evento</div>
                  <div className="font-medium text-zinc-800">{detail.eventStartDate ? new Date(detail.eventStartDate).toLocaleString('pt-BR') : '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Local</div>
                  <div className="font-medium text-zinc-800">{detail.eventLocation || detail.eventLocationCity ? `${detail.eventLocation || ''}${detail.eventLocationCity ? ' - '+detail.eventLocationCity : ''}${detail.eventLocationUf ? '/' + detail.eventLocationUf : ''}` : '—'}</div>
                </div>
              </div>
            )}
              <div className="bg-zinc-50 dark:bg-[#0b0b0b] border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 text-[12px] leading-relaxed text-zinc-600 dark:text-slate-300 min-h-[120px]">
              {detailLoading && <div className="animate-pulse text-zinc-500">Carregando detalhes…</div>}
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
                        {detail.tickets?.map((t:any)=> (
                          <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-700">
                            <td className="py-1 pr-4 font-mono text-indigo-600 dark:text-indigo-300">{t.code}</td>
                            <td className="py-1 pr-4 text-zinc-700 dark:text-slate-300">{t.userEmail || '—'}</td>
                            <td className="py-1 pr-4 text-zinc-700 dark:text-slate-300">{t.ticketTypeName || 'Pista'}</td>
                            <td className="py-1 pr-2 text-right text-zinc-700 dark:text-slate-300">{t.pricePaid ? 'R$'+t.pricePaid.toFixed(2).replace('.',',') : '—'}</td>
                          </tr>
                        ))}
                        {(!detail.tickets || detail.tickets.length===0) && <tr><td colSpan={4} className="py-2 text-zinc-500">Sem tickets</td></tr>}
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
          <div className="px-6 py-4 border-t border-zinc-100 flex flex-col gap-3 bg-zinc-50/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  disabled={!detail || resendStatus==='loading' || detail?.isStatic}
                  onClick={() => {
                    if (!detail || !userId) return;
                    setResendStatus('loading');
                    setResendMessage('');
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId);
                    else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/resend?${params.toString()}`, { method: 'POST' })
                      .then(r=>r.json())
                      .then(d=> {
                        if (d.status==='ok') { setResendStatus('success'); setResendMessage(`E-mails enfileirados: ${d.queued}`); }
                        else { setResendStatus('error'); setResendMessage(d.error || 'Falha ao reenviar'); }
                      })
                      .catch(()=> { setResendStatus('error'); setResendMessage('Erro de rede'); })
                      .finally(()=> setTimeout(()=> setResendStatus('idle'), 4000));
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${!detail || resendStatus==='loading' ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 bg-white'}`}
                >
                  {resendStatus==='loading' ? 'Reenviando…' : 'Reenviar ingressos'}
                </button>
                {/* Payment actions */}
                <button
                  disabled={!detail || detail?.isStatic || !detail || (detail.paymentStatus && ['PAID','REFUNDED'].includes(detail.paymentStatus))}
                  onClick={() => {
                    if (!detail || !userId) return;
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId); else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/pay?${params.toString()}`, { method: 'POST' })
                      .then(r=> r.json())
                      .then(d=> { if (d.status==='ok') setDetail((prev:any)=> prev ? { ...prev, paymentStatus: d.paymentStatus } : prev); })
                      .catch(()=>{})
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${(!detail || detail?.isStatic || (detail.paymentStatus && ['PAID','REFUNDED'].includes(detail.paymentStatus))) ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white'}`}
                >
                  {detail?.paymentStatus === 'PAID' ? 'Pago' : detail?.paymentStatus === 'REFUNDED' ? 'Reembolsado' : 'Marcar como pago'}
                </button>
                <button
                  disabled={!detail || detail?.isStatic || (detail.paymentStatus && ['CANCELED','REFUNDED'].includes(detail.paymentStatus))}
                  onClick={() => {
                    if (!detail || !userId) return;
                    if (!confirm('Cancelar este pedido?')) return;
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId); else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/cancel?${params.toString()}`, { method: 'POST' })
                      .then(r=> r.json())
                      .then(d=> { if (d.status==='ok') setDetail((prev:any)=> prev ? { ...prev, paymentStatus: d.paymentStatus } : prev); })
                      .catch(()=>{})
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${(!detail || detail?.isStatic || (detail.paymentStatus && ['CANCELED','REFUNDED'].includes(detail.paymentStatus))) ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-red-300 text-red-600 hover:bg-red-50 bg-white'}`}
                >
                  {detail?.paymentStatus === 'CANCELED' ? 'Cancelado' : 'Cancelar'}
                </button>
                <button
                  disabled={!detail || detail?.isStatic || refundStatus==='loading' || (detail && detail.refundStatus && ['processing','refunded'].includes(detail.refundStatus))}
                  onClick={() => {
                    if (!detail || !userId) return;
                    if (!confirm('Iniciar processo de reembolso?')) return;
                    setRefundStatus('loading');
                    setRefundMessage('');
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId);
                    else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/refund?${params.toString()}`, { method: 'POST' })
                      .then(r=> r.json())
                      .then(d=> {
                        if (d.status==='ok') {
                          setRefundStatus('success');
                          setRefundMessage('Reembolso iniciado (status: processing).');
                          setDetail((prev:any)=> prev ? { ...prev, refundStatus: d.refundStatus, refundAmount: d.amount } : prev);
                        } else {
                          setRefundStatus('error');
                          setRefundMessage(d.error || 'Falha ao iniciar reembolso');
                        }
                      })
                      .catch(()=> { setRefundStatus('error'); setRefundMessage('Erro de rede'); })
                      .finally(()=> setTimeout(()=> setRefundStatus('idle'), 4000));
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${(!detail || refundStatus==='loading' || (detail && detail.refundStatus && ['processing','refunded'].includes(detail.refundStatus))) ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-amber-300 text-amber-700 hover:bg-amber-50 bg-white'}`}
                >
                  {refundStatus==='loading' ? 'Iniciando…' : detail?.refundStatus ? (
                    detail.refundStatus === 'refunded' ? 'Reembolsado' : detail.refundStatus === 'processing' ? 'Em processamento' : 'Reembolso'
                  ) : 'Iniciar reembolso'}
                </button>
                <button
                  disabled={!detail || detail?.isStatic || detail?.refundStatus !== 'processing'}
                  onClick={() => {
                    if (!detail || !userId) return;
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId); else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/refund/complete?${params.toString()}`, { method: 'POST' })
                      .then(r=> r.json())
                      .then(d=> { if (d.status==='ok') setDetail((prev:any)=> prev ? { ...prev, refundStatus: d.refundStatus, paymentStatus: d.paymentStatus, refundAmount: d.amount, refundedAt: new Date().toISOString() } : prev); })
                      .catch(()=>{})
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${( !detail || detail?.isStatic || detail?.refundStatus !== 'processing') ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white'}`}
                >
                  Concluir reembolso
                </button>
                <button
                  disabled={!detail || detail?.isStatic || detail?.paymentStatus !== 'CANCELED'}
                  onClick={() => {
                    if (!detail || !userId) return;
                    const params = new URLSearchParams();
                    if (userId) params.set('userId', userId); else if (userEmail) params.set('userEmail', userEmail!);
                    fetch(`/api/orders/${detail.id}/reopen?${params.toString()}`, { method: 'POST' })
                      .then(r=> r.json())
                      .then(d=> { if (d.status==='ok') setDetail((prev:any)=> prev ? { ...prev, paymentStatus: d.paymentStatus } : prev); })
                      .catch(()=>{})
                  }}
                  className={`px-3 h-9 rounded-lg text-[12px] font-medium border transition ${( !detail || detail?.isStatic || detail?.paymentStatus !== 'CANCELED') ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-white' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 bg-white'}`}
                >
                  Reabrir
                </button>
              </div>
              <button onClick={()=>{setSelected(null); setDetail(null);}} className="px-4 h-10 rounded-lg text-sm font-medium bg-white border border-zinc-200 hover:bg-zinc-50">Fechar</button>
            </div>
            {resendStatus !== 'idle' && resendMessage && (
              <div className={`text-[12px] px-3 py-2 rounded-lg border ${resendStatus==='success' ? 'bg-green-50 border-green-200 text-green-700' : resendStatus==='error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>{resendMessage}</div>
            )}
            {refundStatus !== 'idle' && refundMessage && (
              <div className={`text-[12px] px-3 py-2 rounded-lg border ${refundStatus==='success' ? 'bg-amber-50 border-amber-200 text-amber-800' : refundStatus==='error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>{refundMessage}</div>
            )}
            {detail?.isStatic && (
              <div className="text-[11px] text-indigo-600">Exemplo estático: ações desabilitadas.</div>
            )}
            {detail?.refundStatus && !detail?.isStatic && (
              <div className="text-[11px] text-zinc-500">Status de reembolso: <span className="font-medium text-zinc-700">{detail.refundStatus}</span>{detail.refundAmount ? ` • Valor: R$${detail.refundAmount.toFixed(2).replace('.',',')}` : ''}</div>
            )}
            {/* Audit log timeline */}
            {selected && (
              <div className="max-h-48 overflow-auto border border-zinc-100 rounded-lg p-3 bg-white/60">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">Histórico</div>
                {logsLoading && <div className="text-[12px] text-zinc-500">Carregando...</div>}
                {!logsLoading && logs.length===0 && <div className="text-[12px] text-zinc-400">Sem eventos.</div>}
                <ul className="space-y-1 text-[11px]">
                  {logs.map(l => (
                    <li key={l.id} className="flex items-start gap-2">
                      <span className="text-zinc-400 font-mono tabular-nums">{new Date(l.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                      <span className="text-zinc-700 font-medium">{l.action}</span>
                      {l.detail && <span className="text-zinc-500 truncate max-w-[180px]">{l.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default OrdersManager;
