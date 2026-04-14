import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, User, Shield, Mail, Calendar, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';

export default function AdminUsers(){
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [q, setQ] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editValues, setEditValues] = useState<any>({});

  const fetchUsers = useCallback(async (p = page, pp = perPage, query = q) => {
    if(!token) return;
    setLoading(true);
    setError(null);
    try{
      const params = new URLSearchParams({ page: String(p), perPage: String(pp) });
      if(query) params.set('q', query);
      const res = await fetch('/api/admin/users?' + params.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'failed');
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPerPage(data.perPage || pp);
    }catch(e:any){
      setError(e?.message || 'Erro ao carregar usuários');
    }finally{
      setLoading(false);
    }
  },[token, page, perPage, q]);

  useEffect(()=>{ fetchUsers(1, perPage, q); },[token, perPage, q, fetchUsers]);

  const toggleAdmin = async (id:string, cur:boolean)=>{
    if(!token) return;
    try{
      const res = await fetch('/api/admin/toggle-admin', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ userId:id, isAdmin: !cur }) });
      if(!res.ok) throw new Error('failed');
      const j = await res.json();
      setUsers(u=>u.map(x=> x.id===id ? { ...x, isAdmin: j.user.isAdmin } : x));
    }catch(e){
      // no-op
    }
  };

  const openEditModal = (u:any) => {
    setEditUser(u);
    setEditValues({ email: u.email, name: u.name, isAdmin: u.isAdmin });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if(!token || !editUser) return;
    const body: any = { userId: editUser.id };
    if(editValues.email) body.email = editValues.email;
    if(editValues.name) body.name = editValues.name;
    body.isAdmin = editValues.isAdmin;
    const res = await fetch('/api/admin/update-user', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
    if(!res.ok) { alert('Falha ao editar usuário'); return; }
    const j = await res.json();
    if(j.ok) setUsers(prev=> prev.map(x=> x.id===editUser.id ? j.user : x));
    setEditOpen(false);
    setEditUser(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Usuários</h1>
          <p className="text-slate-600 text-sm">Gerencie todos os usuários da plataforma</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{total}</div>
              <div className="text-xs text-slate-600">Total de Usuários</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{users.filter(u => u.isAdmin).length}</div>
              <div className="text-xs text-slate-600">Administradores</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{users.filter(u => !u.isAdmin).length}</div>
              <div className="text-xs text-slate-600">Usuários Regulares</div>
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
              placeholder="Buscar usuários por nome ou email..." 
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
          <p className="text-slate-600">Carregando usuários...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2.5">
            <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 mb-0.5 text-sm">Erro ao carregar usuários</h3>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900 mb-1.5">Nenhum usuário encontrado</h3>
          <p className="text-slate-600">Nenhum resultado corresponde aos filtros.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Cadastro</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(u => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name || 'Sem nome'}</div>
                          <div className="text-xs text-slate-500">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.isAdmin 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {u.isAdmin ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {u.createdAt ? (
                            <>
                              <span>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                              <span className="text-slate-400">•</span>
                              <span>{new Date(u.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(u);
                          }}
                          className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition font-medium"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAdmin(u.id, u.isAdmin);
                          }}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
                        >
                          {u.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4">
          <button 
            onClick={() => fetchUsers(page - 1)} 
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>
          <span className="text-slate-700 font-medium">Página {page} de {totalPages}</span>
          <button 
            onClick={() => fetchUsers(page + 1)} 
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span>Próxima</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Editar Usuário</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
                <input 
                  type="text" 
                  value={editValues.name || ''} 
                  onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={editValues.email || ''} 
                  onChange={e => setEditValues({ ...editValues, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isAdmin"
                  checked={editValues.isAdmin || false} 
                  onChange={e => setEditValues({ ...editValues, isAdmin: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700 cursor-pointer">Administrador</label>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button 
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
