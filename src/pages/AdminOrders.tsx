import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, DollarSign, CreditCard, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function AdminOrders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
        if (q) params.set('q', q);
        const res = await fetch(`/api/admin/orders?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      } finally {
        setLoading(false);
      }
    })()
  }, [token, page, perPage, q]);

  const filtered = orders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.paymentStatus === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const totalRevenue = orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const paidCount = orders.filter(o => o.paymentStatus === 'PAID').length;

  const getStatusBadge = (status: string) => {
    const styles = {
      'PAID': 'bg-emerald-100 text-emerald-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'FAILED': 'bg-red-100 text-red-700',
      'CANCELLED': 'bg-slate-100 text-slate-700'
    };
    const icons = {
      'PAID': CheckCircle,
      'PENDING': Clock,
      'FAILED': XCircle,
      'CANCELLED': XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return { className: styles[status as keyof typeof styles] || styles['PENDING'], Icon };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Pedidos & Transações</h1>
          <p className="text-slate-600">Gerencie todas as vendas e pagamentos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{total}</div>
              <div className="text-sm text-slate-600">Total de Pedidos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{paidCount}</div>
              <div className="text-sm text-slate-600">Pedidos Pagos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">R$ {(totalRevenue || 0).toFixed(2)}</div>
              <div className="text-sm text-slate-600">Receita Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código ou email..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="PAID">Pagos</option>
            <option value="PENDING">Pendentes</option>
            <option value="FAILED">Falhados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <select
            value={perPage}
            onChange={e => setPerPage(parseInt(e.target.value, 10))}
            className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-slate-600">Carregando pedidos...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-slate-600">Ainda não há pedidos cadastrados.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Data</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(o => {
                  const { className, Icon } = getStatusBadge(o.paymentStatus);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-sm font-semibold text-slate-900">{o.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{o.purchaserEmail}</div>
                        <div className="text-xs text-slate-500">ID: {o.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-slate-900">R$ {(o.totalAmount || 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => navigate(`/admin/order/${o.id}`)}
                            className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition font-medium"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>
          <span className="text-slate-700 font-medium">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span>Próxima</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
