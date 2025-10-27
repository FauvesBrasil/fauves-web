import React from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';

export default function ParticipantesPedidos() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Pedidos</h1>
          <div className="bg-white rounded-xl border p-6 min-h-[300px] dark:bg-[#242424] dark:border-[#1F1F1F]">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">Veja todos os pedidos do seu evento, incluindo receitas e taxas. Para baixar uma lista de pedidos, visualize o relatório de pedidos.</p>
            {/* Cards de pedidos demo */}
            {[{
              id: 'CHN7N2',
              valor: 34.5,
              status: 'Concluído',
              comprador: 'Levy Câmara',
              data: '31/05/2025 às 14:58',
              tipoCobranca: 'Cartão',
              ingressos: [
                { tipo: 'Diretoria', preco: 34.5, participante: 'Levy Câmara' }
              ]
            }].map(pedido => (
              <div key={pedido.id} className="border rounded-xl p-5 mb-6 bg-white shadow-sm dark:bg-[#242424] dark:border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-bold text-indigo-950 dark:text-white">Pedido #{pedido.id} – R${pedido.valor.toFixed(2)}</div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-[#64CB9E]/20 dark:text-[#64CB9E]">{pedido.status}</span>
                </div>
                <div className="text-sm text-zinc-700 dark:text-slate-300 mb-2">Comprado por {pedido.comprador} em {pedido.data}</div>
                <div className="text-xs text-zinc-500 dark:text-slate-300 mb-4">Tipo cobrança: {pedido.tipoCobranca}</div>
                <div className="border rounded-lg bg-zinc-50 dark:bg-[#121212] dark:border-[#1F1F1F]">
                  <div className="px-4 py-3 font-semibold text-indigo-900 dark:text-white">Ingressos</div>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-700 dark:bg-[#1F1F1F] dark:text-slate-300">
                        <th className="px-4 py-2 text-left">Tipo de ingresso</th>
                        <th className="px-4 py-2 text-left">Preço</th>
                        <th className="px-4 py-2 text-left">Participante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.ingressos.map((ing, idx) => (
                        <tr key={idx} className="border-t dark:border-[#1F1F1F]">
                          <td className="px-4 py-2 dark:text-white">{ing.tipo}</td>
                          <td className="px-4 py-2 dark:text-white">R$ {ing.preco.toFixed(2)}</td>
                          <td className="px-4 py-2 dark:text-white">{ing.participante}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
