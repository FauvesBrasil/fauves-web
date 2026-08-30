import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Calendar, MapPin, Users, TrendingUp, DollarSign, 
  Eye, MousePointer, ShoppingCart, CreditCard, AlertTriangle,
  Clock, CheckCircle, XCircle, Package, BarChart3, Activity,
  FileText, Shield, Target, Zap, Wallet, Send, Download, ExternalLink, Edit2
} from 'lucide-react';
import EventImage from '@/components/EventImage';

export default function AdminEventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [showOrgTooltip, setShowOrgTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleOrgMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!token || !eventId) return;
    loadEventDetails();
  }, [token, eventId]);

  const loadEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load event basic info
      const eventRes = await fetch(`/api/admin/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!eventRes.ok) throw new Error('Erro ao carregar evento');
      const eventResponse = await eventRes.json();
      
      const eventData = eventResponse.ok ? eventResponse.event : eventResponse;
      setEvent(eventData);

      // Load analytics
      const analyticsRes = await fetch(`/api/admin/event/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Load financial data
      const financialRes = await fetch(`/api/admin/event/${eventId}/financial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (financialRes.ok) {
        const financialData = await financialRes.json();
        if (financialData.ok) {
          setFinancial(financialData.financial);
        }
      }

      // Load reports/complaints
      const reportsRes = await fetch(`/api/admin/event/${eventId}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // Load organization data if organizationId exists
      if (eventData.organizationId) {
        const orgRes = await fetch(`/api/admin/organization/${eventData.organizationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData.ok && orgData.organization) {
            setOrganizationData(orgData.organization);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('Digite um valor válido');
      return;
    }

    if (!financial || amount > financial.availableForWithdrawal) {
      alert('Saldo insuficiente');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch(`/api/admin/event/${eventId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();
      if (data.ok) {
        alert('Solicitação de saque criada com sucesso!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadEventDetails(); // Recarregar dados
      } else {
        alert(data.message || 'Erro ao solicitar saque');
      }
    } catch (err) {
      alert('Erro ao processar solicitação');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-slate-600">Carregando detalhes do evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/events')} className="mb-4 text-teal-600 hover:text-teal-700">
          ← Voltar
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error || 'Evento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const funnel = analytics?.funnel || {};
  const timeline = analytics?.timeline || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/events')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>
          <p className="text-slate-600">{event.organizationName || 'Sem organização'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/create?eventId=${eventId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={async () => {
              if (confirm('Tem certeza que deseja excluir permanentemente este evento e todos os seus dados?')) {
                try {
                  const res = await fetch(`/api/admin/delete-event`, { 
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify({ eventId })
                  });
                  const data = await res.json();
                  if (data.ok) {
                    alert('Evento excluído com sucesso!');
                    navigate('/admin/events');
                  } else {
                    alert(`Erro ao excluir: ${data.error || 'Erro desconhecido'}`);
                  }
                } catch (e) {
                  alert('Erro ao processar exclusão');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition font-medium"
          >
            <XCircle className="w-4 h-4" />
            Excluir
          </button>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            event.status === 'published' || event.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {event.status || 'draft'}
          </span>
        </div>
      </div>

      {/* Event Image & Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {(event.image || event.bannerUrl || event.banner || event.coverUrl) && (
            <div className="flex flex-row gap-0 h-full min-h-[200px]">
              {/* Imagem Quadrada */}
              <div className="flex-shrink-0 w-[200px] aspect-square bg-slate-100">
                <EventImage event={event} alt={event.name} className="w-full h-full object-cover" />
              </div>
              
              {/* Descrição e Subtítulo */}
              <div className="flex-1 space-y-3 p-4">
                <div>
                  <h3 className="font-medium text-slate-900 mb-1.5 text-sm">Descrição</h3>
                  <p className="text-slate-600 text-sm">{event.description || 'Sem descrição'}</p>
                </div>
                {event.subtitle && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1.5 text-sm">Subtítulo</h3>
                    <p className="text-slate-600 text-sm">{event.subtitle}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!(event.image || event.bannerUrl || event.banner || event.coverUrl) && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-medium text-slate-900 mb-1.5 text-sm">Descrição</h3>
                <p className="text-slate-600 text-sm">{event.description || 'Sem descrição'}</p>
              </div>
              {event.subtitle && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-1.5 text-sm">Subtítulo</h3>
                  <p className="text-slate-600 text-sm">{event.subtitle}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900 mb-3 text-sm">Informações</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Data de Início</div>
                  <div className="font-medium text-sm">{event.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : '—'}</div>
                </div>
              </div>
              {event.endDate && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Data de Término</div>
                    <div className="font-medium text-sm">{new Date(event.endDate).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Local</div>
                  <div className="font-medium text-sm">{event.location || '—'}</div>
                  {event.locationAddress && <div className="text-xs text-slate-600 mt-1">{event.locationAddress}</div>}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Categoria</div>
                  <div className="font-medium text-sm">{event.category || '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Privacidade</div>
                  <div className="font-medium text-sm">{event.privacy || 'Público'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-4 text-white relative">
          <Eye className="w-6 h-6 opacity-70 absolute top-3 right-3" />
          <div className="text-2xl font-semibold mb-1">{stats.pageViews || 0}</div>
          <div className="text-blue-100 text-xs font-medium">Visualizações</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-4 text-white relative">
          <MousePointer className="w-6 h-6 opacity-70 absolute top-3 right-3" />
          <div className="text-2xl font-semibold mb-1">{stats.ticketButtonClicks || 0}</div>
          <div className="text-purple-100 text-xs font-medium">Cliques em Ingressos</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-sm p-4 text-white relative">
          <ShoppingCart className="w-6 h-6 opacity-70 absolute top-3 right-3" />
          <div className="text-2xl font-semibold mb-1">{stats.ordersCreated || 0}</div>
          <div className="text-teal-100 text-xs font-medium">Pedidos Criados</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm p-4 text-white relative">
          <CheckCircle className="w-6 h-6 opacity-70 absolute top-3 right-3" />
          <div className="text-2xl font-semibold mb-1">{stats.ordersPaid || 0}</div>
          <div className="text-emerald-100 text-xs font-medium">Vendas Concluídas</div>
        </div>
      </div>

      {/* Funnel de Conversão */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600" />
          Funil de Conversão
        </h3>
        <div className="space-y-4">
          <FunnelStep 
            label="Visitaram a página do evento"
            value={funnel.pageViews || 0}
            total={funnel.pageViews || 1}
            icon={Eye}
          />
          <FunnelStep 
            label="Clicaram em 'Selecionar Ingressos'"
            value={funnel.ticketButtonClicks || 0}
            total={funnel.pageViews || 1}
            icon={MousePointer}
          />
          <FunnelStep 
            label="Iniciaram checkout"
            value={funnel.checkoutStarted || 0}
            total={funnel.pageViews || 1}
            icon={ShoppingCart}
          />
          <FunnelStep 
            label="Chegaram à revisão"
            value={funnel.reviewReached || 0}
            total={funnel.pageViews || 1}
            icon={FileText}
          />
          <FunnelStep 
            label="Completaram pagamento"
            value={funnel.paymentCompleted || 0}
            total={funnel.pageViews || 1}
            icon={CheckCircle}
            isLast
          />
        </div>
      </div>

      {/* Revenue & Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Receita
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 text-sm">Receita Bruta</span>
              <span className="text-lg font-semibold text-slate-900">
                R$ {((stats.grossRevenue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 text-sm">Taxa Plataforma</span>
              <span className="text-base font-medium text-slate-700">
                R$ {((stats.platformFee || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 font-medium text-sm">Receita Líquida</span>
              <span className="text-lg font-semibold text-emerald-700">
                R$ {((stats.netRevenue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Ingressos
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 text-sm">Total Disponível</span>
              <span className="text-lg font-semibold text-slate-900">{stats.totalTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 text-sm">Vendidos</span>
              <span className="text-lg font-semibold text-blue-700">{stats.ticketsSold || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 text-sm">Restantes</span>
              <span className="text-lg font-semibold text-slate-900">{(stats.totalTickets || 0) - (stats.ticketsSold || 0)}</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Taxa de Ocupação</span>
                <span className="font-semibold">{stats.totalTickets > 0 ? Math.round((stats.ticketsSold / stats.totalTickets) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${stats.totalTickets > 0 ? (stats.ticketsSold / stats.totalTickets) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports/Denúncias */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
          <h3 className="text-base font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Denúncias ({reports.length})
          </h3>
          <div className="space-y-2.5">
            {reports.map((report, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-red-900">{report.reason || 'Motivo não especificado'}</span>
                  <span className="text-sm text-red-600">{report.createdAt ? new Date(report.createdAt).toLocaleString('pt-BR') : '—'}</span>
                </div>
                <p className="text-sm text-red-700 mb-2">{report.description}</p>
                <div className="text-xs text-red-600">Email: {report.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Section - Always show */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Financeiro do Evento
          </h3>
          {financial && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!financial.availableForWithdrawal || financial.availableForWithdrawal <= 0}
              className="flex items-center gap-2 px-3 h-9 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Realizar Saque
            </button>
          )}
        </div>

        {!financial ? (
          <div className="text-center py-8 text-slate-500">
            <p>Carregando dados financeiros...</p>
          </div>
        ) : financial.grossRevenue === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Nenhuma venda registrada ainda</p>
          </div>
        ) : (
          <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1.5">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-medium">Receita Bruta</span>
              </div>
              <p className="text-lg font-semibold text-green-900">
                R$ {financial.grossRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-0.5">{financial.paidOrders} pedidos pagos</p>
            </div>

            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1.5">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-medium">Taxa Plataforma (15%)</span>
              </div>
              <p className="text-lg font-semibold text-blue-900">
                R$ {financial.platformFee.toFixed(2)}
              </p>
            </div>

            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Receita Líquida (85%)</span>
              </div>
              <p className="text-lg font-semibold text-purple-900">
                R$ {financial.netRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Available for Withdrawal */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-300 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-700 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-medium">Disponível para Saque</span>
                </div>
                <p className="text-2xl font-semibold text-teal-900">
                  R$ {financial.availableForWithdrawal.toFixed(2)}
                </p>
              </div>
              <Download className="w-9 h-9 text-teal-400" />
            </div>
          </div>

          {/* Sales by Ticket Type */}
          {financial.salesByTicketType && financial.salesByTicketType.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Vendas por Tipo de Ingresso</h4>
              <div className="space-y-2">
                {financial.salesByTicketType.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                        {item.ticketsSold}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.ticketType}</p>
                        <p className="text-sm text-slate-600">R$ {Number(item.price).toFixed(2)} cada</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">R$ {Number(item.revenue).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.ticketsSold} ingressos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales by Day */}
          {financial.salesByDay && financial.salesByDay.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Vendas por Dia (últimos 30 dias)</h4>
              <div className="space-y-1.5">
                {financial.salesByDay.slice(0, 10).map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        {new Date(day.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600">{day.orderCount} pedidos</span>
                      <span className="text-sm font-semibold text-green-600">
                        R$ {Number(day.revenue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Financial Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-200">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 mb-0.5">Receita Pendente</p>
              <p className="text-base font-semibold text-amber-900">R$ {financial.pendingRevenue.toFixed(2)}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 mb-0.5">Receita Cancelada</p>
              <p className="text-base font-semibold text-red-900">R$ {financial.canceledRevenue.toFixed(2)}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-0.5">Total de Pedidos</p>
              <p className="text-base font-semibold text-blue-900">{financial.totalOrders}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-0.5">Total Sacado</p>
              <p className="text-base font-semibold text-slate-900">R$ {financial.totalWithdrawn?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Withdrawals History */}
          {financial.withdrawals && financial.withdrawals.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Histórico de Saques</h4>
              <div className="space-y-2">
                {financial.withdrawals.map((withdrawal: any) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-slate-900">
                          R$ {Number(withdrawal.amount).toFixed(2)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          withdrawal.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {withdrawal.status === 'COMPLETED' ? 'Realizado' :
                           withdrawal.status === 'PENDING' ? 'Pendente' : 'Falhou'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(withdrawal.createdAt).toLocaleString('pt-BR')}
                        {withdrawal.notes && ` • ${withdrawal.notes}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div>


      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Realizar Saque</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-900">
                R$ {financial?.availableForWithdrawal.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Valor do Saque
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={financial?.availableForWithdrawal}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ O saque será realizado imediatamente e o saldo disponível será atualizado.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Realizar Saque
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-600" />
            Linha do Tempo
          </h3>
          <div className="space-y-3">
            {timeline.slice(0, 10).map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{item.action}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          Detalhes Técnicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500">ID:</span>
            <span className="ml-2 font-mono text-slate-900">{event.id}</span>
          </div>
          
          {/* Organization ID with hover card */}
          <div 
            className={`p-3 bg-slate-50 rounded-lg relative group transition ${
              event.organizationId 
                ? 'cursor-pointer hover:bg-slate-100' 
                : 'cursor-not-allowed opacity-60'
            }`}
            onMouseEnter={() => event.organizationId && setShowOrgTooltip(true)}
            onMouseLeave={() => setShowOrgTooltip(false)}
            onMouseMove={event.organizationId ? handleOrgMouseMove : undefined}
            onClick={() => event.organizationId && navigate(`/admin/organizations/${event.organizationId}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500">Organização ID:</span>
                <span className={`ml-2 font-mono transition ${
                  event.organizationId 
                    ? 'text-slate-900 group-hover:text-teal-600' 
                    : 'text-slate-400'
                }`}>
                  {event.organizationId || 'Nenhuma organização'}
                </span>
              </div>
              {event.organizationId && (
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
              )}
            </div>
          </div>
          
          {/* Floating Hover Card - follows mouse */}
          {showOrgTooltip && organizationData && event.organizationId && (
            <div 
              className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border-2 border-teal-200 p-3 pointer-events-none"
              style={{ 
                left: `${tooltipPosition.x + 20}px`, 
                top: `${tooltipPosition.y + 10}px`,
                transform: 'translateY(-50%)'
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                {organizationData.logoUrl ? (
                  <img 
                    src={organizationData.logoUrl} 
                    alt={organizationData.name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-teal-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl">
                    {organizationData.name?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{organizationData.name || 'Sem nome'}</h4>
                  {organizationData.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{organizationData.description}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                {organizationData.slug && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-teal-600">🔗</span>
                    <span className="font-mono text-xs">{organizationData.slug}</span>
                  </div>
                )}
                {organizationData.createdAt && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-teal-600">📅</span>
                    <span>Criada em {new Date(organizationData.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-center text-teal-600 font-medium">
                Clique para ver detalhes completos →
              </div>
            </div>
          )}
          
          {showOrgTooltip && !organizationData && event.organizationId && (
            <div 
              className="fixed z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3"
              style={{ 
                left: `${tooltipPosition.x + 20}px`, 
                top: `${tooltipPosition.y + 10}px`,
                transform: 'translateY(-50%)'
              }}
            >
              <p className="text-sm text-slate-600">Carregando informações da organização...</p>
            </div>
          )}
          
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500">Criado em:</span>
            <span className="ml-2 text-slate-900">{event.createdAt ? new Date(event.createdAt).toLocaleString('pt-BR') : '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500">Atualizado em:</span>
            <span className="ml-2 text-slate-900">{event.updatedAt ? new Date(event.updatedAt).toLocaleString('pt-BR') : '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500">Slug:</span>
            <span className="ml-2 font-mono text-slate-900">{event.slug || '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500">Publicado:</span>
            <span className="ml-2 text-slate-900">{event.isPublished ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ 
  label, 
  value, 
  total, 
  icon: Icon,
  isLast = false 
}: { 
  label: string;
  value: number;
  total: number;
  icon: any;
  isLast?: boolean;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const width = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-400" />
          <span className="text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-900">{value.toLocaleString('pt-BR')}</span>
          <span className="text-sm text-slate-500">({percentage}%)</span>
        </div>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isLast ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-teal-500 to-blue-600'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      {!isLast && (
        <div className="flex items-center justify-end mt-2">
          <span className="text-xs text-red-600">
            {total > 0 ? `${Math.round(((total - value) / total) * 100)}% de perda` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
