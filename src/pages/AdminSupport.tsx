import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

const AdminSupport = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetchApi(`/api/admin/tickets?status=${filter}`),
        fetchApi('/api/admin/tickets/stats'),
      ]);

      const ticketsData = await ticketsRes.json();
      const statsData = await statsRes.json();

      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = search === '' ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' || t.status === filter;

    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (priority: string) => {
    const styles = {
      'HIGH': 'bg-red-100 text-red-700',
      'NORMAL': 'bg-yellow-100 text-yellow-700',
      'LOW': 'bg-slate-100 text-slate-700'
    };
    return styles[priority as keyof typeof styles] || styles.NORMAL;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'OPEN': { className: 'bg-blue-100 text-blue-700', Icon: Clock },
      'IN_PROGRESS': { className: 'bg-yellow-100 text-yellow-700', Icon: AlertCircle },
      'CLOSED': { className: 'bg-green-100 text-green-700', Icon: CheckCircle },
    };
    return badges[status as keyof typeof badges] || badges.OPEN;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tickets de Suporte</h1>
        <p className="text-sm text-slate-600">Gerencie todos os tickets de suporte</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{stats.open}</div>
              <div className="text-xs text-slate-600">Abertos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{stats.inProgress}</div>
              <div className="text-xs text-slate-600">Em Andamento</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{stats.closed}</div>
              <div className="text-xs text-slate-600">Fechados</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{stats.total}</div>
              <div className="text-xs text-slate-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('OPEN')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'OPEN'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Abertos
            </button>
            <button
              onClick={() => setFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'CLOSED'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Fechados
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-slate-600">Carregando tickets...</div>
        </div>
      )}

      {/* Tickets Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Assunto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Prioridade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhum ticket encontrado
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const { className, Icon } = getStatusBadge(ticket.status);
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50 transition cursor-pointer"
                        onClick={() => window.location.href = `/admin/helpdesk/tickets/${ticket.id}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            #{ticket.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{ticket.subject}</span>
                            {ticket._count?.messages > 0 && (
                              <span className="text-xs text-slate-500">
                                ({ticket._count.messages} msgs)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700">
                            {ticket.user?.name || 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {ticket.status === 'IN_PROGRESS' ? 'Em Andamento' : ticket.status === 'CLOSED' ? 'Fechado' : 'Aberto'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
