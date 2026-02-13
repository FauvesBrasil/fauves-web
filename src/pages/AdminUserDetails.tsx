import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, User, Mail, Shield, Calendar, Clock, Edit2, Save, X,
  ShoppingCart, CreditCard, Ticket, Package, TrendingUp, DollarSign,
  AlertCircle, CheckCircle, XCircle, Building2, Key, Phone, MapPin,
  Briefcase, UserCheck, Bell, Lock, Eye, Activity
} from 'lucide-react';

export default function AdminUserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    name: '',
    isAdmin: false
  });
  const [saving, setSaving] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (!token || !userId) return;
    loadUserDetails();
  }, [token, userId]);

  const loadUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load user basic info
      const userRes = await fetch(`/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error('Erro ao carregar usuário');
      const userData = await userRes.json();
      
      if (!userData.ok) throw new Error(userData.error || 'Erro ao carregar');
      
      setUser(userData.user);
      setEditForm({
        email: userData.user.email || '',
        name: userData.user.name || '',
        isAdmin: userData.user.isAdmin || false
      });

      // Load stats
      const statsRes = await fetch(`/api/admin/user/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.ok) {
          setStats(statsData.stats);
        }
      }

      // Load analytics
      const analyticsRes = await fetch(`/api/admin/user/${userId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.ok) {
          setAnalytics(analyticsData.analytics);
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
    if (user) {
      setEditForm({
        email: user.email || '',
        name: user.name || '',
        isAdmin: user.isAdmin || false
      });
    }
  };

  const handleSave = async () => {
    if (!user || !token) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/user/${userId}/update`, {
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

      setUser(data.user);
      setIsEditing(false);
      alert('Usuário atualizado com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    if (!confirm(`Tem certeza que deseja resetar a senha do usuário ${user.name || user.email}?`)) {
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/user/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.message || data.error || 'Erro ao resetar senha');
      }

      alert('Senha resetada com sucesso!');
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (err: any) {
      alert(`Erro ao resetar senha: ${err.message}`);
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Usuário não encontrado'}</p>
          <button 
            onClick={() => navigate('/admin/users')}
            className="text-purple-600 hover:underline"
          >
            Voltar para usuários
          </button>
        </div>
      </div>
    );
  }

  const paymentStatusColors: Record<string, { bg: string; text: string; icon: any }> = {
    'PAID': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Sem nome'}</h1>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              {user.isAdmin && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Usuário</h2>
              
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
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isAdmin}
                        onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Permissões de Administrador
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Administradores têm acesso total ao painel admin
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="text-gray-900 font-medium">{user.name || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Permissões</p>
                    <p className="text-gray-900 font-medium">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-purple-700">
                          <Shield className="w-4 h-4" />
                          Administrador
                        </span>
                      ) : (
                        'Usuário comum'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Reset */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Resetar Senha</h2>
                {!showPasswordReset && (
                  <button
                    onClick={() => setShowPasswordReset(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Resetar
                  </button>
                )}
              </div>

              {showPasswordReset ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Atenção!</p>
                      <p>Esta ação irá alterar a senha do usuário. Ele precisará usar a nova senha para fazer login.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo de 4 caracteres</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword('');
                      }}
                      disabled={resettingPassword}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !newPassword}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {resettingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Resetando...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Confirmar Reset
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Clique em "Resetar" para definir uma nova senha para este usuário.
                </p>
              )}
            </div>

            {/* Personal Data Complete */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais Completos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome Completo</p>
                  <p className="text-gray-900 font-medium">
                    {user.name && user.surname ? `${user.name} ${user.surname}` : user.name || '—'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telefone
                  </p>
                  <p className="text-gray-900 font-medium">{user.phone || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">CPF</p>
                  <p className="text-gray-900 font-medium">{user.cpf || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data de Nascimento
                  </p>
                  <p className="text-gray-900 font-medium">
                    {user.birth ? new Date(user.birth).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Função</p>
                  <p className="text-gray-900 font-medium">{user.role || 'Usuário'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {(user.address || user.city || user.state || user.cep) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Logradouro</p>
                    <p className="text-gray-900 font-medium">{user.address || '—'}</p>
                  </div>
                  
                  {user.complement && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Complemento</p>
                      <p className="text-gray-900 font-medium">{user.complement}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Cidade</p>
                    <p className="text-gray-900 font-medium">{user.city || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="text-gray-900 font-medium">{user.state || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">CEP</p>
                    <p className="text-gray-900 font-medium">{user.cep || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">País</p>
                    <p className="text-gray-900 font-medium">{user.country || 'Brasil'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Organizations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organizações
                {user.organizations && user.organizations.length > 0 && (
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {user.organizations.length} {user.organizations.length === 1 ? 'organização' : 'organizações'}
                  </span>
                )}
              </h2>
              
              {user.organizations && user.organizations.length > 0 ? (
                <div className="space-y-3">
                  {user.organizations.map((org: any) => (
                    <div 
                      key={org.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/organizations/${org.id}`)}
                    >
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {org.name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{org.name}</p>
                        <p className="text-sm text-gray-500">
                          {org.role || 'Membro'} • Desde {new Date(org.joinedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Este usuário não faz parte de nenhuma organização</p>
                </div>
              )}
            </div>

            {/* Events Created */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Eventos Criados
              </h2>
              
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                  <Ticket className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{user.eventsCreated || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user.eventsCreated === 0 ? 'Nenhum evento criado' : 
                   user.eventsCreated === 1 ? 'evento criado' : 'eventos criados'}
                </p>
              </div>
            </div>

            {/* Activity & Privacy */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividade e Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <span className={`text-sm font-semibold ${user.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Último Acesso</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {user.lastAccess ? new Date(user.lastAccess).toLocaleString('pt-BR') : '—'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Conta criada há</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {user.daysSinceJoined} {user.daysSinceJoined === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Preferences */}
            {user.emailPreferences && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Preferências de Privacidade
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Receber Newsletter</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.emailPreferences.receiveNewsletter 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.emailPreferences.receiveNewsletter ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Atualizações de Eventos</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.emailPreferences.receiveEventUpdates 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.emailPreferences.receiveEventUpdates ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Promoções</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.emailPreferences.receivePromotions 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.emailPreferences.receivePromotions ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Permitir Contato</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.emailPreferences.allowContact 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.emailPreferences.allowContact ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                {user.privacy && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Configurações de Privacidade:</strong> {user.privacy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stats Overview */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">Pedidos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Gasto Total</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {stats.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-600 font-medium">Ingressos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.ticketsOwned}</p>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-600 font-medium">Eventos</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.eventsAttended}</p>
                  </div>
                </div>

                {/* Orders Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Pedidos por Status</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600">Pagos</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stats.paidOrders}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-gray-600">Pendentes</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-gray-600">Cancelados</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stats.cancelledOrders}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organizations */}
            {stats?.organizations && stats.organizations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizações Criadas</h2>
                <div className="space-y-2">
                  {stats.organizations.map((org: any) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/organizations/${org.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          {org.slug && (
                            <p className="text-xs text-gray-500">/{org.slug}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {stats?.recentOrders && stats.recentOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Recentes</h2>
                <div className="space-y-3">
                  {stats.recentOrders.map((order: any) => {
                    const statusInfo = paymentStatusColors[order.paymentStatus] || paymentStatusColors['PENDING'];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div 
                        key={order.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{order.eventName || 'Sem nome'}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {order.paymentStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>#{order.code}</span>
                            <span>R$ {order.totalAmount.toFixed(2)}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Analytics & Insights */}
            {analytics && (
              <>
                {/* Organizações Favoritas */}
                {analytics.favoriteOrganizations && analytics.favoriteOrganizations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizações Favoritas</h2>
                    <div className="space-y-3">
                      {analytics.favoriteOrganizations.map((org: any) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => navigate(`/admin/organizations/${org.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{org.name}</p>
                              <p className="text-xs text-gray-500">
                                {org.orderCount} pedidos • {org.eventCount} eventos
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              R$ {org.totalSpent.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorias Favoritas */}
                {analytics.favoriteCategories && analytics.favoriteCategories.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorias de Interesse</h2>
                    <div className="flex flex-wrap gap-2">
                      {analytics.favoriteCategories.map((cat: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {cat.category}
                          <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            {cat.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Padrão de Compras */}
                {analytics.purchasePattern && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Padrão de Compras</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium mb-1">Primeira Compra</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {analytics.purchasePattern.firstPurchase 
                              ? new Date(analytics.purchasePattern.firstPurchase).toLocaleDateString('pt-BR')
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium mb-1">Última Compra</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {analytics.purchasePattern.lastPurchase 
                              ? new Date(analytics.purchasePattern.lastPurchase).toLocaleDateString('pt-BR')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ticket Médio</span>
                          <span className="text-sm font-semibold text-gray-900">
                            R$ {analytics.purchasePattern.avgOrderValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Menor Compra</span>
                          <span className="text-sm font-semibold text-gray-900">
                            R$ {analytics.purchasePattern.minOrderValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Maior Compra</span>
                          <span className="text-sm font-semibold text-gray-900">
                            R$ {analytics.purchasePattern.maxOrderValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taxa de Conversão</span>
                          <span className="text-sm font-semibold text-green-600">
                            {analytics.purchasePattern.conversionRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Dia Favorito</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {analytics.purchasePattern.favoriteDayOfWeek}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Horário Favorito</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {analytics.purchasePattern.favoriteTimeOfDay}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipos de Ingresso Preferidos */}
                {analytics.ticketTypePreferences && analytics.ticketTypePreferences.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Ingresso Preferidos</h2>
                    <div className="space-y-2">
                      {analytics.ticketTypePreferences.map((ticket: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
                              {ticket.count}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{ticket.ticketType}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            Média: R$ {ticket.avgPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gastos por Mês */}
                {analytics.spendingByMonth && analytics.spendingByMonth.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Gastos (12 meses)</h2>
                    <div className="space-y-2">
                      {analytics.spendingByMonth.slice(0, 6).map((month: any) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{month.month}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              R$ {month.totalSpent.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">{month.orderCount} pedidos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eventos Futuros */}
                {analytics.upcomingEvents && analytics.upcomingEvents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Eventos</h2>
                    <div className="space-y-3">
                      {analytics.upcomingEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                            <p className="text-xs text-gray-500">{event.organizationName}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(event.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">{/* Technical Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes Técnicos</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">ID</p>
                  <p className="text-sm text-gray-900 font-mono break-all">{user.id}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Cadastro</p>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    {' • '}
                    {new Date(user.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/orders', { state: { filterUser: user.id } })}
                  className="w-full flex items-center gap-2 text-sm text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ver todos os pedidos
                </button>
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="w-full flex items-center gap-2 text-sm text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Resetar senha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
