import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle, User, AlertCircle } from 'lucide-react';
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
    closedAt?: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    event?: {
        id: string;
        name: string;
    };
    assignee?: {
        id: string;
        name: string;
    };
    assignedTo?: string;
    messages: Message[];
}

const AdminTicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (id) {
            loadTicket();
            loadAdminUsers();
        }
    }, [id]);

    const loadTicket = async () => {
        try {
            const response = await fetchApi(`/api/admin/tickets/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTicket(data);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    const loadAdminUsers = async () => {
        try {
            const response = await fetchApi('/api/admin/tickets/admin-users');
            if (response.ok) {
                const data = await response.json();
                setAdminUsers(data);
            }
        } catch (error) {
            // no-op
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !ticket) return;

        setSending(true);
        try {
            // Get userId from localStorage AUTH_TOKEN_V1
            const authToken = localStorage.getItem('AUTH_TOKEN_V1');
            let userId = null;

            if (authToken) {
                try {
                    // Decode JWT to get userId
                    const payload = JSON.parse(atob(authToken.split('.')[1]));
                    userId = payload.userId;
                } catch (e) {
                    // no-op
                }
            }

            const response = await fetchApi(`/api/admin/tickets/${ticket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    userId: userId || 'unknown-user',
                }),
            });

            if (response.ok) {
                setNewMessage('');
                await loadTicket();
            }
        } catch (error) {
            // no-op
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!ticket) return;

        try {
            const response = await fetchApi(`/api/admin/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                await loadTicket();
            }
        } catch (error) {
            // no-op
        }
    };

    const handleUpdatePriority = async (newPriority: string) => {
        if (!ticket) return;

        try {
            const response = await fetchApi(`/api/admin/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });

            if (response.ok) {
                await loadTicket();
            }
        } catch (error) {
            // no-op
        }
    };

    const handleAssignTicket = async (userId: string) => {
        if (!ticket) return;

        setAssigning(true);
        try {
            const response = await fetchApi(`/api/admin/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: userId || null }),
            });

            if (response.ok) {
                await loadTicket();
            }
        } catch (error) {
            // no-op
        } finally {
            setAssigning(false);
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'text-red-600 dark:text-red-400';
            case 'NORMAL':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'LOW':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
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
            <div className="space-y-5">
                <div className="flex items-center justify-center h-96">
                    <div className="text-slate-600">Carregando...</div>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="space-y-5">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Ticket não encontrado</h2>
                    <button
                        onClick={() => navigate('/admin/helpdesk/tickets')}
                        className="text-indigo-600 hover:text-indigo-700"
                    >
                        Voltar para lista de tickets
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Back button */}
            <button
                onClick={() => navigate('/admin/helpdesk/tickets')}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar para tickets
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Ticket Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    {ticket.subject}
                                </h1>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                                        {ticket.status === 'OPEN' && <Clock className="w-4 h-4" />}
                                        {ticket.status === 'IN_PROGRESS' && <AlertCircle className="w-4 h-4" />}
                                        {ticket.status === 'CLOSED' && <CheckCircle className="w-4 h-4" />}
                                        {ticket.status}
                                    </span>
                                    <span className={getPriorityColor(ticket.priority)}>
                                        Prioridade: {getPriorityLabel(ticket.priority)}
                                    </span>
                                    <span>Categoria: {getCategoryLabel(ticket.category)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-slate-600" />
                                <span className="font-medium text-slate-900">{ticket.user.name}</span>
                                <span className="text-sm text-slate-600">({ticket.user.email})</span>
                            </div>
                            {ticket.event && (
                                <div className="text-sm text-slate-600">
                                    Evento: {ticket.event.name}
                                </div>
                            )}
                        </div>

                        <div className="prose max-w-none">
                            <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                            Criado em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                            {ticket.closedAt && ` • Fechado em ${new Date(ticket.closedAt).toLocaleString('pt-BR')}`}
                        </div>
                    </div>

                    {/* Messages Thread */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Mensagens ({ticket.messages.length})
                        </h2>

                        <div className="space-y-4 mb-6">
                            {ticket.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`p-4 rounded-lg ${message.isStaff
                                        ? 'bg-indigo-50 border border-indigo-200'
                                        : 'bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-slate-900">
                                            {message.user?.name || 'Sistema'}
                                        </span>
                                        {message.isStaff && (
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded">
                                                Equipe
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-500">
                                            {new Date(message.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 whitespace-pre-wrap">{message.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reply Form */}
                        {ticket.status !== 'CLOSED' && (
                            <form onSubmit={handleSendReply} className="border-t border-slate-200 pt-4">
                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                    Responder como equipe
                                </label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua resposta..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    {sending ? 'Enviando...' : 'Enviar Resposta'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Status Management */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">Status</h3>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="OPEN">Aberto</option>
                            <option value="IN_PROGRESS">Em Andamento</option>
                            <option value="CLOSED">Fechado</option>
                        </select>
                    </div>

                    {/* Priority Management */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">Prioridade</h3>
                        <select
                            value={ticket.priority}
                            onChange={(e) => handleUpdatePriority(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="LOW">Baixa</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">Alta</option>
                        </select>
                    </div>

                    {/* Assignment */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">Atribuído para</h3>
                        <select
                            value={ticket.assignedTo || ''}
                            onChange={(e) => handleAssignTicket(e.target.value)}
                            disabled={assigning}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Não atribuído</option>
                            {adminUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        {assigning && (
                            <p className="text-xs text-slate-500 mt-2">Atualizando...</p>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">Ações Rápidas</h3>
                        <div className="space-y-2">
                            {ticket.status !== 'CLOSED' && (
                                <button
                                    onClick={() => handleUpdateStatus('CLOSED')}
                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Fechar Ticket
                                </button>
                            )}
                            {ticket.status === 'CLOSED' && (
                                <button
                                    onClick={() => handleUpdateStatus('OPEN')}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Reabrir Ticket
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTicketDetail;
