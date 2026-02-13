import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Clock, Mail, ArrowRightLeft, CheckCircle, XCircle } from 'lucide-react';

interface TicketEvent {
    id: string;
    type: string;
    description: string;
    metadata?: any;
    performedBy?: string;
    createdAt: string;
}

interface TicketDetailsModalProps {
    ticketId: string;
    onClose: () => void;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticketId, onClose }) => {
    const { token } = useAuth();
    const [ticket, setTicket] = useState<any>(null);
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (!token) {
                console.log('No token available');
                return;
            }

            console.log('Loading ticket history for:', ticketId);

            try {
                const response = await fetch(`/api/ticket/${ticketId}/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Ticket data loaded:', data);
                    setTicket(data.ticket);
                    setEvents(data.events || []);
                } else {
                    const errorText = await response.text();
                    console.error('Failed to load ticket:', response.status, errorText);
                }
            } catch (error) {
                console.error('Error loading ticket history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [ticketId, token]);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'ISSUED':
                return <Clock className="w-5 h-5 text-green-600" />;
            case 'EMAIL_SENT':
            case 'RESENT_EMAIL':
                return <Mail className="w-5 h-5 text-blue-600" />;
            case 'TRANSFERRED':
                return <ArrowRightLeft className="w-5 h-5 text-orange-600" />;
            case 'CHECKED_IN':
                return <CheckCircle className="w-5 h-5 text-green-700" />;
            case 'CANCELED':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Ingresso #{ticket?.code}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center text-gray-500">Carregando...</div>
                    ) : (
                        <>
                            {/* Ticket Info */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Informações Básicas
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Titular:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {ticket?.userName && ticket.userName !== ticket.userEmail
                                                ? ticket.userName
                                                : ticket?.userEmail || 'N/A'}
                                        </p>
                                        {ticket?.userName && ticket.userName !== ticket.userEmail && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.userEmail}</p>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {ticket?.status === 'ISSUED' ? 'Emitido' :
                                                ticket?.status === 'CANCELED' ? 'Cancelado' :
                                                    ticket?.status === 'RESERVED' ? 'Reservado' :
                                                        ticket?.status || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">{ticket?.ticketTypeName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Cortesia:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {ticket?.isCourtesy ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {ticket?.pricePaid ? `R$ ${ticket.pricePaid.toFixed(2)}` : 'R$ 0,00'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {ticket?.used ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Histórico do Ingresso
                                </h3>
                                <div className="space-y-4">
                                    {events.map((event, index) => (
                                        <div key={event.id} className="flex gap-4">
                                            {/* Icon & Line */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                                    {getEventIcon(event.type)}
                                                </div>
                                                {index < events.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-600 mt-2" style={{ minHeight: '40px' }} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-8">
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                                                        {event.description}
                                                    </p>
                                                    <div className="flex justify-between items-start">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            <p>
                                                                {new Date(event.createdAt).toLocaleDateString('pt-BR')} às{' '}
                                                                {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                                                            </p>
                                                            <p className="mt-1">
                                                                Por: <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                    {event.performedBy || (event.type === 'ISSUED' ? 'Sistema / Titular' : 'Sistema')}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {event.metadata && (event.metadata.reason || event.metadata.location) && (
                                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-600">
                                                            {event.metadata.reason && <span>Motivo: {event.metadata.reason}</span>}
                                                            {event.metadata.location && <span>Local: {event.metadata.location}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {events.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            Nenhum histórico encontrado
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t dark:border-gray-700 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={canceling}
                    >
                        Fechar
                    </button>

                    {ticket?.isCourtesy && ticket?.status !== 'CANCELED' && (
                        <button
                            onClick={async () => {
                                if (!confirm('Tem certeza que deseja cancelar esta cortesia? Esta ação é irreversível.')) return;

                                setCanceling(true);
                                try {
                                    const response = await fetch(`/api/ticket/${ticketId}/cancel`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                    });

                                    if (response.ok) {
                                        alert('Cortesia cancelada com sucesso!');
                                        // Refresh data
                                        const resHistory = await fetch(`/api/ticket/${ticketId}/history`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        if (resHistory.ok) {
                                            const data = await resHistory.json();
                                            setTicket(data.ticket);
                                            setEvents(data.events);
                                        }
                                    } else {
                                        const err = await response.json();
                                        alert(`Erro ao cancelar: ${err.message || 'Erro desconhecido'}`);
                                    }
                                } catch (error) {
                                    console.error('Error canceling ticket:', error);
                                    alert('Erro de conexão ao cancelar ingresso.');
                                } finally {
                                    setCanceling(false);
                                }
                            }}
                            className="flex-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                            disabled={canceling}
                        >
                            {canceling ? 'Cancelando...' : 'Cancelar Cortesia'}
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TicketDetailsModal;
