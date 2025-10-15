import React, { useState } from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import AdicionarPessoaEquipeModal from '@/components/AdicionarPessoaEquipeModal';
import { UserPlus } from 'lucide-react';

export default function ParticipantesLista() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleAddParticipante = (novoParticipante) => {
    // Lógica para adicionar participante
    console.log('Novo participante adicionado:', novoParticipante);
    setShowModal(false);
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
          <h1 className="text-3xl font-bold text-indigo-950 mb-3">Participantes</h1>
          <p className="text-gray-700 mb-6">Visualize e baixe a lista de seus participantes para check-in e adicione manualmente informações de participantes para ingressos gratuitos ou pagamentos off-line</p>
          <div className="flex items-center justify-between mb-4">
            <input type="text" placeholder="Pesquisar por nome" className="border rounded-lg px-4 py-2 text-sm w-72" />
          </div>
          <div className="border rounded-xl overflow-hidden bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700">
                  <th className="px-6 py-3 text-left">Nome</th>
                  <th className="px-6 py-3 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Levy Câmara', email: 'levycamara@hotmail.com' },
                  { name: 'Levy Câmara', email: 'levycamara@hotmail.com' },
                  { name: 'Levy Câmara', email: 'levycamara@hotmail.com' },
                ].map((p, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Botão flutuante para adicionar participante no estilo organizer-settings */}
          <div className="fixed bottom-8 right-8 z-50 group flex items-center gap-3">
            <button
              className="w-16 h-16 rounded-full bg-[#2A2AD7] shadow-lg flex items-center justify-center hover:bg-[#1E1EBE] transition-all"
              aria-label="Adicionar participante"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              onClick={() => setShowModal(true)}
            >
              <UserPlus className="w-8 h-8 text-white" />
            </button>
            <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-white text-[#2A2AD7] font-bold px-4 py-2 rounded-xl shadow text-base opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Adicionar participante</span>
          </div>
          {showModal && (
            <AdicionarPessoaEquipeModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAddParticipante} />
          )}
        </div>
      </div>
    </div>
  );
}
