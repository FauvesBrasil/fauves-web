import React, { useState, useEffect } from 'react';
import reportsSvg from '@/assets/reports.svg';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import SelectEventModal from '@/components/SelectEventModal';
import { Calendar } from 'lucide-react';

export default function OrganizerReportsOrders() {
  // Order data state
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders when eventIds changes
  useEffect(() => {
    if (eventIds.length === 0) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/organization/orders?eventIds=${eventIds.join(',')}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao buscar pedidos');
        return await res.json();
      })
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch((err) => {
        setError(err.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [eventIds]);
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

  const handleExportCSV = () => {
    // Generate CSV header
    const headers = 'ID do pedido,Data do pedido,Nome do comprador,Sobrenome do comprador,E-mail do comprador,Número de telefone,Cidade do comprador,Estado do comprador,País do comprador,CEP de cobrança,País de cobrança,Nome do evento,ID do evento,Data de início do evento,Hora de início do evento,Fuso horário do evento,Localização do evento,Quantidade de ingressos,Quantidade de complementos,Moeda,Status de pagamento,Tipo de pagamento,Dados de pagamento,Vendas brutas,Taxa de serviço da Eventbrite,Taxa de processamento de pagamentos da Eventbrite,Imposto da Eventbrite,Imposto do organizador,Royalty,Receita de ingressos,Receita de complementos,Receita de ingressos + complementos,Vendas líquidas,Convidado(a)';

    // Generate CSV rows from actual orders
    const rows = orders.map(o => [
      o.id,
      o.orderDate,
      o.buyerFirstName,
      o.buyerLastName,
      o.buyerEmail,
      o.buyerPhone,
      o.buyerCity,
      o.buyerState,
      o.buyerCountry,
      o.billingZip,
      o.billingCountry,
      o.eventName,
      o.eventId,
      o.eventStartDate,
      o.eventStartTime,
      o.eventTimezone,
      o.eventLocation,
      o.ticketQuantity,
      o.addonQuantity,
      'BRL',
      o.paymentStatus,
      o.paymentType,
      o.paymentData,
      o.grossSales,
      o.eventbriteServiceFee,
      o.eventbritePaymentFee,
      o.eventbriteTax,
      o.organizerTax,
      o.royalty,
      o.ticketRevenue,
      o.addonRevenue,
      o.totalRevenue,
      o.netSales,
      o.isGuest ? 'Sim' : 'Não'
    ].join(','));

    // Calculate totals
    const totals = [
      'TOTAIS',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      orders.reduce((sum, o) => sum + o.ticketQuantity, 0),
      orders.reduce((sum, o) => sum + o.addonQuantity, 0),
      '', '', '', '',
      orders.reduce((sum, o) => sum + o.grossSales, 0),
      orders.reduce((sum, o) => sum + o.eventbriteServiceFee, 0),
      orders.reduce((sum, o) => sum + o.eventbritePaymentFee, 0),
      orders.reduce((sum, o) => sum + o.eventbriteTax, 0),
      orders.reduce((sum, o) => sum + o.organizerTax, 0),
      orders.reduce((sum, o) => sum + o.royalty, 0),
      orders.reduce((sum, o) => sum + o.ticketRevenue, 0),
      orders.reduce((sum, o) => sum + o.addonRevenue, 0),
      orders.reduce((sum, o) => sum + o.totalRevenue, 0),
      orders.reduce((sum, o) => sum + o.netSales, 0),
      ''
    ].join(',');

    const csv = [headers, ...rows, totals].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-pedidos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onPopState = () => setEventIds(getEventIds());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex justify-center items-start">
      <SidebarMenu activeKeyOverride="relatorios" />
      <div className="rounded-3xl w-full max-w-6xl mx-auto bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-[100px]">
        <AppHeader />
        <OrganizerLayout>
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mt-16 px-2 max-md:mt-10 max-sm:mt-6">
            <button
              className="self-start mb-2 text-sm text-orange-600 hover:underline font-semibold flex items-center gap-1"
              onClick={() => window.location.href = '/organizer-reports'}
            >
              ← Voltar para relatórios
            </button>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">Pedidos</h1>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px] -mt-3 max-sm:text-sm">Para gerenciar seus pedidos, vá para a área de trabalho de pedidos.</p>
            <div className="flex gap-4 mb-8">
              <button className="bg-orange-600 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2" onClick={() => setShowSelectModal(true)}>
                <Calendar className="w-5 h-5 mr-2" /> Selecionar eventos
              </button>
              <button className="bg-zinc-100 dark:bg-[#1F1F1F] text-zinc-700 dark:text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2" onClick={handleExportCSV}>
                Exportar CSV
              </button>
            </div>
            {eventIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <img src={reportsSvg} alt="Selecione eventos" className="w-32 h-32 mb-4" />
                <div className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Crie um relatório ao selecionar os seus eventos.</div>
                <button className="bg-orange-600 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2" onClick={() => setShowSelectModal(true)}>
                  <span className="material-icons">event</span> Selecionar eventos
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Carregando pedidos...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-lg font-bold text-center text-red-600 mb-2">{error}</div>
              </div>
            ) : (
              orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Nenhum pedido encontrado.</div>
                </div>
              ) : (
                <React.Fragment>
                  <div className="flex gap-8 mb-6">
                    <div className="bg-white dark:bg-[#242424] rounded-xl shadow-sm border dark:border-[#1F1F1F] px-6 py-5 flex flex-col gap-2">
                      <span className="font-bold text-[#231942] dark:text-white text-lg">Eventos</span>
                      <span className="text-[#231942] dark:text-white text-sm">{eventIds.length}</span>
                    </div>
                    <div className="bg-white dark:bg-[#242424] rounded-xl shadow-sm border dark:border-[#1F1F1F] px-6 py-5 flex flex-col gap-2">
                      <span className="font-bold text-[#231942] dark:text-white text-lg">Total de pedidos</span>
                      <span className="text-[#231942] dark:text-white text-sm">{orders.length}</span>
                    </div>
                    <div className="bg-white dark:bg-[#242424] rounded-xl shadow-sm border dark:border-[#1F1F1F] px-6 py-5 flex flex-col gap-2">
                      <span className="font-bold text-[#231942] dark:text-white text-lg">Vendas líquidas</span>
                      <span className="text-[#231942] dark:text-white text-sm">{orders.reduce((acc, o) => acc + (o.netSales || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="bg-white dark:bg-[#242424] rounded-xl shadow-sm border dark:border-[#1F1F1F] px-6 py-5 flex flex-col gap-2">
                      <span className="font-bold text-[#231942] dark:text-white text-lg">Localização principal do comprador</span>
                      <span className="text-[#231942] dark:text-white text-sm">{orders[0]?.buyerCity ? `${orders[0].buyerCity}, ${orders[0].buyerState}, ${orders[0].buyerCountry}` : '-'}</span>
                    </div>
                  </div>
                  <div className="overflow-auto rounded-xl border shadow-sm mb-8 dark:border-[#1F1F1F]">
                    <table className="min-w-full text-xs md:text-sm">
                      <thead className="bg-zinc-50 dark:bg-[#0b0b0b]">
                        <tr>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">ID do pedido</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Data do pedido</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Nome do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Sobrenome do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">E-mail do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Número de telefone</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Cidade do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Estado do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">País do comprador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">CEP de cobrança</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">País de cobrança</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Nome do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">ID do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Data de início do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Hora de início do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Fuso horário do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Localização do evento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Quantidade de ingressos</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Quantidade de complementos</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Moeda</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Status de pagamento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Tipo de pagamento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Dados de pagamento</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Vendas brutas</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Taxa de serviço da Eventbrite</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Taxa de processamento de pagamentos da Eventbrite</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Imposto da Eventbrite</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Imposto do organizador</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Royalty</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Receita de ingressos</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Receita de complementos</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Receita de ingressos + complementos</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Vendas líquidas</th>
                          <th className="px-6 py-2 font-bold text-left whitespace-nowrap dark:text-white">Convidado(a)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, idx) => (
                          <tr className="border-b" key={order.id || idx}>
                            <td className="px-6 py-2 dark:text-white">{order.id}</td>
                            <td className="px-6 py-2 dark:text-white">{order.orderDate}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerFirstName}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerLastName}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerEmail}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerPhone}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerCity}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerState}</td>
                            <td className="px-6 py-2 dark:text-white">{order.buyerCountry}</td>
                            <td className="px-6 py-2 dark:text-white">{order.billingZip}</td>
                            <td className="px-6 py-2 dark:text-white">{order.billingCountry}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventName}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventId}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventStartDate}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventStartTime}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventTimezone}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventLocation}</td>
                            <td className="px-6 py-2 dark:text-white">{order.ticketQuantity}</td>
                            <td className="px-6 py-2 dark:text-white">{order.addonQuantity}</td>
                            <td className="px-6 py-2 dark:text-white">BRL</td>
                            <td className="px-6 py-2 dark:text-white">{order.paymentStatus}</td>
                            <td className="px-6 py-2 dark:text-white">{order.paymentType}</td>
                            <td className="px-6 py-2 dark:text-white">{order.paymentData}</td>
                            <td className="px-6 py-2 dark:text-white">{order.grossSales}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventbriteServiceFee}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventbritePaymentFee}</td>
                            <td className="px-6 py-2 dark:text-white">{order.eventbriteTax}</td>
                            <td className="px-6 py-2 dark:text-white">{order.organizerTax}</td>
                            <td className="px-6 py-2 dark:text-white">{order.royalty}</td>
                            <td className="px-6 py-2 dark:text-white">{order.ticketRevenue}</td>
                            <td className="px-6 py-2 dark:text-white">{order.addonRevenue}</td>
                            <td className="px-6 py-2 dark:text-white">{order.totalRevenue}</td>
                            <td className="px-6 py-2 dark:text-white">{order.netSales}</td>
                            <td className="px-6 py-2 dark:text-white">{order.isGuest ? 'Sim' : 'Não'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </React.Fragment>
              )
            )}
          </div>
        </OrganizerLayout>
        <SelectEventModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onConfirm={handleSelectConfirm} />
      </div>
    </div>
  );
}
