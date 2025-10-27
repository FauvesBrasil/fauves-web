import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
import { SectionCard } from '@/components/SectionCard';

const menu = [
  { key: 'dashboard', to: '/admin', label: '🏠 Dashboard' },
  { key: 'events', to: '/admin/events', label: '🎫 Eventos & Vendas' },
  { key: 'organizers', to: '/admin/users', label: '👤 Organizadores' },
  { key: 'finance', to: '/admin/orders', label: '💸 Financeiro' },
  { key: 'support', to: '/admin', label: '🎧 Suporte' },
  { key: 'reports', to: '/admin', label: '📊 Relatórios' },
  { key: 'team', to: '/admin', label: '👥 Equipe' },
  { key: 'settings', to: '/admin', label: '⚙ Configurações' },
];

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || !user.isAdmin) return <div style={{padding:40}}>Acesso negado. Você precisa ser administrador.</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 flex items-center justify-center bg-slate-800 rounded-md">🐾</div>
            <div>
              <div className="text-base font-semibold">Fauves Admin</div>
              <div className="text-xs text-slate-300">Painel de administração</div>
            </div>
          </div>

          <nav>
            <ul className="flex flex-col gap-2 p-0 m-0 list-none">
              {menu.map((m)=> {
                const active = location.pathname.startsWith(m.to);
                return (
                  <li key={m.key}>
                    <Link to={m.to} className={`flex items-center gap-3 p-2 rounded-md ${active ? 'text-teal-400 bg-teal-900/5' : 'text-slate-300 hover:bg-white/2 hover:text-white'}`}>
                      <span className="w-5 inline-block">{m.label.split(' ')[0]}</span>
                      <span className="text-sm truncate">{m.label.replace(m.label.split(' ')[0],'')}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-4">
          <SectionCard padded={true} variant="muted">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">C</div>
              <div>
                <div className="text-sm font-semibold">{user?.name || 'Admin'}</div>
                <div className="text-xs text-slate-300">{user?.email}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </aside>

      <main className="flex-1 p-7">
        {location.pathname === '/admin' ? <AdminDashboard /> : <div className="max-w-[1200px] mx-auto"><Outlet /></div>}
      </main>
    </div>
  );
};

export default AdminLayout;
