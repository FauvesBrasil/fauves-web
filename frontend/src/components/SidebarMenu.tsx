import React from "react";
import { createPortal } from 'react-dom';
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
  const [tooltip, setTooltip] = React.useState<{ text: string; x: number; y: number; visible: boolean } | null>(null);

  const showTooltip = (text: string, el: HTMLElement | null) => {
    try {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const xGap = 12;
      const x = r.right + xGap; // position to the right of the button
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const tooltipHeightGuess = 28; // approx height of tooltip box
      let y = r.top + (r.height / 2);
      // clamp vertically so tooltip doesn't overflow viewport
      const minY = 8 + (tooltipHeightGuess / 2);
      const maxY = viewportH - (tooltipHeightGuess / 2) - 8;
      if (y < minY) y = minY;
      if (y > maxY) y = maxY;
      setTooltip({ text, x, y, visible: true });
    } catch (e) {}
  };
  const hideTooltip = () => setTooltip(null);

  return (
  <div ref={ref} className="fixed top-0 left-0 flex flex-col gap-8 items-center pt-0 bg-[#F8F7FA] dark:bg-[#0b0b0b] border-r border-solid border-gray-100 dark:border-[#1F1F1F] h-screen w-[70px] z-20 max-md:relative max-md:flex-row max-md:gap-5 max-md:p-2.5 max-md:h-auto max-md:w-[60px] max-sm:hidden fauves-left-sidebar" data-sidebar="main" data-sidebar-main="true">
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
            <div key={item.key} className="relative flex items-center justify-center">
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-orange-100 dark:bg-[#242424]' : 'hover:bg-indigo-100 dark:hover:bg-[#1F1F1F]'}`}
                title={item.label}
                onClick={() => navigate(item.route)}
                onMouseEnter={(e) => showTooltip(item.label, e.currentTarget as HTMLElement)}
                onMouseLeave={() => hideTooltip()}
              >
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-700 dark:text-slate-300'}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Ajuda no final da sidebar */}
      <div className="flex flex-col justify-end flex-shrink-0 w-full mt-auto">
        <div className="relative flex items-center justify-center mb-6">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100 dark:hover:bg-[#1F1F1F] transition-colors" title="Ajuda" onMouseEnter={(e) => showTooltip('Ajuda', e.currentTarget as HTMLElement)} onMouseLeave={() => hideTooltip()}>
            <HelpCircle className="w-6 h-6 text-gray-500 dark:text-slate-300 hover:text-gray-700 transition-colors" />
          </button>
        </div>
      </div>
    {tooltip && typeof document !== 'undefined' && createPortal(
      <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2147483647 }}>
        <div className="bg-[#F8F7FA] dark:bg-[#0b0b0b] text-indigo-700 dark:text-white text-xs font-semibold px-2 py-1 rounded shadow whitespace-nowrap">{tooltip.text}</div>
      </div>, document.body)}
    </div>
  );
};

export default SidebarMenu;
