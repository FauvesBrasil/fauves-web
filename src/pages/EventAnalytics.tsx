import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { getEventPath } from '@/lib/eventUrl';
import { fetchApi } from '@/lib/apiBase';

interface AbandonmentMetrics {
    period: string;
    summary: {
        totalOrders: number;
        paidOrders: number;
        canceledOrders: number;
        pendingOrders: number;
        conversionRate: number;
        abandonmentRate: number;
    };
    cancelReasons: Array<{
        reason: string;
        count: number;
        percentage: string;
    }>;
    dailyTrend: Array<{
        date: string;
        paid: number;
        canceled: number;
        pending: number;
    }>;
}

const REASON_LABELS: Record<string, string> = {
    TIMEOUT_EXPIRED: 'Tempo Esgotado',
    USER_CANCELED: 'Cancelado pelo Usuário',
    PAYMENT_FAILED: 'Pagamento Falhou',
    ADMIN_CANCELED: 'Cancelado Admin',
    FRAUD_DETECTED: 'Fraude Detectada',
    UNKNOWN: 'Desconhecido',
};

const REASON_COLORS = ['#EF4118', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6B7280'];

function getStatusLabel(status: string | undefined): string {
    switch (status) {
        case 'draft': return 'Rascunho';
        case 'published': return 'Publicado';
        case 'completed': return 'Encerrado';
        case 'paused': return 'Pausado';
        case 'deleted': return 'Excluído';
        default: return status || 'Desconhecido';
    }
}

export default function EventAnalytics() {
    const { totalLeft } = useLayoutOffsets();
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [event, setEvent] = React.useState<any>(null);
    const [metrics, setMetrics] = useState<AbandonmentMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const { selectedOrg } = useOrganization();

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [eventMenuOpen, setEventMenuOpen] = React.useState(false);

    useEffect(() => {
        loadMetrics();
        loadEvent();
    }, [id, days]);

    const loadEvent = async () => {
        if (!id) return;
        try {
            const res = await fetchApi(`/api/event/${id}`);
            if (res.ok) {
                const evt = await res.json();
                setEvent(evt);
            }
        } catch (e) {
            // no-op
        }
    };

    const loadMetrics = async () => {
        setLoading(true);
        try {
            if (!id) throw new Error('Event ID not found');
            const res = await fetch(`/api/events/${id}/analytics/abandonment?days=${days}`);
            if (!res.ok) throw new Error('Failed to load chart data');
            const data = await res.json();
            setMetrics(data);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
                <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
                <MobileDrawerMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} selectedOrg={selectedOrg} user={user} />
                <EventMobileTopBar title="Analytics" onMenuOpen={() => setEventMenuOpen(true)} />
                <EventMobileDrawer isOpen={eventMenuOpen} onClose={() => setEventMenuOpen(false)} currentPath={location.pathname} eventId={id || ''} eventName={event?.name} eventDate={event?.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : undefined} eventStatus={getStatusLabel(event?.status)} />
                <div className="hidden lg:block"><SidebarMenu /></div>
                <div className="hidden lg:block"><EventDetailsSidebar eventName={event?.name} eventDate={event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : undefined} eventStatus={getStatusLabel(event?.status)} onBack={() => navigate('/organizer-events')} onViewEvent={() => event && navigate(getEventPath({ id: event.id || id!, slug: event.slug }))} eventIdOverride={id || null} panelRoute={`/painel-evento/${id}`} fixed fixedLeft={70} fixedWidth={300} fixedTop={0} /></div>
                <AppHeader />
                <OrganizerLayout>
                    <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col px-4 sm:px-6 lg:px-8 min-h-screen relative pb-24 pt-24 max-md:pt-4">
                        <div className="max-w-[1200px] w-full mx-auto">
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </OrganizerLayout>
            </div>
        );
    }

    if (!metrics) {
        return <div className="p-8">Erro ao carregar métricas</div>;
    }

    const { summary, cancelReasons, dailyTrend } = metrics;

    return (
        <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
            <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
            <MobileDrawerMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} selectedOrg={selectedOrg} user={user} />
            <EventMobileTopBar title="Analytics" onMenuOpen={() => setEventMenuOpen(true)} />
            <EventMobileDrawer isOpen={eventMenuOpen} onClose={() => setEventMenuOpen(false)} currentPath={location.pathname} eventId={id || ''} eventName={event?.name} eventDate={event?.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : undefined} eventStatus={getStatusLabel(event?.status)} />
            <div className="hidden lg:block"><SidebarMenu /></div>
            <div className="hidden lg:block"><EventDetailsSidebar eventName={event?.name} eventDate={event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : undefined} eventStatus={getStatusLabel(event?.status)} onBack={() => navigate('/organizer-events')} onViewEvent={() => event && navigate(getEventPath({ id: event.id || id!, slug: event.slug }))} eventIdOverride={id || null} panelRoute={`/painel-evento/${id}`} fixed fixedLeft={70} fixedWidth={300} fixedTop={0} /></div>
            <AppHeader />
            <OrganizerLayout>
                <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col px-4 sm:px-6 lg:px-8 min-h-screen relative pb-24 pt-24 max-md:pt-4">
                    <div className="max-w-[1200px] w-full mx-auto space-y-8">

                        {/* Header */}
                        <div className="flex items-start justify-between mb-6 max-md:hidden">
                            <div>
                                <h1 className="text-3xl lg:text-[38px] font-bold text-[#091747] dark:text-white">Analytics de Conversão</h1>
                                <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm">Análise de abandono de carrinho e recuperação</p>
                            </div>
                            <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value={7}>Últimos 7 dias</option>
                                <option value={30}>Últimos 30 dias</option>
                                <option value={90}>Últimos 90 dias</option>
                            </select>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Total de Pedidos</div>
                                <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">{summary.totalOrders}</div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">Últimos {days} dias</div>
                            </div>

                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Pedidos Pagos</div>
                                <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">{summary.paidOrders}</div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {summary.conversionRate}% conversão
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Pedidos Cancelados</div>
                                <div className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400">{summary.canceledOrders}</div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {summary.abandonmentRate}% abandono
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Pendentes</div>
                                <div className="text-lg sm:text-xl font-bold text-yellow-700 dark:text-yellow-400">{summary.pendingOrders}</div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">Aguardando pagamento</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Tendência Diária</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={dailyTrend.slice(-14).reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.2} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="paid" stroke="#15803d" strokeWidth={2} name="Pagos" />
                                        <Line type="monotone" dataKey="canceled" stroke="#b91c1c" strokeWidth={2} name="Cancelados" />
                                        <Line type="monotone" dataKey="pending" stroke="#ca8a04" strokeWidth={2} name="Pendentes" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Motivos de Cancelamento</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={cancelReasons} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={90} label={(entry) => `${entry.percentage}%`} labelLine={false}>
                                                    {cancelReasons.map((entry, index) => (<Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-1.5">
                                        {cancelReasons.map((reason, index) => (
                                            <div key={reason.reason} className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REASON_COLORS[index % REASON_COLORS.length] }}></div>
                                                <div className="text-xs">
                                                    <div className="font-medium text-zinc-700 dark:text-zinc-300">{REASON_LABELS[reason.reason] || reason.reason}</div>
                                                    <div className="text-zinc-500 dark:text-zinc-400">{reason.count} pedidos</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900 rounded-xl shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">💡 Insights e Recomendações</h3>
                            <div className="space-y-2 text-xs text-indigo-800 dark:text-indigo-200">
                                {summary.abandonmentRate > 30 && (<p className="flex items-start gap-2"><span className="text-yellow-600 dark:text-yellow-400 shrink-0">⚠️</span><span><strong>Alta taxa de abandono ({summary.abandonmentRate}%):</strong> Considere simplificar o processo de checkout ou oferecer mais opções de pagamento.</span></p>)}
                                {cancelReasons.find(r => r.reason === 'TIMEOUT_EXPIRED' && parseInt(r.percentage) > 50) && (<p className="flex items-start gap-2"><span className="shrink-0">⏱️</span><span><strong>Muitos timeouts:</strong> {cancelReasons.find(r => r.reason === 'TIMEOUT_EXPIRED')?.percentage}% dos cancelamentos são por tempo esgotado. Emails de recuperação estão sendo enviados automaticamente!</span></p>)}
                                {summary.conversionRate > 70 && (<p className="flex items-start gap-2"><span className="text-green-600 dark:text-green-400 shrink-0">✅</span><span><strong>Ótima conversão ({summary.conversionRate}%):</strong> Seu checkout está performando muito bem!</span></p>)}
                                {summary.conversionRate < 50 && (<p className="flex items-start gap-2"><span className="text-red-600 dark:text-red-400 shrink-0">📉</span><span><strong>Conversão baixa ({summary.conversionRate}%):</strong> Revise o fluxo de checkout e considere adicionar suporte via chat.</span></p>)}
                            </div>
                        </div>

                    </div>
                </div>
            </OrganizerLayout>
        </div>
    );
}
