import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Building2, Calendar, DollarSign, TrendingUp,
  Package, Users, Edit2, Save, X, CheckCircle, Clock,
  Activity, BarChart3, Ticket, Link as LinkIcon
} from 'lucide-react';

export default function AdminOrganizationDetails() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    platformFeePercent: 15
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !orgId) return;
    loadOrganizationDetails();
  }, [token, orgId]);

  const loadOrganizationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load organization basic info
      const orgRes = await fetch(`/api/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!orgRes.ok) throw new Error('Erro ao carregar organização');
      const orgData = await orgRes.json();

      if (!orgData.ok) throw new Error(orgData.error || 'Erro ao carregar');

      setOrganization(orgData.organization);
      setEditForm({
        name: orgData.organization.name || '',
        slug: orgData.organization.slug || '',
        description: orgData.organization.description || '',
        logoUrl: orgData.organization.logoUrl || '',
        platformFeePercent: orgData.organization.platformFeePercent || 15
      });

      // Load stats
      const statsRes = await fetch(`/api/admin/organizations/${orgId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.ok) {
          setStats(statsData.stats);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (organization) {
      setEditForm({
        name: organization.name || '',
        slug: organization.slug || '',
        description: organization.description || '',
        logoUrl: organization.logoUrl || '',
        platformFeePercent: organization.platformFeePercent || 15
      });
    }
  };

  const handleSave = async () => {
    if (!organization || !token) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || data.error || 'Erro ao atualizar');
      }

      setOrganization(data.organization);
      setIsEditing(false);
      alert('Organização atualizada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando organização...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Organização não encontrada'}</p>
          <button
            onClick={() => navigate('/admin/organizations')}
            className="text-purple-600 hover:underline"
          >
            Voltar para organizações
          </button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'PUBLICADO': 'bg-green-100 text-green-800',
    'RASCUNHO': 'bg-gray-100 text-gray-800',
    'ENCERRADO': 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/organizations')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                {organization.logoUrl ? (
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                  {organization.slug && (
                    <p className="text-sm text-gray-500">/{organization.slug}</p>
                  )}
                </div>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form / Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Organização</h2>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL amigável)
                    </label>
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="ex: minha-organizacao"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Descrição da organização..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Logo
                    </label>
                    <input
                      type="text"
                      value={editForm.logoUrl}
                      onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa da Plataforma (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editForm.platformFeePercent}
                        onChange={(e) => setEditForm({ ...editForm, platformFeePercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="15"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Padrão: 15% • Essa taxa será aplicada em todos os eventos da organização
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="text-gray-900 font-medium">{organization.name}</p>
                  </div>

                  {organization.slug && (
                    <div>
                      <p className="text-sm text-gray-500">Slug</p>
                      <p className="text-gray-900 font-mono">{organization.slug}</p>
                    </div>
                  )}

                  {organization.description && (
                    <div>
                      <p className="text-sm text-gray-500">Descrição</p>
                      <p className="text-gray-900">{organization.description}</p>
                    </div>
                  )}

                  {organization.logoUrl && (
                    <div>
                      <p className="text-sm text-gray-500">Logo</p>
                      <img
                        src={organization.logoUrl}
                        alt="Logo"
                        className="mt-2 w-32 h-32 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500">Taxa da Plataforma</p>
                    <p className="text-gray-900 font-semibold text-lg">
                      {organization.platformFeePercent || 15}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Aplicada em todos os eventos dessa organização
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">Eventos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Receita</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {(stats.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-600 font-medium">Ingressos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.ticketsSold}</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-600 font-medium">Pedidos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Receita Detalhada</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Receita Bruta</span>
                      <span className="text-sm font-semibold text-gray-900">
                        R$ {(stats.totalRevenue || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxa Plataforma ({organization.platformFeePercent || 15}%)</span>
                      <span className="text-sm font-semibold text-red-600">
                        - R$ {(stats.platformFee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-900">Receita Líquida</span>
                      <span className="text-sm font-bold text-green-600">
                        R$ {(stats.netRevenue || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Events by Status */}
            {stats?.eventsByStatus && stats.eventsByStatus.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Status</h2>
                <div className="space-y-2">
                  {stats.eventsByStatus.map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Events */}
            {stats?.recentEvents && stats.recentEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Eventos Recentes</h2>
                <div className="space-y-3">
                  {stats.recentEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-800'}`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes Técnicos</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">ID</p>
                  <p className="text-sm text-gray-900 font-mono break-all">{organization.id}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Criado em</p>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(organization.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    {' • '}
                    {new Date(organization.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {organization.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Atualizado em</p>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {new Date(organization.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                      {' • '}
                      {new Date(organization.updatedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h2>
              <div className="space-y-2">
                <a
                  href={`/org/${organization.slug || organization.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
                >
                  <LinkIcon className="w-4 h-4" />
                  Ver página pública
                </a>
                <button
                  onClick={() => navigate('/admin/events', { state: { filterOrg: organization.id } })}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
                >
                  <Package className="w-4 h-4" />
                  Ver todos os eventos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

