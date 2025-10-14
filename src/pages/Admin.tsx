import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || !user.isAdmin) return <div style={{padding:40}}>Acesso negado. Você precisa ser administrador.</div>;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#efefef'}}>
      <aside style={{width:260,background:'#0f172a',color:'#fff',padding:20,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <h2 style={{margin:0,marginBottom:8}}>Dashboard</h2>
          <nav>
            <ul style={{listStyle:'none',padding:0,margin:0}}>
              <li style={{marginBottom:12}}><Link to="/admin" style={{color:'#fff',textDecoration:'none'}}>Overview</Link></li>
              <li style={{marginBottom:8}}><Link to="/admin/users" style={{color:'#fff',textDecoration:'none'}}>Usuários</Link></li>
              <li style={{marginBottom:8}}><Link to="/admin/events" style={{color:'#fff',textDecoration:'none'}}>Eventos</Link></li>
              <li style={{marginBottom:8}}><Link to="/admin/orders" style={{color:'#fff',textDecoration:'none'}}>Pedidos</Link></li>
            </ul>
          </nav>
        </div>

        <div style={{marginTop:20,background:'#071029',padding:12,borderRadius:8,display:'flex',gap:12,alignItems:'center'}}>
          <div style={{width:48,height:48,borderRadius:999,background:'#0ea5a9',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>C</div>
          <div style={{color:'#fff'}}>
            <div style={{fontSize:14,fontWeight:700}}>{user?.name || 'Admin'}</div>
            <div style={{fontSize:12,opacity:0.8}}>{user?.email}</div>
          </div>
        </div>
      </aside>

      <main style={{flex:1,padding:20}}>
        {location.pathname === '/admin' ? <AdminDashboard /> : <div style={{maxWidth:1200,margin:'0 auto',background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}><Outlet /></div>}
      </main>
    </div>
  );
};

export default AdminLayout;
