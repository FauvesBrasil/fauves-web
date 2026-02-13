import React from "react";
import { Ticket, Link, BarChart2 } from "lucide-react";

// Card de vendas totais
export function SalesSummaryCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-start border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-orange-600 mb-1">Vendas Totais</h3>
      <div className="text-xl font-bold text-zinc-900 dark:text-white">1.245 vendas</div>
    </div>
  );
}

// Card de ingressos disponíveis/vendidos
export function TicketsSummaryCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-start border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-indigo-700 mb-1">Ingressos</h3>
      <div className="text-lg font-bold text-zinc-900 dark:text-white">2.000 / 2.500</div>
      <div className="text-xs text-zinc-500 mt-1">(Vendidos / Disponíveis)</div>
    </div>
  );
}

// Card de receita
export function RevenueCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-start border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-green-700 mb-1">Receita</h3>
      <div className="text-lg font-bold text-zinc-900 dark:text-white">R$ 38.750,00</div>
      <div className="text-xs text-zinc-500 mt-1">Receita bruta</div>
    </div>
  );
}

// Card de visualizações
export function PageViewsCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-start border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-blue-700 mb-1">Visualizações</h3>
      <div className="text-lg font-bold text-zinc-900 dark:text-white">8.420</div>
      <div className="text-xs text-zinc-500 mt-1">Visualizações da página</div>
    </div>
  );
}

// Card de status do evento
export function EventStatusCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-start border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-purple-700 mb-1">Status do Evento</h3>
      <div className="text-base font-bold text-zinc-900 dark:text-white">Ativo</div>
      <div className="text-xs text-zinc-500 mt-1">Evento em andamento</div>
    </div>
  );
}

// Card de ações rápidas
export function QuickActionsCard({
  onIssueCourtesy,
  onCopyLink,
  onOpenReport,
  copyOk
}: {
  onIssueCourtesy?: () => void;
  onCopyLink?: () => void;
  onOpenReport?: () => void;
  copyOk?: boolean;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-stretch">
      <button
        onClick={onIssueCourtesy}
        className="flex flex-row items-center justify-center px-4 py-3 rounded-xl shadow hover:scale-[1.04] transition-all font-medium flex-1 min-w-[180px]"
        style={{ background: '#EF4118', color: '#fff', border: '2px solid #EF4118' }}
      >
        <Ticket className="w-5 h-5 mr-2" />
        <span className="text-sm">Emitir cortesia</span>
      </button>
      <button
        onClick={onCopyLink}
        className={`flex flex-row items-center justify-center px-4 py-3 rounded-xl shadow hover:scale-[1.04] font-medium flex-1 min-w-[180px] ${copyOk ? 'scale-105' : ''}`}
        style={{
          background: copyOk ? '#10B981' : '#2A2AD7',
          color: '#fff',
          border: copyOk ? '2px solid #10B981' : '2px solid #2A2AD7',
          transition: 'all 0.3s ease'
        }}
      >
        {copyOk ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">Copiado!</span>
          </>
        ) : (
          <>
            <Link className="w-5 h-5 mr-2" />
            <span className="text-sm">Copiar link</span>
          </>
        )}
      </button>
      <button
        onClick={onOpenReport}
        className="flex flex-row items-center justify-center px-4 py-3 rounded-xl shadow hover:scale-[1.04] transition-all font-medium flex-1 min-w-[180px]"
        style={{ background: '#2A2AD7', color: '#fff', border: '2px solid #2A2AD7' }}
      >
        <BarChart2 className="w-5 h-5 mr-2" />
        <span className="text-sm">Abrir relatório</span>
      </button>
    </div>
  );
}

// Card de alertas
export function AlertsCard() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 rounded-xl shadow-md p-5 flex flex-col items-start border-2 border-yellow-400 animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 text-yellow-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 className="text-sm font-semibold text-yellow-700">Alertas</h3>
      </div>
      <ul className="list-disc pl-4 text-sm text-yellow-800 dark:text-yellow-200 space-y-0.5">
        <li className="animate-pulse">Estoque baixo para <b>VIP</b></li>
        <li className="animate-pulse">2 pagamentos pendentes</li>
      </ul>
    </div>
  );
}

// Esqueleto do painel principal
export default function EventDashboardSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1200px] mx-auto p-4 lg:p-8 animate-pulse">
      {/* Sidebar Placeholder */}
      <div className="hidden lg:block w-[300px] space-y-4">
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>

      <div className="flex-1 space-y-8">
        {/* Header Placeholder */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded hidden md:block"></div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SalesSummaryCard />
          <TicketsSummaryCard />
          <RevenueCard />
          <EventStatusCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"></div>
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"></div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <AlertsCard />
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
