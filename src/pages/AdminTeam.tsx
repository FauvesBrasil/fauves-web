import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Mail, Calendar, MoreVertical, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminTeam() {
  const { token } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('moderator');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/team-members', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) setTeam(d.team || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const roles = {
    'super-admin': { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    'admin': { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
    'moderator': { label: 'Moderador', color: 'bg-blue-100 text-blue-700' },
    'support': { label: 'Suporte', color: 'bg-teal-100 text-teal-700' }
  };

  const handleInvite = () => {
    // Simulation of invite action
    alert(`Convite enviado para ${inviteEmail} como ${roles[inviteRole as keyof typeof roles].label}`);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('moderator');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Equipe Admin</h1>
          <p className="text-slate-600 text-sm">Gerencie membros da equipe e permissões</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-3 h-9 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Membro</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{team.filter(t => t.active).length}</div>
              <div className="text-xs text-slate-600">Membros Ativos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{team.filter(t => t.role === 'super-admin').length}</div>
              <div className="text-xs text-slate-600">Super Admins</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{team.filter(t => t.role === 'admin').length}</div>
              <div className="text-xs text-slate-600">Administradores</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{team.filter(t => t.role === 'moderator' || t.role === 'support').length}</div>
              <div className="text-xs text-slate-600">Moderadores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-slate-600">Carregando membros...</p>
        </div>
      )}

      {!loading && (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Membro</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Função</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Entrou em</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {team.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">ID: {member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roles[member.role as keyof typeof roles].color}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {roles[member.role as keyof typeof roles].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Permissions Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Níveis de Permissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-slate-900">Super Admin</span>
            </div>
            <p className="text-sm text-slate-600">Acesso total ao sistema, incluindo configurações críticas e gestão de admins.</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-900">Administrador</span>
            </div>
            <p className="text-sm text-slate-600">Gerencia eventos, organizações, usuários e pedidos. Sem acesso a configurações críticas.</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-900">Moderador</span>
            </div>
            <p className="text-sm text-slate-600">Visualiza relatórios e pode moderar conteúdo de eventos. Sem edição de usuários.</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-slate-900">Suporte</span>
            </div>
            <p className="text-sm text-slate-600">Acesso a tickets de suporte e visualização básica de dados de usuários.</p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Convidar Membro</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Função</label>
                <select 
                  value={inviteRole} 
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
                >
                  <option value="moderator">Moderador</option>
                  <option value="support">Suporte</option>
                  <option value="admin">Administrador</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button 
                onClick={handleInvite}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enviar Convite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
