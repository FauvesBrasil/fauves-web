import React, { useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import reportsSvg from '@/assets/reports.svg';

const sideMenu = [
  { label: 'Pagamentos', active: true },
  { label: 'Despesas e créditos' },
  { label: 'Notas Fiscais e Faturas' },
  { label: 'Configurações' },
];

const tabs = [
  'Por data de pagamento',
  'Por data de evento',
];

export default function OrganizerFinances() {
  const [activeMenu, setActiveMenu] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  // Estado vazio para exemplo
  const hasPayments = false;

  const menuTabs = [
    'Pagamentos',
    'Despesas e créditos',
    'Notas Fiscais e Faturas',
    'Configurações',
  ];

  return (
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">
      <SidebarMenu activeKeyOverride="financas" />
      <div className="rounded-3xl w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-32">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">
          <h1 className="text-5xl font-extrabold text-[#231942] mb-2">Finanças</h1>
          <div className="flex items-center gap-6 border-b border-zinc-200 -mb-2">
            {menuTabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveMenu(i)}
                className={`pb-2 text-base font-bold transition ${activeMenu === i ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                className={`px-6 py-2 rounded-lg font-bold text-base ${activeTab === i ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'} transition`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-zinc-500 mb-4 text-sm">Veja a lista de pagamentos que foram enviados para sua conta bancária</div>
          <div className="flex gap-4 mb-6">
            <button className="border px-5 py-2 rounded-lg font-bold text-zinc-700 flex items-center gap-2">
              <span className="material-icons">filter_alt</span> Filtros
            </button>
            <button className="bg-zinc-100 text-zinc-700 font-bold px-5 py-2 rounded-lg">Exportar</button>
          </div>
          <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-24 mt-4">
            {!hasPayments && (
              <>
                <img src={reportsSvg} alt="Sem pagamentos" className="w-32 h-32 mb-4" />
                <div className="text-lg font-bold text-center text-slate-900 mb-2">Você ainda não tem pagamentos</div>
              </>
            )}
            {/* Quando houver pagamentos, renderizar cards e tabela aqui */}
          </div>
        </div>
      </div>
    </div>
  );
}
