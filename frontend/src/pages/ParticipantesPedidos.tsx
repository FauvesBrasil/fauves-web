import React from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, MoreHorizontal, RefreshCw } from 'lucide-react';

const SelectionCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center justify-center cursor-pointer select-none">
    <span className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-label={label || 'Selecionar'}
        className="peer appearance-none w-5 h-5 rounded-lg border-2 border-zinc-300 bg-white dark:bg-[#0f0f0f] transition-all duration-200 shadow-sm focus:ring-2 focus:ring-[#2A2AD7] checked:border-[#2A2AD7] checked:bg-[#2A2AD7]"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {checked && (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M5 10.5L9 14.5L15 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </span>
  </label>
);

type OrderRow = {
  id: string;
  name: string;
  email: string;
  date: string;
  description: string;
  amount: number;
  tags: string[];
};

export default function ParticipantesPedidos() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const orders = React.useMemo<OrderRow[]>(() => [
    {
      id: 'T43081',
      name: 'Lucas Gérard',
      email: 'gerardlucas@live.fr',
      date: '30 ago • 18:12',
      description: 'Regular Ticket x2',
      amount: 45.0,
      tags: ['Válido', 'Ticket'],
    },
    {
      id: 'T43082',
      name: 'Lucas Gérard',
      email: 'gerardlucas@live.fr',
      date: '30 ago • 18:08',
      description: 'Experiente Ticket x1',
      amount: 143.0,
      tags: ['Válido', 'Ticket'],
    },
    {
      id: 'T43091',
      name: 'Lucas Gérard',
      email: 'gerardlucas@live.fr',
      date: '30 ago • 18:00',
      description: 'Early Ticket x2, Regular Ticket x1',
      amount: 92.5,
      tags: ['Válido', 'Ticket'],
    },
  ], []);

  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleAll = () => {
    setSelected(prev => prev.length === orders.length ? [] : orders.map(o => o.id));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };
  const allSelected = selected.length === orders.length && orders.length > 0;
  const totalAmount = orders.reduce((acc, order) => acc + order.amount, 0);

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
        <div className="mt-24 max-w-[1100px] w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-1">Pedidos</h1>
              <p className="text-sm text-zinc-600 dark:text-slate-300">
                Pedidos ({orders.length}) • Total R$ {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" className="flex items-center gap-2" disabled={selected.length === 0}>
                <RefreshCw className="w-4 h-4" />
                Reembolsar selecionados
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <MoreHorizontal className="w-4 h-4" />
                Ações
              </Button>
              <Input placeholder="Buscar por ID, nome ou email..." className="w-72" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-[#1F1F1F] bg-white dark:bg-[#121212] overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-[#1F1F1F] dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <SelectionCheckbox checked={allSelected} onChange={toggleAll} label="Selecionar todos" />
                  </th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Tags</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-zinc-100 dark:border-[#1F1F1F] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3">
                      <SelectionCheckbox checked={selected.includes(order.id)} onChange={() => toggleOne(order.id)} label={`Selecionar pedido ${order.id}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-indigo-900 dark:text-white">{order.name}</div>
                      <div className="text-xs text-zinc-500">{order.email}</div>
                      <div className="text-xs text-zinc-500">{order.id}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-slate-200">{order.date}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-slate-200">{order.description}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-white">R$ {order.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {order.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="outline" className="text-xs flex items-center gap-2 px-3 py-1">
                        <Download className="w-4 h-4" /> PDF
                      </Button>
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
