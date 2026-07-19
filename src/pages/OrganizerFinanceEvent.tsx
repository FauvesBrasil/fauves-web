import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { ensureApiBase, apiUrl, fetchApi } from '@/lib/apiBase';
import { useOrganization } from '@/context/OrganizationContext';

type EventSummary = {
  id: string;
  name: string;
  startDate?: string | null;
  image?: string | null;
};

type FinancialData = {
  grossRevenue: number;
  platformFeePercent: number;
  platformFee: number;
  netRevenue: number;
  totalWithdrawn: number;
  availableForWithdrawal: number;
  withdrawals: any[];
  ticketSales: any[];
  dailySales: any[];
};

export default function OrganizerFinanceEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const [loading, setLoading] = React.useState(true);
  const [event, setEvent] = React.useState<EventSummary | null>(null);
  const [financial, setFinancial] = React.useState<FinancialData | null>(null);
  const { selectedOrg } = useOrganization();

  const formatCurrency = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleDownloadPdf = () => {
    const orgName = selectedOrg?.name || 'Organizador';
    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const evName = event?.name || 'Evento';
    const evDateCity = [event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : null, ''].filter(Boolean).join(' ');

    const grossRevenue = financial?.grossRevenue || 0;
    const netRevenue = financial?.netRevenue || 0;
    const platformFee = financial?.platformFee || 0;
    const ticketsSold = financial?.ticketSales?.reduce((sum, ts) => sum + Number(ts.count || 0), 0) || 0;

    const w = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=800');
    if (!w) return;
    const title = `Relatorio_Fauves_${evName.replace(/\s+/g,'_')}_${todayStr.replace(/\//g,'-')}`;
    w.document.title = title;
    const styles = `
      body{ font-family: Arial, sans-serif; color:#111827; }
      .container{ width: 794px; margin: 32px auto; }
      .header{ display:flex; justify-content:space-between; align-items:flex-start; }
      .brand{ font-weight:800; letter-spacing:0.5px; }
      .report{ font-weight:700; font-size:22px; }
      .muted{ color:#6b7280; }
      .panel{ border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; display:grid; grid-template-columns:1fr 1fr; }
      .cell{ padding:16px; border-right:1px solid #e5e7eb; }
      .cell:last-child{ border-right:none; }
      h3{ margin: 24px 0 8px; font-size:16px; }
      .box{ background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; }
      .row{ display:flex; justify-content:space-between; }
      .table{ width:100%; border-collapse:collapse; }
      .table th, .table td{ padding:10px 12px; }
      .table thead{ background:#f3f4f6; color:#374151; font-weight:600; font-size:13px; }
      .table tbody tr{ border-top:1px solid #e5e7eb; }
      .footer{ margin-top:40px; text-align:center; color:#6b7280; font-size:12px; }
      hr.sep{ border:none; border-top:1px solid #e5e7eb; margin:8px 0; }
    `;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title><style>${styles}</style></head><body>
      <div class="container">
        <div class="header">
          <div class="brand">FAUVES</div>
          <div class="muted">Relatório<br/><span>${todayStr}</span></div>
        </div>
        <div style="height:16px"></div>
        <div class="panel">
          <div class="cell">
            <div class="muted" style="font-weight:700; margin-bottom:6px">DADOS DO ORGANIZADOR</div>
            <div>${orgName}</div>
          </div>
          <div class="cell">
            <div class="muted" style="font-weight:700; margin-bottom:6px">DADOS DO EVENTO</div>
            <div style="font-weight:600">${evName}</div>
            <div class="muted" style="margin-top:4px">${evDateCity}</div>
          </div>
        </div>

        <h3>Faturamento Online</h3>
        <div class="box">
          <div class="row"><div class="muted">Receita total de vendas online</div><div style="font-weight:700">${formatCurrency(grossRevenue)}</div></div>
          <div class="row"><div class="muted">Taxa da plataforma (${financial?.platformFeePercent || 15}%)</div><div style="font-weight:700">-${formatCurrency(platformFee)}</div></div>
          <hr class="sep"/>
          <div class="row" style="font-weight:700"><div>Receita líquida</div><div>${formatCurrency(netRevenue)}</div></div>
        </div>

        <h3>Dados de Audiência</h3>
        <div class="box">
          <div class="row"><div class="muted"># Ingressos vendidos</div><div>${ticketsSold}</div></div>
          <div class="row"><div class="muted"># Convites enviados</div><div>0</div></div>
          <hr class="sep"/>
          <div class="row" style="font-weight:700"><div>Total de participantes</div><div>${ticketsSold}</div></div>
        </div>

        <h3>Histórico de Saques</h3>
        <div class="box">
          ${(financial?.withdrawals || []).length === 0 
            ? '<div class="muted">Nenhum saque realizado.</div>' 
            : financial?.withdrawals?.map(w => `
              <div class="row">
                <div>
                  <div>${new Date(w.createdAt).toLocaleString('pt-BR')}</div>
                  ${w.notes ? `<div class="muted" style="font-size:11px">${w.notes}</div>` : ''}
                </div>
                <div style="font-weight:700">${formatCurrency(Number(w.amount))}</div>
              </div>
            `).join('<hr class="sep"/>')
          }
        </div>

        <h3>Faturamento da Fauves</h3>
        <div class="box">
          <div class="row"><div>Taxa da plataforma (${financial?.platformFeePercent || 15}%)</div><div>${formatCurrency(platformFee)}</div></div>
          <div class="row"><div>Total sacado pelo organizador</div><div>-${formatCurrency(financial?.totalWithdrawn || 0)}</div></div>
          <hr class="sep"/>
          <div class="row" style="font-weight:700"><div>Saldo disponível</div><div>${formatCurrency(financial?.availableForWithdrawal || 0)}</div></div>
        </div>

        <div class="footer">FAUVES — www.fauves.live</div>
      </div>
      <script>setTimeout(() => { window.print(); setTimeout(() => window.close(), 100); }, 200);</script>
    </body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        await ensureApiBase().catch(() => {});
        // Fetch event details
        const eventUrl = apiUrl(`/api/event/${eventId}`);
        try {
          const r = await fetch(eventUrl, { headers: { 'Accept': 'application/json' } });
          if (r.ok) {
            const ev = await r.json();
            if (ev && (ev.id || ev.name)) {
              setEvent({
                id: ev.id || eventId,
                name: ev.name || ev.title || 'Evento',
                startDate: ev.startDate || ev.startDateUtc || ev.startsAt || null,
                image: ev.image || ev.bannerImage || ev.coverUrl || null,
              });
            }
          }
        } catch (err) {
          setEvent({ id: eventId, name: 'Evento', startDate: null, image: null });
        }
        
        if (cancelled) return;

        // Fetch financial data
        const token = localStorage.getItem('AUTH_TOKEN_V1') || localStorage.getItem('token');
        if (token) {
          try {
            const financialUrl = apiUrl(`/api/organization/event/${eventId}/financial`);
            const finRes = await fetch(financialUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            if (finRes.ok) {
              const finData = await finRes.json();
              if (finData.ok && finData.financial) {
                setFinancial(finData.financial);
              }
            }
          } catch (err) {
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex justify-center items-start">
      <SidebarMenu activeKeyOverride="financas" />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-[100px]">
        <AppHeader />
        <OrganizerLayout>
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/organizer-finances" className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-500 transition-colors">Finanças</Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white font-medium">{event?.name || 'Evento'}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Balanço do evento</h1>

          {loading ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center text-sm text-slate-500">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Balanço disponível</div>
                    <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-500">{formatCurrency(financial?.availableForWithdrawal || 0)}</div>
                  <div className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mt-1">Pronto para saque</div>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Receita bruta</div>
                    <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(financial?.grossRevenue || 0)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vendas totais</div>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Receita líquida</div>
                    <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(financial?.netRevenue || 0)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Após taxa de {financial?.platformFeePercent || 15}%</div>
                </div>
              </div>

              {/* Seção de saques realizados */}
              {financial?.withdrawals && financial.withdrawals.length > 0 && (
                <div className="mt-5">
                  <div className="text-base font-semibold text-slate-900 dark:text-white mb-3">Saques realizados</div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] divide-y divide-zinc-200 dark:divide-zinc-700">
                    {financial.withdrawals.map((w: any) => (
                      <div key={w.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            Saque realizado
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(w.createdAt).toLocaleString('pt-BR')}
                          </div>
                          {w.notes && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {w.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-green-600 dark:text-green-500">
                            {formatCurrency(Number(w.amount))}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {w.status === 'COMPLETED' ? 'Concluído' : w.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Total já sacado
                      </div>
                      <div className="text-base font-semibold text-blue-900 dark:text-blue-100">
                        {formatCurrency(financial.totalWithdrawn || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <div className="text-base font-semibold text-slate-900 dark:text-white">Detalhamento financeiro</div>
                <button onClick={handleDownloadPdf} className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-sm font-medium text-slate-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">Baixar relatório (PDF)</button>
              </div>

              {/* Cards de resumo financeiro */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receita Bruta</div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-white mt-1.5">
                    {formatCurrency(financial?.grossRevenue || 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Taxa Plataforma ({financial?.platformFeePercent || 15}%)
                  </div>
                  <div className="text-xl font-semibold text-red-600 dark:text-red-500 mt-1.5">
                    - {formatCurrency(financial?.platformFee || 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receita Líquida</div>
                  <div className="text-xl font-semibold text-green-600 dark:text-green-500 mt-1.5">
                    {formatCurrency(financial?.netRevenue || 0)}
                  </div>
                </div>
              </div>

              {/* Vendas por tipo de ingresso */}
              {financial?.ticketSales && financial.ticketSales.length > 0 && (
                <div className="mt-5">
                  <div className="text-base font-semibold text-slate-900 dark:text-white mb-3">Vendas por tipo de ingresso</div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px] text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 text-xs font-medium">
                          <tr>
                            <th className="py-2.5 px-3">Tipo de Ingresso</th>
                            <th className="py-2.5 px-3 text-right">Preço</th>
                            <th className="py-2.5 px-3 text-right">Vendidos</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                          {financial.ticketSales.map((ts: any, idx: number) => (
                            <tr key={idx} className="align-middle hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="py-2.5 px-3 text-sm text-slate-900 dark:text-white">{ts.ticketTypeName}</td>
                              <td className="py-2.5 px-3 text-right text-sm text-slate-700 dark:text-slate-300">{formatCurrency(ts.price)}</td>
                              <td className="py-2.5 px-3 text-right text-sm text-slate-700 dark:text-slate-300">{ts.count}</td>
                              <td className="py-2.5 px-3 text-right text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(ts.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </OrganizerLayout>
      </div>
    </div>
  );
}
