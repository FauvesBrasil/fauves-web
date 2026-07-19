import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, Building2, Mail, Globe, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function AdminOrganizations() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [q, setQ] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async (p = page, pp = perPage, query = q) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), perPage: String(pp) });
      if (query) params.set('q', query);
      const res = await fetch('/api/admin/organizations?' + params.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'failed');
      }
      const data = await res.json();

      // Check if backend returned an error
      if (!data.ok) {
        throw new Error(data.error || 'Erro ao carregar organizações');
      }

      setOrganizations(data.organizations || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPerPage(data.perPage || pp);
    } catch (e: any) {
      // no-op
      setError(e?.message || 'Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  }, [token, page, perPage, q]);

  useEffect(() => { fetchOrganizations(1, perPage, q); }, [token, perPage, q, fetchOrganizations]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Organizações</h1>
          <p className="text-slate-600 text-sm">Gerencie todas as organizações da plataforma</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 h-9 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition font-medium">
          <Plus className="w-4 h-4" />
          <span>Nova Organização</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{total}</div>
              <div className="text-xs text-slate-600">Total de Organizações</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{organizations.filter(o => o.isActive !== false).length}</div>
              <div className="text-xs text-slate-600">Ativas</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{organizations.reduce((sum, o) => sum + (o.eventCount || 0), 0)}</div>
              <div className="text-xs text-slate-600">Total de Eventos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
          <select
            value={perPage}
            onChange={e => setPerPage(parseInt(e.target.value, 10))}
            className="px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
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
          <p className="text-slate-600">Carregando organizações...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 mb-0.5 text-sm">Erro ao carregar organizações</h3>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && organizations.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900 mb-1.5">Nenhuma organização encontrada</h3>
          <p className="text-slate-600">Ainda não há organizações cadastradas.</p>
        </div>
      )}

      {!loading && !error && organizations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-700">Organização</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-700">Slug</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-700">Eventos</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {organizations.map(org => (
                  <tr
                    key={org.id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => navigate(`/admin/organizations/${org.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {org.name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{org.name}</div>
                          <div className="text-xs text-slate-500">ID: {org.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{org.slug || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                        {org.eventCount || 0} eventos
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/${org.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded-lg transition font-medium"
                        >
                          Ver Página
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3">
          <button
            onClick={() => fetchOrganizations(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 px-3 h-9 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <span className="text-slate-700 text-sm font-medium">Página {page} de {totalPages}</span>
          <button
            onClick={() => fetchOrganizations(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1.5 px-3 h-9 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span>Próxima</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
