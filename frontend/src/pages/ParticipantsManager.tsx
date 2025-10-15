import React, { useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';

const tabs = [
  { key: 'orders', label: 'Gerenciar pedidos' },
  { key: 'participants', label: 'Lista de Participantes' },
  { key: 'checkin', label: 'Check-in' },
];

interface ParticipantsManagerProps {
  initialTab?: string;
}

export default function ParticipantsManager({ initialTab = 'orders' }: ParticipantsManagerProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-white w-full">
      <SidebarMenu />
      <AppHeader />
      <div className="flex flex-col pl-8 pr-8 min-h-screen relative">
        <div className="mt-24 max-w-4xl">
          <h1 className="text-3xl font-bold text-indigo-950 mb-3">Pedidos</h1>
          <div className="bg-white rounded-xl border p-6 min-h-[300px]">
            <p className="text-sm text-gray-600 mb-6">Veja todos os pedidos do seu evento, incluindo receitas e taxas. Para baixar uma lista de pedidos, visualize o relatório de pedidos.</p>
            {/* ...Conteúdo de pedidos... */}
          </div>
        </div>
      </div>
    </div>
  );
}
