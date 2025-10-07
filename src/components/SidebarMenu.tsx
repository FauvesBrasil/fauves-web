import React from "react";
import { useRegisterSidebar } from '@/context/LayoutOffsetsContext';
import { useNavigate, useLocation } from "react-router-dom";
import { HelpCircle, Home, Calendar, ClipboardList, Megaphone, BarChart2, Banknote, Settings } from "lucide-react";
import logoSquare from "@/assets/logo-square-fauves-blue.svg";

type SidebarMenuProps = {
  activeKeyOverride?: string;
};

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeKeyOverride }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to menu keys
  const menuItems = [
    { key: 'painel', label: 'Painel', icon: Home, route: '/organizer-dashboard' },
    { key: 'eventos', label: 'Eventos', icon: Calendar, route: '/organizer-events' },
    { key: 'pedidos', label: 'Pedidos', icon: ClipboardList, route: '/organizer-orders' },
    { key: 'marketing', label: 'Marketing', icon: Megaphone, route: '/organizer-marketing' },
    { key: 'relatorios', label: 'Relatórios', icon: BarChart2, route: '/organizer-reports' },
    { key: 'financas', label: 'Finanças', icon: Banknote, route: '/organizer-finances' },
    { key: 'ajustes', label: 'Ajustes', icon: Settings, route: '/organizer-settings' },
  ];

  // Find which menu is active
  const computedKey = menuItems.find(item => location.pathname.startsWith(item.route))?.key ||
    (location.pathname === '/organizer-dashboard' ? 'painel' : '');
  const activeKey = activeKeyOverride || computedKey;
  const ref = React.useRef<HTMLDivElement | null>(null);
  useRegisterSidebar('main', ref, true);
  return (
  <div ref={ref} className="fixed top-0 left-0 flex flex-col gap-8 items-center pt-0 bg-[#F8F7FA] border-r border-solid border-gray-100 h-screen w-[70px] z-20 max-md:relative max-md:flex-row max-md:gap-5 max-md:p-2.5 max-md:h-auto max-md:w-[60px] max-sm:hidden fauves-left-sidebar" data-sidebar="main" data-sidebar-main="true">
      {/* Logo quadrado no topo, clicável */}
      <button className="w-[55px] rounded-lg flex items-center justify-center mb-0 overflow-hidden focus:outline-none" onClick={() => navigate("/organizer-dashboard") } title="Painel">
        <img src={logoSquare} alt="Logo Fauves" className="w-full h-full object-contain" />
      </button>
      {/* Menu icons com texto flutuante */}
      <div className="flex flex-col gap-6 items-center w-full relative flex-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <div key={item.key} className="relative flex items-center justify-center group">
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-orange-100' : 'hover:bg-indigo-100'}`}
                title={item.label}
                onClick={() => navigate(item.route)}
              >
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-orange-600' : 'text-indigo-700'}`} />
              </button>
              <span className={`fixed left-16 opacity-0 group-hover:opacity-100 bg-[#F8F7FA] ${isActive ? 'text-orange-600' : 'text-indigo-700'} text-xs font-semibold px-2 py-1 rounded shadow transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50`}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Ajuda no final da sidebar */}
      <div className="flex flex-col justify-end flex-shrink-0 w-full mt-auto">
        <div className="relative flex items-center justify-center group mb-6">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100 transition-colors" title="Ajuda">
            <HelpCircle className="w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors" />
          </button>
          <span className="fixed left-16 opacity-0 group-hover:opacity-100 bg-[#F8F7FA] text-gray-700 text-xs font-semibold px-2 py-1 rounded shadow transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">Ajuda</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;
