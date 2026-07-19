import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Ticket, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminReports() {
  const { token } = useAuth();
  const [dateRange, setDateRange] = useState('last-30-days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ revenue: {}, orders: {}, tickets: {}, users: {} });
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [topOrganizations, setTopOrganizations] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/reports-stats?dateRange=${dateRange}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setStats(d.stats || {});
          setTopEvents(d.topEvents || []);
          setTopOrganizations(d.topOrganizations || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, dateRange]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Relatórios & Análises</h1>
          <p className="text-slate-600 text-sm">Acompanhe métricas e performance da plataforma</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 h-9 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition font-medium">
          <Download className="w-4 h-4" />
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-slate-600" />
          <select 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
            className="flex-1 px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
          >
            <option value="today">Hoje</option>
            <option value="last-7-days">Últimos 7 dias</option>
            <option value="last-30-days">Últimos 30 dias</option>
            <option value="last-90-days">Últimos 90 dias</option>
            <option value="this-year">Este ano</option>
            <option value="custom">Período personalizado</option>
          </select>
        </div>
      </div>

      {/* Main Stats Cards */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-slate-600">Carregando estatísticas...</p>
        </div>
      )}

      {!loading && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-start justify-between mb-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${stats.revenue.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.revenue.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(stats.revenue.change)}%
            </div>
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-0.5">R$ {(stats.revenue.current || 0).toFixed(2)}</div>
          <div className="text-xs text-slate-600">Receita Total</div>
          <div className="mt-1.5 text-xs text-slate-500">vs R$ {(stats.revenue.previous || 0).toFixed(2)} anterior</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-start justify-between mb-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${stats.orders.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.orders.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(stats.orders.change)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.orders.current}</div>
          <div className="text-sm text-slate-600">Pedidos</div>
          <div className="mt-2 text-xs text-slate-500">vs {stats.orders.previous} anterior</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${stats.tickets.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.tickets.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(stats.tickets.change)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.tickets.current}</div>
          <div className="text-sm text-slate-600">Ingressos Vendidos</div>
          <div className="mt-2 text-xs text-slate-500">vs {stats.tickets.previous} anterior</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${stats.users.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.users.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(stats.users.change)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.users.current}</div>
          <div className="text-sm text-slate-600">Novos Usuários</div>
          <div className="mt-2 text-xs text-slate-500">vs {stats.users.previous} anterior</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Receita ao Longo do Tempo</h3>
          <div className="h-64 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Gráfico de receita apareceria aqui</p>
              <p className="text-sm text-slate-500">Integração com biblioteca de gráficos necessária</p>
            </div>
          </div>
        </div>

        {/* Tickets Sold Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ingressos Vendidos</h3>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Gráfico de vendas apareceria aqui</p>
              <p className="text-sm text-slate-500">Integração com biblioteca de gráficos necessária</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
            <h3 className="text-lg font-bold text-slate-900">Top 5 Eventos</h3>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Evento</th>
                  <th className="pb-3 text-right text-sm font-semibold text-slate-700">Ingressos</th>
                  <th className="pb-3 text-right text-sm font-semibold text-slate-700">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topEvents.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-900">{e.name}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{e.tickets}</td>
                    <td className="py-3 text-right text-sm font-semibold text-emerald-600">R$ {(e.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
            <h3 className="text-lg font-bold text-slate-900">Top 5 Organizações</h3>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Organização</th>
                  <th className="pb-3 text-right text-sm font-semibold text-slate-700">Eventos</th>
                  <th className="pb-3 text-right text-sm font-semibold text-slate-700">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topOrganizations.map((o, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-900">{o.name}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{o.events}</td>
                    <td className="py-3 text-right text-sm font-semibold text-emerald-600">R$ {(o.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
