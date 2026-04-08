import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle, Award, Mail } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminMetrics {
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
    topEventsWithAbandonment: Array<{
        eventId: string;
        eventName: string;
        eventSlug: string;
        totalOrders: number;
        paidOrders: number;
        canceledOrders: number;
        abandonmentRate: number;
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

export default function AdminAnalytics() {
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [recoveryMetrics, setRecoveryMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        loadMetrics();
    }, [days]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const [abandonmentRes, recoveryRes] = await Promise.all([
                fetch(`/api/admin/analytics/abandonment?days=${days}`),
                fetch(`/api/admin/analytics/recovery?days=${days}`),
            ]);

            if (!abandonmentRes.ok) throw new Error('Failed to load analytics');

            const abandonmentData = await abandonmentRes.json();
            setMetrics(abandonmentData);

            if (recoveryRes.ok) {
                const recoveryData = await recoveryRes.json();
                setRecoveryMetrics(recoveryData);
            }
        } catch (err) {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center text-gray-600">Erro ao carregar métricas</div>
                </div>
            </div>
        );
    }

    const { summary, cancelReasons, topEventsWithAbandonment, dailyTrend } = metrics;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics da Plataforma</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Visão global de conversão e abandono</p>
                    </div>
                    <select
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Pedidos</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">{summary.totalOrders.toLocaleString()}</p>
                            </div>
                            <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-60" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Pedidos Pagos</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">{summary.paidOrders.toLocaleString()}</p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {summary.conversionRate}%
                                </p>
                            </div>
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 opacity-60" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">Cancelados</p>
                                <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-2">{summary.canceledOrders.toLocaleString()}</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {summary.abandonmentRate}%
                                </p>
                            </div>
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-60" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendentes</p>
                                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">{summary.pendingOrders.toLocaleString()}</p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-60" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Emails Enviados</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">{recoveryMetrics?.emailsSent?.toLocaleString() || '0'}</p>
                                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Recuperação</p>
                            </div>
                            <Mail className="w-10 h-10 text-purple-600 dark:text-purple-400 opacity-60" />
                        </div>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Trend */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tendência Diária (Últimos 30 dias)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyTrend.slice(-30).reverse()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} name="Pagos" />
                                <Line type="monotone" dataKey="canceled" stroke="#EF4444" strokeWidth={2} name="Cancelados" />
                                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pendentes" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Cancel Reasons */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Motivos de Cancelamento</h3>
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={cancelReasons}
                                            dataKey="count"
                                            nameKey="reason"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={(entry) => `${entry.percentage}%`}
                                        >
                                            {cancelReasons.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {cancelReasons.map((reason, index) => (
                                    <div key={reason.reason} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: REASON_COLORS[index % REASON_COLORS.length] }}
                                        ></div>
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900 dark:text-white">{REASON_LABELS[reason.reason] || reason.reason}</div>
                                            <div className="text-gray-500">{reason.count.toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Top Events with Abandonment */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔝 Top 10 Eventos com Maior Abandono</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Evento</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Pagos</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cancelados</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Taxa Abandono</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topEventsWithAbandonment.map((event, index) => (
                                    <tr key={event.eventId} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                                        <td className="py-3 px-4">
                                            <a
                                                href={`/painel-evento/${event.eventSlug}`}
                                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {event.eventName}
                                            </a>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">{event.totalOrders}</td>
                                        <td className="py-3 px-4 text-sm text-right text-green-600 dark:text-green-400">{event.paidOrders}</td>
                                        <td className="py-3 px-4 text-sm text-right text-red-600 dark:text-red-400">{event.canceledOrders}</td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            <span className={`font-semibold ${event.abandonmentRate > 50 ? 'text-red-600 dark:text-red-400' : event.abandonmentRate > 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {event.abandonmentRate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Platform Health */}
                <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Saúde da Plataforma
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 mb-1">Taxa de Conversão Média</div>
                            <div className={`text-2xl font-bold ${summary.conversionRate > 70 ? 'text-green-600' : summary.conversionRate > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {summary.conversionRate}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {summary.conversionRate > 70 ? '✅ Excelente' : summary.conversionRate > 50 ? '⚠️ Moderado' : '🔻 Precisa melhorar'}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 mb-1">Taxa de Abandono</div>
                            <div className={`text-2xl font-bold ${summary.abandonmentRate < 20 ? 'text-green-600' : summary.abandonmentRate < 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {summary.abandonmentRate}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {summary.abandonmentRate < 20 ? '✅ Baixo' : summary.abandonmentRate < 30 ? '⚠️ Moderado' : '🔻 Alto'}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 mb-1">Emails de Recuperação</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {recoveryMetrics?.emailsSent?.toLocaleString() || '0'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">📧 Enviados nos últimos {days} dias</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

