import React from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { LogIn, Monitor } from 'lucide-react';

export default function ParticipantesCheckin() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Demo data
  const participantes = [
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Camarote', status: 'Check-in' },
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Camarote', status: 'Check-in' },
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Diretoria', status: 'Check-in' },
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Pista', status: 'Check-in' },
    { nome: 'Eu De novo', email: 'teste@teste.com.br', ingresso: 'Pista', status: 'Check-in' },
    { nome: 'Eu De novo', email: 'teste@teste.com.br', ingresso: 'Pista', status: 'Check-in' },
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Gratuito', status: 'Check-in' },
    { nome: 'Levy Câmara', email: 'levycamara@hotmail.com', ingresso: 'Camarote', status: 'Check-in' },
  ];

  const [checkedIn, setCheckedIn] = React.useState(Array(participantes.length).fill(false));

  const total = participantes.length;
  const checkedCount = checkedIn.filter(Boolean).length;

  const handleCheckin = (idx: number) => {
    setCheckedIn(prev => prev.map((v, i) => i === idx ? true : v));
  };

  const handleCancelCheckin = (idx: number) => {
    setCheckedIn(prev => prev.map((v, i) => i === idx ? false : v));
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
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
          <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Check-in</h1>
          <p className="text-gray-700 dark:text-slate-300 mb-6">Faça check-in dos participantes usando seu nome</p>
          <div className="w-full h-2 bg-zinc-200 dark:bg-[#1F1F1F] rounded mb-2 relative">
            <div className="h-2 bg-green-400 rounded" style={{ width: `${(checkedCount/total)*100}%` }}></div>
            <div className="absolute right-0 -top-6 text-sm font-semibold text-zinc-700 dark:text-slate-300">{checkedCount} / {total}</div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <input type="text" placeholder="Digite o Nome do participante" className="border rounded-lg px-4 py-2 text-sm w-72 dark:bg-[#121212] dark:border-transparent dark:text-white" />
            <div className="flex gap-2">
              <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"><LogIn size={16}/> App Check-in</button>
              <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"><Monitor size={16}/> Web Check-in</button>
            </div>
          </div>
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 dark:bg-[#1F1F1F] dark:text-slate-300">
                  <th className="px-6 py-3 text-left">Nome do participante</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Tipo do ingresso</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, idx) => (
                  <tr key={idx} className="border-t dark:border-[#1F1F1F]">
                    <td className="px-6 py-3 dark:text-white">{p.nome}</td>
                    <td className="px-6 py-3 dark:text-white">{p.email}</td>
                    <td className="px-6 py-3 dark:text-white">{p.ingresso}</td>
                    <td className="px-6 py-3">
                      {checkedIn[idx] ? (
                        <span className="inline-flex items-center text-green-600 dark:text-[#64CB9E] font-semibold gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-600 dark:text-[#64CB9E]"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <button className="text-xs text-zinc-500 dark:text-slate-300 hover:underline ml-2" onClick={() => handleCancelCheckin(idx)}>
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button className="text-indigo-700 dark:text-indigo-300 font-semibold hover:underline" onClick={() => handleCheckin(idx)}>
                          Check-in
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
