import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    ArrowLeft, User, Mail, Phone, Calendar, MapPin, CreditCard,
    CheckCircle, Clock, XCircle, DollarSign, Ticket, Trash2,
    ExternalLink, Copy, ShoppingCart, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiUrl } from '@/lib/apiBase';

export default function AdminOrderDetails() {
    const { orderId } = useParams<{ orderId: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!token || !orderId) return;

        (async () => {
            try {
                setLoading(true);
                const res = await fetch(apiUrl(`/api/admin/orders/${orderId}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error('Pedido não encontrado');
                }

                const data = await res.json();
                setOrder(data);
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar pedido');
            } finally {
                setLoading(false);
            }
        })();
    }, [token, orderId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!token || !orderId) return;

        setUpdatingStatus(true);
        try {
            const res = await fetch(apiUrl(`/api/admin/orders/${orderId}`), {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentStatus: newStatus })
            });

            if (!res.ok) {
                throw new Error('Erro ao atualizar status');
            }

            const updated = await res.json();
            setOrder(updated);
            toast({
                title: 'Status atualizado!',
                description: `Status do pedido alterado para ${newStatus}.`
            });
        } catch (err: any) {
            toast({
                title: 'Erro',
                description: err.message || 'Não foi possível atualizar o status.',
                variant: 'destructive'
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !orderId) return;

        setDeleting(true);
        try {
            const res = await fetch(apiUrl(`/api/admin/orders/${orderId}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Erro ao excluir pedido');
            }

            toast({
                title: 'Pedido excluído!',
                description: 'O pedido foi removido permanentemente.'
            });

            setTimeout(() => navigate('/admin/orders'), 1000);
        } catch (err: any) {
            toast({
                title: 'Erro',
                description: err.message || 'Não foi possível excluir o pedido.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
    };

    const getStatusInfo = (status: string) => {
        const configs = {
            'PAID': {
                label: 'Pago',
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                icon: CheckCircle,
                iconColor: 'text-emerald-600'
            },
            'PENDING': {
                label: 'Pendente',
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: Clock,
                iconColor: 'text-yellow-600'
            },
            'FAILED': {
                label: 'Falhou',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle,
                iconColor: 'text-red-600'
            },
            'CANCELLED': {
                label: 'Cancelado',
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: XCircle,
                iconColor: 'text-slate-600'
            }
        };

        return configs[status as keyof typeof configs] || configs['PENDING'];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-slate-600">Carregando detalhes do pedido...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Pedido não encontrado</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={() => navigate('/admin/orders')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Pedidos
                </Button>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.paymentStatus);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Pedido #{order.code}</h1>
                        <p className="text-slate-600 mt-1">ID: {order.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={order.paymentStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Alterar status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PAID">Pago</SelectItem>
                            <SelectItem value="PENDING">Pendente</SelectItem>
                            <SelectItem value="FAILED">Falhou</SelectItem>
                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Pedido
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-600" />
                            Informações do Comprador
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-slate-600">Nome</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-medium text-slate-900">{order.purchaserName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Email</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <p className="font-medium text-slate-900">{order.purchaserEmail || 'N/A'}</p>
                                        <button onClick={() => copyToClipboard(order.purchaserEmail, 'Email')}>
                                            <Copy className="w-4 h-4 text-slate-400 hover:text-teal-600 cursor-pointer" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-slate-600">Telefone</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <p className="font-medium text-slate-900">{order.purchaserPhone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">CPF/CNPJ</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CreditCard className="w-4 h-4 text-slate-400" />
                                        <p className="font-medium text-slate-900">{order.purchaserDocument || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Tickets */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-teal-600" />
                            Ingressos ({order.tickets?.length || 0})
                        </h2>
                        <div className="space-y-3">
                            {order.tickets && order.tickets.length > 0 ? (
                                order.tickets.map((ticket: any, idx: number) => (
                                    <div key={ticket.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">{ticket.event?.name || 'Ingresso'}</p>
                                            <p className="text-sm text-slate-600">
                                                {ticket.attendeeName || 'Sem nome'} • {ticket.attendeeEmail || 'Sem email'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Código: {ticket.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-slate-900">
                                                R$ {(ticket.price || 0).toFixed(2)}
                                            </p>
                                            <Badge variant={ticket.checkedIn ? 'default' : 'outline'} className="mt-1">
                                                {ticket.checkedIn ? 'Check-in feito' : 'Não utilizado'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-600 text-center py-4">Nenhum ingresso encontrado</p>
                            )}
                        </div>
                    </Card>

                    {/* Event Info */}
                    {order.event && (
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-teal-600" />
                                Informações do Evento
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-slate-600">Nome do Evento</label>
                                    <p className="font-medium text-slate-900 mt-1">{order.event.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-600">Data</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="font-medium text-slate-900">
                                                {order.event.startDate ? new Date(order.event.startDate).toLocaleDateString('pt-BR') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-600">Local</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <p className="font-medium text-slate-900">
                                                {order.event.locationCity || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.open(`/events/${order.event.slug || order.event.id}`, '_blank')}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver Evento
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column - Financial & Status */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Status do Pedido</h2>
                        <div className="flex items-center justify-center py-6">
                            <Badge className={`${statusInfo.color} border px-6 py-3 text-lg font-semibold`}>
                                <StatusIcon className={`w-6 h-6 mr-2 ${statusInfo.iconColor}`} />
                                {statusInfo.label}
                            </Badge>
                        </div>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-teal-600" />
                            Resumo Financeiro
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                <span className="text-slate-600">Subtotal</span>
                                <span className="font-semibold text-slate-900">
                                    R$ {((order.totalAmount || 0) - (order.serviceFee || 0)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                <span className="text-slate-600">Taxa de Serviço</span>
                                <span className="font-semibold text-slate-900">
                                    R$ {(order.serviceFee || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-teal-50 rounded-lg px-3">
                                <span className="font-semibold text-slate-900">Total</span>
                                <span className="font-bold text-2xl text-teal-600">
                                    R$ {(order.totalAmount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Info */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-teal-600" />
                            Informações de Pagamento
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-slate-600">Método</label>
                                <p className="font-medium text-slate-900 mt-1">
                                    {order.paymentMethod || 'Cartão de Crédito'}
                                </p>
                            </div>
                            {order.paymentId && (
                                <div>
                                    <label className="text-sm text-slate-600">ID da Transação</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-mono text-xs text-slate-900">{order.paymentId}</p>
                                        <button onClick={() => copyToClipboard(order.paymentId, 'ID da Transação')}>
                                            <Copy className="w-4 h-4 text-slate-400 hover:text-teal-600 cursor-pointer" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Timeline */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-600" />
                            Timeline
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="font-medium text-slate-900">Pedido Criado</p>
                                    <p className="text-sm text-slate-600">
                                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {order.paidAt && (
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Pagamento Confirmado</p>
                                        <p className="text-sm text-slate-600">
                                            {new Date(order.paidAt).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Pedido</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir permanentemente este pedido? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
