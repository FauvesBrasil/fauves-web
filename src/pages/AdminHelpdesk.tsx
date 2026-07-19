import { useState, useEffect } from 'react';
import {
    MessageSquare,
    TrendingUp,
    Clock,
    CheckCircle,
    Users,
    BookOpen,
    BarChart3,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminHelpdesk = () => {
    const [stats, setStats] = useState({
        tickets: { total: 0, open: 0, inProgress: 0, closed: 0 },
        chats: { active: 0, total: 0 },
        articles: { total: 0, views: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const ticketsRes = await fetch('http://localhost:4000/api/admin/tickets/stats');
            const ticketsData = await ticketsRes.json();

            setStats({
                tickets: ticketsData,
                chats: { active: 0, total: 0 }, // TODO: Implement chat stats
                articles: { total: 0, views: 0 }, // TODO: Implement article stats
            });
        } catch (error) {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Helpdesk</h1>
                <p className="text-sm text-slate-600">Central de gerenciamento de suporte</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.tickets.total}</div>
                    <div className="text-xs text-slate-600">Total de Tickets</div>
                    <div className="mt-2 flex gap-2 text-xs">
                        <span className="text-blue-600">{stats.tickets.open} abertos</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-yellow-600">{stats.tickets.inProgress} em andamento</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.tickets.closed}</div>
                    <div className="text-xs text-slate-600">Tickets Resolvidos</div>
                    <div className="mt-2 text-xs text-slate-500">
                        {stats.tickets.total > 0
                            ? `${Math.round((stats.tickets.closed / stats.tickets.total) * 100)}% de resolução`
                            : '0% de resolução'
                        }
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.chats.active}</div>
                    <div className="text-xs text-slate-600">Chats Ativos</div>
                    <div className="mt-2 text-xs text-slate-500">
                        {stats.chats.total} conversas hoje
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.articles.views}</div>
                    <div className="text-xs text-slate-600">Visualizações de Artigos</div>
                    <div className="mt-2 text-xs text-slate-500">
                        {stats.articles.total} artigos publicados
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/admin/helpdesk/tickets"
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-900 mb-1">
                                    Gerenciar Tickets
                                </div>
                                <div className="text-sm text-slate-600">
                                    Visualize e responda todos os tickets de suporte
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                        <Clock className="w-3 h-3" />
                                        {stats.tickets.open} pendentes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/helpdesk/live-chat"
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-900 mb-1">
                                    Live Chat
                                </div>
                                <div className="text-sm text-slate-600">
                                    Atenda conversas em tempo real
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                                        <Activity className="w-3 h-3" />
                                        {stats.chats.active} ativos
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/helpdesk/knowledge-base"
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-900 mb-1">
                                    Central de Ajuda
                                </div>
                                <div className="text-sm text-slate-600">
                                    Gerencie categorias e artigos
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                                        <BookOpen className="w-3 h-3" />
                                        {stats.articles.total} artigos
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Desempenho de Tickets</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Taxa de Resolução</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {stats.tickets.total > 0
                                        ? `${Math.round((stats.tickets.closed / stats.tickets.total) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: stats.tickets.total > 0
                                            ? `${(stats.tickets.closed / stats.tickets.total) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Tickets em Andamento</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {stats.tickets.total > 0
                                        ? `${Math.round((stats.tickets.inProgress / stats.tickets.total) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: stats.tickets.total > 0
                                            ? `${(stats.tickets.inProgress / stats.tickets.total) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Tickets Abertos</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {stats.tickets.total > 0
                                        ? `${Math.round((stats.tickets.open / stats.tickets.total) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: stats.tickets.total > 0
                                            ? `${(stats.tickets.open / stats.tickets.total) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Atividade Recente</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900">
                                    {stats.tickets.open} tickets aguardando resposta
                                </div>
                                <div className="text-xs text-slate-600">
                                    Verifique os tickets pendentes
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-purple-100 rounded">
                                <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900">
                                    {stats.chats.active} chats ativos agora
                                </div>
                                <div className="text-xs text-slate-600">
                                    Usuários aguardando atendimento
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-indigo-100 rounded">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900">
                                    {stats.articles.views} visualizações hoje
                                </div>
                                <div className="text-xs text-slate-600">
                                    Artigos da central de ajuda
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHelpdesk;
