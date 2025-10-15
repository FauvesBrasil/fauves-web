

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditModal from '../admin/components/EditModal';

export default function AdminUsers(){
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserObj, setEditUserObj] = useState<any>(null);
  const [editValues, setEditValues] = useState<any>({});

  const openEdit = (u:any) => {
    setEditUserObj(u);
    setEditValues({ email: u.email, name: u.name, isAdmin: u.isAdmin });
    setEditOpen(true);
  };

  const handleEditChange = (field:string, value:any) => {
    setEditValues((prev:any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if(!token || !editUserObj) return;
    const body: any = { userId: editUserObj.id };
    if(editValues.email) body.email = editValues.email;
    if(editValues.name) body.name = editValues.name;
    body.isAdmin = editValues.isAdmin;
    const res = await fetch('/api/admin/update-user', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
    if(!res.ok) { alert('Falha ao editar usuário'); return; }
    const j = await res.json();
    if(j.ok) setUsers(prev=> prev.map(x=> x.id===editUserObj.id ? j.user : x));
    setEditOpen(false);
    setEditUserObj(null);
  };
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [q, setQ] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const toggle = async (id:string, cur:boolean)=>{
    if(!token) return;
    try{
      const res = await fetch('/api/admin/toggle-admin', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ userId:id, isAdmin: !cur }) });
      if(!res.ok) throw new Error('failed');
      const j = await res.json();
      setUsers(u=>u.map(x=> x.id===id ? { ...x, isAdmin: j.user.isAdmin } : x));
    }catch(e){
      // ignore for now or show toast
      console.error('toggle admin error', e);
    }
  };

  const editUser = async (u:any)=>{
    if(!token) return;
    const newEmail = prompt('Email:', u.email) || undefined;
    const newName = prompt('Nome:', u.name) || undefined;
    const newIsAdmin = confirm('Tornar administrador? OK = Sim, Cancel = Não');
    const body: any = { userId: u.id };
    if(newEmail) body.email = newEmail;
    if(newName) body.name = newName;
    body.isAdmin = newIsAdmin;
    const res = await fetch('/api/admin/update-user', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
    if(!res.ok) return alert('Falha ao editar usuário');
    const j = await res.json();
    if(j.ok) setUsers(prev=> prev.map(x=> x.id===u.id ? j.user : x));
  };

  const deactivate = async (u:any)=>{
    if(!token) return;
    if(!confirm('Tem certeza que deseja desativar este usuário?')) return;
    const res = await fetch('/api/admin/deactivate-user', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ userId: u.id }) });
    if(!res.ok) return alert('Falha ao desativar');
    const j = await res.json();
    if(j.ok) setUsers(prev=> prev.filter(x=> x.id!==u.id));
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return <div>
    <h1>Usuários</h1>

    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
      <input placeholder="Buscar por email ou nome" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,padding:8}} />
      <label style={{display:'flex',alignItems:'center',gap:8}}>
        Por página
        <select value={perPage} onChange={e=>setPerPage(parseInt(e.target.value,10))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
    </div>

    {loading && <div>Carregando...</div>}
    {error && <div style={{color:'red'}}>Erro: {error}</div>}

    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr><th style={{textAlign:'left'}}>Email</th><th style={{textAlign:'left'}}>Nome</th><th style={{textAlign:'left'}}>Admin</th><th></th></tr></thead>
      <tbody>
        {users.map(u=> <tr key={u.id} style={{borderTop:'1px solid #eee'}}>
          <td>{u.email}</td>
          <td>{u.name}</td>
          <td>{u.isAdmin? 'Sim':'Não'}</td>
          <td style={{display:'flex',gap:8}}>
            <button onClick={()=>toggle(u.id, u.isAdmin)}>{u.isAdmin? 'Remover' : 'Tornar'}</button>
            <button onClick={()=>editUser(u)}>Editar</button>
            <button onClick={()=>deactivate(u)} style={{color:'crimson'}}>Desativar</button>
          </td>
        </tr>)}
        {users.length===0 && !loading && <tr><td colSpan={4} style={{padding:16}}>Nenhum usuário encontrado</td></tr>}
      </tbody>
    </table>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
      <div>Total: {total}</div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button disabled={page<=1 || loading} onClick={()=>{ setPage(p=>{ const np = Math.max(1,p-1); fetchUsers(np); return np; }); }}>Anterior</button>
        <div>Pagina {page} / {totalPages}</div>
        <button disabled={page>=totalPages || loading} onClick={()=>{ setPage(p=>{ const np = Math.min(totalPages,p+1); fetchUsers(np); return np; }); }}>Próxima</button>
      </div>
    </div>
    <EditModal
      open={editOpen}
      title="Editar Usuário"
      fields={[{name:'email',label:'Email'},{name:'name',label:'Nome'},{name:'isAdmin',label:'Administrador',type:'checkbox'}]}
      values={editValues}
      onChange={(name, value) => {
        if(name==='isAdmin') value = value==='true'||value===true||value===1||value==='on';
        handleEditChange(name, value);
      }}
      onSave={handleEditSave}
      onClose={()=>{setEditOpen(false);setEditUserObj(null);}}
    />
    </div>
}
