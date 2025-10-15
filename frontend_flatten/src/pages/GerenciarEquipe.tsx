import React from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { Trash2 } from 'lucide-react';
import AdicionarPessoaEquipeModal from '@/components/AdicionarPessoaEquipeModal';
import { UserPlus } from 'lucide-react';

export default function GerenciarEquipe() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = React.useState(false);

  // Demo equipe
  const equipe = [
    {
      nome: 'Você',
      email: 'levycamara@hotmail.com',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      papel: 'Administrador',
    },
  ];

  const handleAddPessoa = (pessoa) => {
    // lógica para adicionar pessoa na equipe
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <SidebarMenu />
      <EventDetailsSidebar
        eventIdOverride={eventId || null}
        panelRoute={eventId ? `/painel-evento/${eventId}` : undefined}
        fixed
        fixedLeft={70}
        fixedWidth={300}
        fixedTop={0}
        onBack={() => navigate('/organizer-events')}
      />
      <AppHeader />
      <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 min-h-screen relative">
        <div className="mt-24 max-w-[900px]">
          <h1 className="text-3xl font-bold text-indigo-950 mb-3">Gerenciar equipe</h1>
          <p className="text-gray-700 mb-6">Adicione pessoas ao gerenciamento do seu evento aqui na Fauves.</p>
          <div className="border rounded-xl bg-white overflow-hidden">
            {equipe.map((m, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-5 border-b last:border-b-0">
                <img src={m.avatar} alt={m.nome} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex flex-col">
                  <span className="font-semibold text-indigo-950">{m.nome}</span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 mt-1">
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded">{m.papel}</span>
                  </span>
                  <span className="text-sm text-zinc-500">{m.email}</span>
                </div>
                <div className="ml-auto">
                  <button className="text-zinc-500 hover:text-red-600">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Botão flutuante para adicionar pessoa à equipe no estilo organizer-settings */}
          <div className="fixed bottom-8 right-8 z-50 group flex items-center gap-3">
            <button
              className="w-16 h-16 rounded-full bg-[#2A2AD7] shadow-lg flex items-center justify-center hover:bg-[#1E1EBE] transition-all"
              aria-label="Adicionar pessoa à equipe"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              onClick={() => setShowModal(true)}
            >
              <UserPlus className="w-8 h-8 text-white" />
            </button>
            <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-white text-[#2A2AD7] font-bold px-4 py-2 rounded-xl shadow text-base opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Adicionar pessoa à equipe</span>
          </div>
          {showModal && (
            <AdicionarPessoaEquipeModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAddPessoa} />
          )}
        </div>
      </div>
    </div>
  );
}
