import React, { useState, useEffect } from 'react';
import reportsSvg from '@/assets/reports.svg';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import SelectEventModal from '@/components/SelectEventModal';
import { Calendar } from 'lucide-react';

export default function OrganizerReportsSales() {
  const getEventIds = () => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('eventIds');
    return ids ? ids.split(',') : [];
  };
  const [eventIds, setEventIds] = useState(getEventIds());
  const [showSelectModal, setShowSelectModal] = useState(eventIds.length === 0);

  const handleSelectConfirm = (selectedIds: string[]) => {
    setShowSelectModal(false);
    if (selectedIds.length > 0) {
      const params = new URLSearchParams(window.location.search);
      params.set('eventIds', selectedIds.join(','));
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      setEventIds(selectedIds);
    }
  };

  useEffect(() => {
    const onPopState = () => setEventIds(getEventIds());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">
      <SidebarMenu activeKeyOverride="relatorios" />
      <div className="rounded-3xl w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-32">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">
          <button
            className="self-start mb-2 text-sm text-orange-600 hover:underline font-semibold flex items-center gap-1"
            onClick={() => window.location.href = '/organizer-reports'}
          >
            ← Voltar para relatórios
          </button>
          <h1 className="text-4xl font-bold text-slate-900 max-sm:text-3xl">Vendas</h1>
          <p className="text-slate-600 leading-relaxed text-[15px] -mt-3 max-sm:text-sm">Para visualizar suas vendas, selecione um evento.</p>
          <div className="flex gap-4 mb-8">
            <button className="bg-orange-600 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2" onClick={() => setShowSelectModal(true)}>
              <Calendar className="w-5 h-5 mr-2" /> Selecionar eventos
            </button>
          </div>
          {eventIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <img src={reportsSvg} alt="Selecione eventos" className="w-32 h-32 mb-4" />
              <div className="text-lg font-bold text-center text-slate-900 mb-2">Crie um relatório ao selecionar os seus eventos.</div>
              <button className="bg-orange-600 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2" onClick={() => setShowSelectModal(true)}>
                <span className="material-icons">event</span> Selecionar eventos
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-8 mb-6">
                <div className="bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2">
                  <span className="font-bold text-[#231942] text-lg">Eventos</span>
                  <span className="text-[#231942] text-sm">{eventIds.length}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2">
                  <span className="font-bold text-[#231942] text-lg">Ingressos vendidos</span>
                  <span className="text-[#231942] text-sm">2</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2">
                  <span className="font-bold text-[#231942] text-lg">Complementos vendidos</span>
                  <span className="text-[#231942] text-sm">0</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2">
                  <span className="font-bold text-[#231942] text-lg">Vendas líquidas</span>
                  <span className="text-[#231942] text-sm">0,00</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2">
                  <span className="font-bold text-[#231942] text-lg">Principal evento</span>
                  <span className="text-[#231942] text-sm">Menos é mais</span>
                </div>
              </div>
              <div className="overflow-auto rounded-xl border shadow-sm mb-8">
                <table className="min-w-full text-xs md:text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Nome do evento</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Localização do evento</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Data de início do evento</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Hora de início do evento</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Fuso horário do evento</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Ingressos vendidos</th>
                      <th className="px-6 py-2 font-bold text-left whitespace-nowrap">Ingressos pagos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-6 py-2">Menos é mais</td>
                      <td className="px-6 py-2"></td>
                      <td className="px-6 py-2">20/06/2024</td>
                      <td className="px-6 py-2">16:00</td>
                      <td className="px-6 py-2">America/Sao_Paulo</td>
                      <td className="px-6 py-2">2</td>
                      <td className="px-6 py-2">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <SelectEventModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onConfirm={handleSelectConfirm} />
      </div>
    </div>
  );
}
