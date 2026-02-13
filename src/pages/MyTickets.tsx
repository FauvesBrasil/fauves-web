import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import HelpHeader from '@/components/HelpHeader';
import { fetchApi } from '@/lib/apiBase';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    event?: {
        id: string;
        name: string;
    };
    _count: {
        messages: number;
    };
}

const MyTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadTickets();
    }, [filter]);

    const loadTickets = async () => {
        try {
            const url = filter === 'all'
                ? '/api/tickets'
                : `/api/tickets?status=${filter}`;

            const response = await fetchApi(url);
            const data = await response.json();

            // Safety check: ensure data is an array
            const ticketsArray = Array.isArray(data) ? data : (data?.tickets || []);
            setTickets(ticketsArray);
        } catch (error) {
            console.error('Error loading tickets:', error);
            setTickets([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'OPEN':
                return <Clock className="w-4 h-4" />;
            case 'IN_PROGRESS':
                return <MessageSquare className="w-4 h-4" />;
            case 'RESOLVED':
            case 'CLOSED':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <XCircle className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'OPEN':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'RESOLVED':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'CLOSED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'OPEN':
                return 'Aberto';
            case 'IN_PROGRESS':
                return 'Em andamento';
            case 'RESOLVED':
                return 'Resolvido';
            case 'CLOSED':
                return 'Fechado';
            default:
                return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 dark:text-red-400';
            case 'medium':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'low':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
                <HelpHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-zinc-600 dark:text-zinc-400">Carregando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
            <HelpHeader />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Meus Tickets
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Acompanhe suas solicitações de suporte
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/ajuda/tickets/novo')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Ticket
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                {tickets.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <MessageSquare className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Você ainda não tem tickets
                        </p>
                        <button
                            onClick={() => navigate('/ajuda/tickets/novo')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Primeiro Ticket
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`/ajuda/tickets/${ticket.id}`)}
                                className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                                {ticket.subject}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {getStatusIcon(ticket.status)}
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                                            {ticket.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                                            <span className="inline-flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {ticket._count.messages} mensagens
                                            </span>
                                            <span>Categoria: {ticket.category}</span>
                                            {ticket.event && (
                                                <span>Evento: {ticket.event.name}</span>
                                            )}
                                            <span className={getPriorityColor(ticket.priority)}>
                                                Prioridade: {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-zinc-500">
                                        <div>Criado em</div>
                                        <div>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;
