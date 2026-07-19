import React from "react";
import { Info, ArrowUpRight, Check, Ticket, Clock, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function CardTotalVendas({ total, details }: { total: number; details?: string }) {
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">Total de vendas</div>
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{typeof total === 'number' ? formatBRL(total) : '—'}</div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500">{details || ''}</div>
    </div>
  );
}

export function CardDisponivelRetirada({ valor, details }: { valor: number; details?: string }) {
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">Disponível para retirada</div>
      <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{typeof valor === 'number' ? formatBRL(valor) : '—'}</div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500">{details || ''}</div>
    </div>
  );
}

export function CardTicketMedio({ valor, details }: { valor: number; details?: string }) {
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">Ticket médio</div>
      <div className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">{typeof valor === 'number' ? formatBRL(valor) : '—'}</div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500">{details || ''}</div>
    </div>
  );
}

export function CardCheckinStatus({ confirmados, checkins }: { confirmados: number; checkins: number }) {
  const percentage = confirmados > 0 ? Math.round((checkins / confirmados) * 100) : 0;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Status Check-in</div>
        <div className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{percentage}%</div>
      </div>
      <div>
        <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{checkins} <span className="text-sm font-normal text-zinc-400">/ {confirmados}</span></div>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="text-[10px] text-zinc-400">Participantes confirmados</div>
    </div>
  );
}

export function SalesOverviewChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center h-[300px] text-zinc-400">
      <Info className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm">Sem dados de vendas no período</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 h-[350px]">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-6">Vendas nos últimos 30 dias</div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickFormatter={(val) => `R$ ${val}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
          />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function TicketTypePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center h-[350px] text-zinc-400">
      <Ticket className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm">Nenhum ingresso vendido</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 h-[350px]">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Vendas por Tipo de Ingresso</div>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
            formatter={(value: number) => [value, 'Ingressos']}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RecentActivityFeed({ orders }: { orders: any[] }) {
  if (!orders || orders.length === 0) return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center h-[200px] text-zinc-400">
      <Clock className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm">Nenhuma atividade recente</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-full">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-xl">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" /> Atividade Recente
        </h3>
      </div>
      <div className="p-0">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[350px] overflow-y-auto">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {order.paymentStatus === 'PAID' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white capitalize">{order.purchaserName || order.purchaserEmail || 'Cliente'}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> {order.participantsCount} ingressos • {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-zinc-900 dark:text-white">R$ {Number(order.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{order.paymentStatus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Ver todos os pedidos</button>
      </div>
    </div>
  );
}

export function CardAlertasFinanceiros({ alerts }: { alerts: string[] }) {
  // ... existing logic wrapped or modified slightly
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-4 mt-6 flex flex-col gap-1">
      <div className="text-xs font-semibold text-yellow-700 mb-1">Alertas financeiros</div>
      {alerts && alerts.length > 0 ? (
        <ul className="list-disc pl-4 text-xs text-yellow-800 space-y-0.5">
          {alerts.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      ) : (
        <div className="flex flex-row items-center gap-2 text-yellow-700 text-xs py-2">
          <Info className="w-4 h-4" /> Nenhum alerta financeiro
        </div>
      )}
    </div>
  );
}

