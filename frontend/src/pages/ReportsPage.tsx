import React from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Tag, ShoppingCart, User, BarChart2, ClipboardList, Link, Clock, ArrowRightLeft } from 'lucide-react';

const sections = [
  {
    title: 'Vendas',
    description: 'Acompanhe as vendas do seu evento.',
    items: [
      { title: 'Pedidos', desc: 'Detalhes do comprador, incluindo uma análise dos custos de cada pedido', tag: true },
      { title: 'Vendas', desc: 'Uma visão geral de todas as vendas de ingressos e complementos, incluindo taxas e impostos, agregadas por evento', tag: true },
      { title: 'Resumo de vendas', desc: 'Uma visão geral de todas as vendas de ingressos, incluindo taxas e impostos', icon: <Tag className="w-6 h-6 text-[#6C63FF]" /> },
      { title: 'Canal de vendas e tipo de pagamento', desc: 'Uma visão geral de todas as vendas pelo canal de vendas e o tipo de pagamento, agregadas por evento', tag: true },
      { title: 'Auditar', desc: 'Revisar os lugares vendidos e disponíveis para os seus eventos', icon: <ShoppingCart className="w-6 h-6 text-[#6C63FF]" /> },
    ],
  },
  {
    title: 'Participantes',
    description: 'Ver informações sobre seus participantes',
    items: [
      { title: 'Participantes', desc: 'Lista de cada participante, incluindo os endereços de e-mail', tag: true },
      { title: 'Itens adicionais', desc: 'Lista de cada participante que comprou um complemento', tag: true },
      { title: 'Respostas das perguntas personalizadas', desc: 'Analisar os detalhes do participante e as respostas a perguntas personalizadas', icon: <ClipboardList className="w-6 h-6 text-[#6C63FF]" /> },
    ],
  },
  {
    title: 'Marketing',
    description: 'Ver detalhes sobre vendas de recursos de marketing',
    items: [
      { title: 'Códigos promocionais', desc: 'Lista de cada comprador que utilizou um código', tag: true },
      { title: 'Links de rastreamento', desc: 'Lista de cada comprador que adquiriu usando um link de rastreamento', tag: true },
      { title: 'Tráfego e conversão', desc: 'Revise como os participantes encontraram e compraram ingressos para seus eventos', icon: <User className="w-6 h-6 text-[#6C63FF]" /> },
    ],
  },
  {
    title: 'Bilheteria',
    description: 'Monitorar suas vendas na porta',
    items: [
      { title: 'Resumo da bilheteria', desc: 'Monitorar suas vendas de eventos na porta', icon: <BarChart2 className="w-6 h-6 text-[#6C63FF]" /> },
      { title: 'Participação', desc: 'Ver quando os participantes fizeram check-in no seu evento', icon: <CheckCircle className="w-6 h-6 text-[#6C63FF]" /> },
      { title: 'Resumo de reservas', desc: 'Verificar quais ingressos estão reservados neste momento', icon: <Clock className="w-6 h-6 text-[#6C63FF]" /> },
      { title: 'Transferências', desc: 'Revisar os ingressos que foram transferidos de um participante para outro', icon: <ArrowRightLeft className="w-6 h-6 text-[#6C63FF]" /> },
    ],
  },
];

const tabs = [
  'Relatórios da organização',
  'Relatórios programados',
  'Análise',
];

function OrganizerReportsPage() {
  const [activeTab, setActiveTab] = React.useState(0);
  const navigate = useNavigate();
  const handlePedidosClick = () => {
    navigate('/organizer-reports/orders');
  };
  const handleVendasClick = () => {
    navigate('/organizer-reports/sales');
  };
  return (
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">
      <SidebarMenu />
      <div className="rounded-3xl w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-32">
          <h1 className="text-5xl font-extrabold text-[#231942] mb-8">Relatórios</h1>
          <div className="flex items-center gap-6 border-b border-zinc-200 -mb-2">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`pb-2 text-base font-bold transition ${activeTab === i ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {sections.map((section, idx) => (
            <div key={section.title} className="mb-12">
              <h2 className="text-2xl font-bold text-[#231942] mb-2">{section.title}</h2>
              <p className="text-[#231942] mb-6 text-base">{section.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {section.items.map((item, i) => (
                  <div
                    key={item.title}
                    className={`bg-white rounded-xl shadow-sm border px-6 py-5 flex flex-col gap-2 relative${['Pedidos','Vendas'].includes(item.title) ? ' cursor-pointer' : ''}`}
                    onClick={item.title === 'Pedidos' ? handlePedidosClick : item.title === 'Vendas' ? handleVendasClick : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#231942]" style={{ fontSize: 18 }}>{item.title}</span>
                      {item.tag && <span className="px-3 py-1 text-xs font-bold rounded-xl bg-green-50 text-green-700 border border-green-200">Novo</span>}
                      {item.icon && <span className="ml-2">{item.icon}</span>}
                    </div>
                    <span className="text-[#231942]" style={{ fontSize: 12 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
  {/* O modal de seleção de eventos só deve aparecer na página de pedidos */}
    </div>
  );
}

export default OrganizerReportsPage;
