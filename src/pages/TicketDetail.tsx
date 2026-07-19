import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle, XCircle, MessageSquare, Lock, LockOpen } from 'lucide-react';
import HelpHeader from '@/components/HelpHeader';
import { fetchApi } from '@/lib/apiBase';

interface Message {
    id: string;
    message: string;
    isStaff: boolean;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

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
    messages: Message[];
}

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) {
            loadTicket();
        }
    }, [id]);

    const loadTicket = async () => {
        try {
            const response = await fetchApi(`/api/tickets/${id}`);

            if (response.ok) {
                const data = await response.json();
                setTicket(data);
            } else {
                const errorText = await response.text();
                alert(`Erro ao carregar ticket: ${response.status} - ${errorText}`);
                navigate('/ajuda/tickets');
            }
        } catch (error) {
            alert('Erro ao carregar ticket: ' + error);
            navigate('/tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !ticket) return;

        setSending(true);
        try {
            const response = await fetchApi(`/api/tickets/${ticket.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage }),
            });

            if (response.ok) {
                setNewMessage('');
                await loadTicket();
            }
        } catch (error) {
            // Silently fail or handle error
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!ticket || !confirm('Tem certeza que deseja fechar este ticket?')) return;

        try {
            const response = await fetchApi(`/api/tickets/${ticket.id}/close`, {
                method: 'PUT',
            });

            if (response.ok) {
                await loadTicket();
            }
        } catch (error) {
            // Handle error
        }
    };

    const handleReopenTicket = async () => {
        if (!ticket) return;

        try {
            const response = await fetchApi(`/api/tickets/${ticket.id}/reopen`, {
                method: 'PUT',
            });

            if (response.ok) {
                await loadTicket();
            }
        } catch (error) {
            // Handle error
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OPEN':
                return <Clock className="w-5 h-5" />;
            case 'IN_PROGRESS':
                return <MessageSquare className="w-5 h-5" />;
            case 'CLOSED':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <XCircle className="w-5 h-5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'CLOSED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'Aberto';
            case 'IN_PROGRESS':
                return 'Em andamento';
            case 'CLOSED':
                return 'Fechado';
            default:
                return status;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'GENERAL': 'Geral',
            'TECHNICAL': 'Técnico',
            'BILLING': 'Financeiro',
            'EVENT': 'Evento',
            'ACCOUNT': 'Conta',
        };
        return labels[category] || category;
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            'LOW': 'Baixa',
            'MEDIUM': 'Média',
            'NORMAL': 'Normal',
            'HIGH': 'Alta',
            'URGENT': 'Urgente',
        };
        return labels[priority] || priority;
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

    if (!ticket) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
            <HelpHeader />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/ajuda/tickets')}
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para meus tickets
                </button>

                {/* Ticket Header */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                {ticket.subject}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                                    {getStatusIcon(ticket.status)}
                                    {getStatusLabel(ticket.status)}
                                </span>
                                <span>Categoria: {getCategoryLabel(ticket.category)}</span>
                                <span>Prioridade: {getPriorityLabel(ticket.priority)}</span>
                                {ticket.event && <span>Evento: {ticket.event.name}</span>}
                            </div>
                        </div>
                        {ticket.status !== 'CLOSED' ? (
                            <button
                                onClick={handleCloseTicket}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                                <Lock className="w-4 h-4" />
                                Fechar Ticket
                            </button>
                        ) : (
                            <button
                                onClick={handleReopenTicket}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                                <LockOpen className="w-4 h-4" />
                                Reabrir Ticket
                            </button>
                        )}
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {ticket.description}
                    </p>
                    <div className="mt-4 text-xs text-zinc-500">
                        Criado em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                    </div>
                </div>

                {/* Messages */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                        Mensagens ({ticket.messages.length})
                    </h2>

                    <div className="space-y-4 mb-6">
                        {ticket.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`p-4 rounded-lg ${message.isStaff
                                    ? 'bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900'
                                    : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-zinc-900 dark:text-white">
                                        {message.user?.name || 'Equipe de Suporte'}
                                    </span>
                                    {message.isStaff && (
                                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded">
                                            Equipe
                                        </span>
                                    )}
                                    <span className="text-xs text-zinc-500">
                                        {new Date(message.createdAt).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                    {message.message}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* New Message Form */}
                    {ticket.status !== 'CLOSED' && (
                        <form onSubmit={handleSendMessage} className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                rows={4}
                                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? 'Enviando...' : 'Enviar Mensagem'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
