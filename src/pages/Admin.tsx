import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Headphones,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Image,
  MessageSquare,
  BookOpen,
  Mic2,
  Megaphone,
  Mail,
  TrendingUp
} from 'lucide-react';

const menu = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'events', to: '/admin/events', label: 'Eventos & Vendas', icon: Calendar },
  { key: 'categories', to: '/admin/categories', label: 'Categorias', icon: Calendar },
  { key: 'artists', to: '/admin/artists', label: 'Artistas', icon: Mic2 },
  { key: 'slides', to: '/admin/slides', label: 'Slides Homepage', icon: Image },
  { key: 'announcements', to: '/admin/announcements', label: 'Anúncios', icon: Megaphone },
  { key: 'emails', to: '/admin/emails', label: 'Emails', icon: Mail },
  { key: 'organizations', to: '/admin/organizations', label: 'Organizações', icon: Building2 },
  { key: 'users', to: '/admin/users', label: 'Usuários', icon: Users },
  { key: 'leads', to: '/admin/leads', label: 'Leads & Newsletter', icon: UserCog },
  { key: 'finance', to: '/admin/orders', label: 'Financeiro', icon: DollarSign },
];

const menuSecondary = [
  { key: 'helpdesk', to: '/admin/helpdesk', label: 'Helpdesk', icon: Headphones },
  { key: 'reports', to: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
  { key: 'analytics', to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'team', to: '/admin/team', label: 'Equipe', icon: UserCog },
  { key: 'settings', to: '/admin/settings', label: 'Configurações', icon: Settings },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpdeskNotifications, setHelpdeskNotifications] = useState({
    pendingTickets: 0,
    activeChats: 0,
  });

  // Fetch helpdesk notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [ticketsRes] = await Promise.all([
          fetch('http://localhost:4000/api/admin/tickets/stats'),
          // TODO: Add chat stats endpoint
        ]);

        const ticketsData = await ticketsRes.json();

        setHelpdeskNotifications({
          pendingTickets: ticketsData.open + ticketsData.inProgress,
          activeChats: 0, // TODO: Get from chat stats
        });
      } catch (error) {
        // no-op
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
          <p className="text-slate-600 mb-6">Você precisa ser administrador para acessar esta área.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      {/* Sidebar Desktop */}
      <aside className={`fixed top-0 left-0 h-screen bg-slate-900 text-white transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-xl">
                  🐾
                </div>
                <div>
                  <div className="text-base font-bold">Fauves Admin</div>
                  <div className="text-xs text-slate-400">Painel de Controle</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${active
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : ''} transition-transform group-hover:scale-110`} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-slate-800" />

          {/* Secondary Navigation */}
          <div className="space-y-1">
            {/* Helpdesk with Submenu */}
            <div>
              <Link
                to="/admin/helpdesk"
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${location.pathname.startsWith('/admin/helpdesk')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                title={!sidebarOpen ? 'Helpdesk' : ''}
              >
                <Headphones className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm font-medium">Helpdesk</span>}
              </Link>

              {/* Helpdesk Submenu */}
              {sidebarOpen && location.pathname.startsWith('/admin/helpdesk') && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    to="/admin/helpdesk/tickets"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${location.pathname.startsWith('/admin/helpdesk/tickets')
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tickets</span>
                  </Link>
                  <Link
                    to="/admin/helpdesk/live-chat"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${location.pathname.startsWith('/admin/helpdesk/live-chat')
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Live Chat</span>
                  </Link>
                  <Link
                    to="/admin/helpdesk/knowledge-base"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${location.pathname.startsWith('/admin/helpdesk/knowledge-base')
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Central de Ajuda</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Other Secondary Menu Items */}
            {menuSecondary.filter(item => item.key !== 'helpdesk').map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-800">
          <div className={`${sidebarOpen ? 'bg-slate-800' : ''} rounded-xl p-3`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => logout()}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-xl">
                  🐾
                </div>
                <div>
                  <div className="text-base font-bold">Fauves Admin</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
              <div className="space-y-1">
                {menu.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${active
                        ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="my-4 border-t border-slate-800" />
              <div className="space-y-1">
                {menuSecondary.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar Mobile */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center text-base">
              🐾
            </div>
            <span className="font-bold text-slate-900">Fauves Admin</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {location.pathname === '/admin' ? <AdminDashboard /> : <div className="max-w-[1400px] mx-auto"><Outlet /></div>}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
