import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/apiBase';
import { Ticket, TrendingUp, MoreHorizontal } from 'lucide-react';

type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'amount';
  amount: number;
  maxUses: number | null;
  used?: number;
  startDate?: string | null;
  endDate?: string | null;
  eventId?: string | null;
  active?: boolean;
  orders?: {
    totalAmount: number;
    discountAmount: number;
    participantsCount: number;
  }[];
  totalRevenue?: number;
  totalDiscount?: number;
  limitCategories?: string[];
  limitTicketTypes?: string[];
};

type NewCoupon = {
  code: string;
  type: 'percent' | 'amount';
  amount: number;
  maxUses: number | null;
  startDate: string | null;
  endDate: string | null;
  eventId: string | null;
  limitCategories: string[];
  limitTicketTypes: string[];
};

const emptyNewCoupon: NewCoupon = {
  code: '',
  type: 'percent',
  amount: 0,
  maxUses: null,
  startDate: null,
  endDate: null,
  eventId: null,
  limitCategories: [],
  limitTicketTypes: [],
};

export default function MarketingTools() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { totalLeft } = useLayoutOffsets();

  // Event context state
  const [eventName, setEventName] = useState('Nome do evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [ticketCategories, setTicketCategories] = useState<any[]>([]);

  // Mobile menu states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);

  // Load event info
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const res = await fetchApi(`/api/event/${id}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Nome do evento');
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
  }, [id]);

  // Load ticket types (layout dependency)
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchApi(`/api/ticket-type/event/${id}`);
        if (res?.ok && mounted) {
          const data = await res.json();
          setTicketTypes(Array.isArray(data) ? data : []);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Load ticket categories
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchApi(`/api/ticket-category/event/${id}`);
        if (res?.ok && mounted) {
          const data = await res.json();
          setTicketCategories(Array.isArray(data) ? data : []);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, [id]);

  const pushToast = (message: string, kind?: 'success' | 'error' | 'info') => {
    toast({
      title: kind === 'error' ? 'Erro' : kind === 'success' ? 'Sucesso' : 'Aviso',
      description: message,
      variant: (kind === 'error' ? 'destructive' : 'default') as any,
    });
  };

  const [tab, setTab] = React.useState<'coupons'>('coupons');
  const [loading, setLoading] = React.useState(false);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<NewCoupon>({ ...emptyNewCoupon });
  const [editingCouponId, setEditingCouponId] = React.useState<string | null>(null);
  const [codeStatus, setCodeStatus] = React.useState<'idle' | 'ok' | 'error'>('idle');

  const loadCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = id ? `/api/coupons?eventId=${id}` : '/api/coupons';
      const r = await fetchApi(url);
      if (!r.ok) throw new Error('Falha ao buscar cupons');
      const data = await r.json();
      const raw: any[] = Array.isArray(data)
        ? data
        : (data?.items || data?.data || data?.rows || []);
      const mapped: Coupon[] = raw.map((c: any) => {
        const orders = Array.isArray(c.orders) ? c.orders : [];
        const totalRevenue = orders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);
        const totalDiscount = orders.reduce((acc: number, o: any) => acc + (Number(o.discountAmount) || 0), 0);

        return {
          id: String(c.id),
          code: String(c.code || ''),
          type: String(c.type).toUpperCase() === 'PERCENT' ? 'percent' : 'amount',
          amount: Number(c.value ?? c.amount ?? 0),
          maxUses: c.maxUses ?? null,
          used: c.used ?? 0,
          startDate: c.startsAt ?? c.startDate ?? null,
          endDate: c.endsAt ?? c.endDate ?? null,
          eventId: c.eventId ?? null,
          active: (c.status ?? 'ACTIVE') === 'ACTIVE',
          orders,
          totalRevenue,
          totalDiscount,
          limitCategories: c.limitCategories || [],
          limitTicketTypes: c.limitTicketTypes || [],
        };
      });
      setCoupons(mapped);
    } catch (e) {
      pushToast('Não foi possível carregar os cupons', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadCoupons().catch(() => { });
  }, [loadCoupons]);

  // Calculate global stats
  const { globalSold, globalCost, globalRevenue } = useMemo(() => {
    let sold = 0;
    let cost = 0;
    let rev = 0;
    for (const c of coupons) {
      for (const o of (c.orders || [])) {
        sold += Number(o.participantsCount) || 0;
        cost += Number(o.discountAmount) || 0;
        rev += Number(o.totalAmount) || 0;
      }
    }
    return { globalSold: sold, globalCost: cost, globalRevenue: rev };
  }, [coupons]);

  // Set default eventId in form when opening dialog
  useEffect(() => {
    if (createOpen && id) {
      setForm(f => ({ ...f, eventId: id }));
    }
  }, [createOpen, id]);

  const onChangeCode = (v: string) => {
    const norm = v
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setForm((f) => ({ ...f, code: norm }));
    if (!norm) setCodeStatus('idle');
    else if (/^[A-Z0-9-]{3,}$/.test(norm)) setCodeStatus('ok');
    else setCodeStatus('error');
  };

  const submitCoupon = async () => {
    try {
      if (!form.code.trim()) {
        pushToast('Informe o código do cupom', 'error');
        return;
      }
      if (!form.eventId && !id) {
        pushToast('Selecione ou informe o evento do cupom', 'error');
        return;
      }
      const payload: any = {
        eventId: form.eventId || id,
        code: form.code.trim().toUpperCase(),
        type: form.type === 'percent' ? 'PERCENT' : 'FIXED',
        value: Number(form.amount) || 0,
        maxUses: form.maxUses ?? null,
        startsAt: form.startDate || null,
        endsAt: form.endDate || null,
        limitCategories: form.limitCategories || [],
        limitTicketTypes: form.limitTicketTypes || [],
      };

      const isEditing = !!editingCouponId;
      const url = isEditing ? `/api/coupons/${editingCouponId}` : '/api/coupons';
      const method = isEditing ? 'PUT' : 'POST';

      const r = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        pushToast(`Falha ao ${isEditing ? 'atualizar' : 'criar'} o cupom` + (t ? `: ${t}` : ''), 'error');
        return;
      }
      pushToast(`Cupom ${isEditing ? 'atualizado' : 'criado'} com sucesso`, 'success');
      setCreateOpen(false);
      setForm({ ...emptyNewCoupon });
      setEditingCouponId(null);
      await loadCoupons();
    } catch (e) {
      pushToast('Erro ao criar o cupom', 'error');
    }
  };


  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.active ? 'INACTIVE' : 'ACTIVE';
      const r = await fetchApi(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!r.ok) throw new Error('Falha ao atualizar status');

      pushToast(`Cupom ${newStatus === 'ACTIVE' ? 'ativado' : 'pausado'} com sucesso`, 'success');
      loadCoupons();
    } catch (e) {
      pushToast('Erro ao alterar status do cupom', 'error');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    const dStart = coupon.startDate ? new Date(coupon.startDate) : null;
    if (dStart) dStart.setMinutes(dStart.getMinutes() - dStart.getTimezoneOffset());

    const dEnd = coupon.endDate ? new Date(coupon.endDate) : null;
    if (dEnd) dEnd.setMinutes(dEnd.getMinutes() - dEnd.getTimezoneOffset());

    setForm({
      eventId: coupon.eventId || id || '',
      code: coupon.code,
      type: coupon.type as 'percent' | 'amount',
      amount: coupon.amount,
      maxUses: coupon.maxUses,
      startDate: dStart ? dStart.toISOString().slice(0, 16) : '',
      endDate: dEnd ? dEnd.toISOString().slice(0, 16) : '',
      limitCategories: coupon.limitCategories || [],
      limitTicketTypes: coupon.limitTicketTypes || [],
    });

    setEditingCouponId(coupon.id);
    setCreateOpen(true);
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      const r = await fetchApi(`/api/coupons/${couponId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setCoupons((cs) => cs.filter((c) => c.id !== couponId));
      pushToast('Cupom excluído', 'success');
    } catch {
      pushToast('Falha ao excluir o cupom', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      {/* Mobile Menus */}
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
        title="Cupons"
      />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={id || ''}
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <SidebarMenu className="max-md:hidden" />
      {id && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventName={eventName}
            eventDate={eventDate}
            eventStatus={eventStatus}
            onBack={() => navigate(-1)}
            onStatusChange={() => { }}
            onViewEvent={() => { if (id) navigate(`/event/${id}`); }}
            eventIdOverride={id || null}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
          />
        </div>
      )}
      <AppHeader />

      <OrganizerLayout>
        <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 max-md:pl-4 pr-8 max-md:pr-4 pb-16 max-md:pb-8 relative">
          <div className="mt-24 max-md:mt-[140px] max-w-[800px] mx-auto max-md:max-w-full">
            <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-3 max-md:hidden">
              <h1 className="text-3xl max-sm:text-xl font-bold text-indigo-950 dark:text-white mb-3 max-sm:mb-0">Cupons de Desconto</h1>
              <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 max-sm:w-full max-sm:text-sm">Novo cupom</Button>
            </div>

            {/* Botão mobile only */}
            <div className="hidden max-md:block mb-4">
              <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 w-full text-sm">Novo cupom</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-center min-h-[100px]">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <Ticket className="w-4 h-4 text-zinc-400" />
                  Ingressos Vendidos
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {globalSold}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-center min-h-[100px]">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <div className="w-4 h-4 flex items-center justify-center rounded-full border border-zinc-400 text-[10px] text-zinc-500">€</div>
                  Custo Total
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  R$ {globalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-center min-h-[100px]">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  Receita
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  R$ {globalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                CUPONS ({coupons.length})
              </div>

            </div>
            <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212]">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando...</div>
              ) : coupons.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-900 dark:text-white text-[18px] font-semibold">Nenhum cupom criado</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[14px] mt-1">Crie seu primeiro cupom para oferecer descontos.</div>
                  <div className="mt-4">
                    <Button onClick={() => setCreateOpen(true)}>Criar cupom</Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {coupons.map((c) => {
                    const active = c.active ?? true;
                    // Format usages
                    const usesText = c.maxUses ? `${c.used || 0}/${c.maxUses}` : `${c.used || 0}/∞`;
                    const usagePercent = c.maxUses ? Math.min(100, ((c.used || 0) / c.maxUses) * 100) : 0;

                    // Format valid dates
                    let dateText = '';
                    if (c.startDate && c.endDate) {
                      dateText = `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`;
                    } else if (c.endDate) {
                      dateText = `Até ${new Date(c.endDate).toLocaleDateString()}`;
                    } else if (c.startDate) {
                      dateText = `A partir de ${new Date(c.startDate).toLocaleDateString()}`;
                    } else {
                      dateText = 'Prazo indeterminado';
                    }

                    const UsageBar = () => (
                      <div className="flex flex-col items-end min-w-[100px]">
                        <div className="text-[10px] font-medium text-zinc-400 mb-1">Todos os ingressos</div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-600 rounded-full"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{usesText}</span>
                        </div>
                      </div>
                    );

                    const Financials = () => (
                      <>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <div className="text-[10px] font-medium text-zinc-400 mb-0.5">Custo</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            R$ {(c.totalDiscount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <div className="text-[10px] font-medium text-zinc-400 mb-0.5">Receita</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            R$ {(c.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </>
                    );

                    const ActionButton = () => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(c)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(c)}>
                            {active ? 'Pausar' : 'Reativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteCoupon(c.id)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );

                    return (
                      <React.Fragment key={c.id}>
                        {/* Desktop Row */}
                        <div className="hidden md:flex p-5 items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-[#191919] transition">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[16px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">{c.code}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                {active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                {c.type === 'percent' ? `${c.amount}% OFF` : `R$ ${Number(c.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} OFF`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Ticket className="w-3 h-3" /> {usesText} usos
                              </span>
                              <span>📅 {dateText}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 justify-end">
                            <UsageBar />
                            <Financials />
                            <ActionButton />
                          </div>
                        </div>

                        {/* Mobile Card */}
                        <div className="md:hidden p-4 flex flex-col gap-3 relative border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-[#191919]">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-900 dark:text-white uppercase">{c.code}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                  {active ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {c.type === 'percent' ? `${c.amount}% OFF` : `R$ ${Number(c.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} OFF`}
                              </span>
                            </div>
                            <ActionButton />
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Usos</div>
                              <div className="text-sm text-slate-700 dark:text-slate-300 font-mono">{usesText}</div>
                              <div className="mt-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${usagePercent}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Receita</div>
                              <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">R$ {(c.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>📅</span>
                            {dateText}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </OrganizerLayout>

      {/* Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px] dark:bg-[#1b1b1b] dark:border-[#1F1F1F]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{editingCouponId ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2">
              <Label htmlFor="code" className="dark:text-slate-200">Código</Label>
              <Input id="code" value={form.code} onChange={(e) => onChangeCode(e.target.value)} placeholder="EXEMPLO10" className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white dark:placeholder:text-slate-500" />
              {form.code && (
                <div className={`mt-1 text-sm ${codeStatus === 'error' ? 'text-red-600 dark:text-red-400' : codeStatus === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {codeStatus === 'ok' ? 'Código válido' : codeStatus === 'error' ? 'Use letras, números ou hífen (mín. 3)' : 'O código aparecerá em maiúsculas'}
                </div>
              )}
            </div>

            <div>
              <Label className="dark:text-slate-200">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as 'percent' | 'amount' }))}>
                <SelectTrigger className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1b1b1b] dark:border-[#1F1F1F]">
                  <SelectItem value="percent" className="dark:text-white dark:hover:bg-[#242424]">Percentual (%)</SelectItem>
                  <SelectItem value="amount" className="dark:text-white dark:hover:bg-[#242424]">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="dark:text-slate-200">{form.type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}</Label>
              <Input
                type="number"
                value={String(form.amount)}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                min={0}
                className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white"
              />
            </div>

            <div>
              <Label className="dark:text-slate-200">Usos máximos</Label>
              <Input
                type="number"
                value={form.maxUses == null ? '' : String(form.maxUses)}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setForm((f) => ({ ...f, maxUses: v === '' ? null : Math.max(0, Number(v)) }));
                }}
                placeholder="Ilimitado"
                className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="dark:text-slate-200">Início</Label>
              <Input type="datetime-local" value={form.startDate || ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))} className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white" />
            </div>

            <div>
              <Label className="dark:text-slate-200">Fim</Label>
              <Input type="datetime-local" value={form.endDate || ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))} className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white" />
            </div>

            {/* Restriction selectors - only show if we have categories or ticket types */}
            {(ticketCategories.length > 0 || ticketTypes.length > 0) && (
              <div className="sm:col-span-2 space-y-3 p-3 bg-slate-50 dark:bg-[#1b1b1b] rounded-lg border border-slate-200 dark:border-[#1F1F1F]">
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-300">Restrições (opcional)</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deixe vazio para aplicar a todos os ingressos</p>
                </div>

                {ticketCategories.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-200">Categorias permitidas</Label>
                    <div className="space-y-2.5 max-h-32 overflow-y-auto">
                      {ticketCategories.map((cat) => (
                        <AnimatedCheckbox
                          key={cat.id}
                          checked={form.limitCategories.includes(cat.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm(f => ({ ...f, limitCategories: [...f.limitCategories, cat.id] }));
                            } else {
                              setForm(f => ({ ...f, limitCategories: f.limitCategories.filter(id => id !== cat.id) }));
                            }
                          }}
                          label={cat.name}
                          className="dark:text-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {ticketTypes.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-200">Tipos de ingresso permitidos</Label>
                    <div className="space-y-2.5 max-h-32 overflow-y-auto">
                      {ticketTypes.map((tt) => (
                        <AnimatedCheckbox
                          key={tt.id}
                          checked={form.limitTicketTypes.includes(tt.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm(f => ({ ...f, limitTicketTypes: [...f.limitTicketTypes, tt.id] }));
                            } else {
                              setForm(f => ({ ...f, limitTicketTypes: f.limitTicketTypes.filter(id => id !== tt.id) }));
                            }
                          }}
                          label={tt.name}
                          className="dark:text-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hide event selection if we already have an ID */}
            {!id && (
              <div className="sm:col-span-2">
                <Label className="dark:text-slate-200">Evento</Label>
                <Input value={form.eventId || ''} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value || null }))} placeholder="ID do evento" className="dark:bg-[#242424] dark:border-[#1F1F1F] dark:text-white dark:placeholder:text-slate-500" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCoupon} disabled={!form.code.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

