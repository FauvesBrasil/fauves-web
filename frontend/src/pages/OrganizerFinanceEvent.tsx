import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { ensureApiBase, apiUrl, fetchApi } from '@/lib/apiBase';
import { useOrganization } from '@/context/OrganizationContext';

type EventSummary = {
  id: string;
  name: string;
  startDate?: string | null;
  image?: string | null;
};

type Transaction = {
  id: string;
  createdAt: string;
  description: string;
  amount: number; // cents
  status: 'pending' | 'paid' | 'failed';
};

const currency = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function OrganizerFinanceEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const [loading, setLoading] = React.useState(true);
  const [event, setEvent] = React.useState<EventSummary | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const { selectedOrg } = useOrganization();

  const formatCurrency = (n: number) => (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleDownloadPdf = () => {
    const orgName = selectedOrg?.name || 'Organizador';
    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const evName = event?.name || 'Evento';
    const evDateCity = [event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : null, ''].filter(Boolean).join(' ');

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
          <div class="row"><div class="muted">Receita total de vendas online</div><div style="font-weight:700">${formatCurrency(0)}</div></div>
        </div>

        <h3>Dados de Audiência</h3>
        <div class="box">
          <div class="row"><div class="muted"># Ingressos vendidos</div><div>0</div></div>
          <div class="row"><div class="muted"># Convites enviados</div><div>0</div></div>
          <hr class="sep"/>
          <div class="row" style="font-weight:700"><div>Total de participantes</div><div>0</div></div>
        </div>

        <h3>Histórico do Banking</h3>
        <div class="box"><div class="muted">Sem lançamentos.</div></div>

        <h3>Faturamento da Fauves</h3>
        <div class="box">
          <div class="row"><div>Comissão por Vendas de Ingressos</div><div>${formatCurrency(0)}</div></div>
          <div class="row"><div>Taxas de pagamento</div><div>-${formatCurrency(0)}</div></div>
          <hr class="sep"/>
          <div class="row" style="font-weight:700"><div>Faturamento Total da Fauves</div><div>${formatCurrency(0)}</div></div>
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
        // Try a couple endpoints heuristically; backend may vary
        const candidates = [
          `/api/events/${eventId}`,
          `/api/event/${eventId}`,
        ];
        let ev: any | null = null;
        for (const p of candidates) {
          try {
            const r = await fetchApi(p);
            if (!r.ok) continue;
            const j = await r.json();
            if (j && (j.id || j.name)) { ev = j; break; }
          } catch {}
        }
        if (cancelled) return;
        if (ev) {
          setEvent({
            id: ev.id || eventId,
            name: ev.name || ev.title || 'Evento',
            startDate: ev.startDate || ev.startDateUtc || ev.startsAt || null,
            image: ev.image || ev.bannerImage || ev.coverUrl || null,
          });
        } else {
          setEvent({ id: eventId, name: 'Evento', startDate: null, image: null });
        }

        // Transactions (optional)
        const txCandidates = [
          `/api/events/${eventId}/transactions`,
          `/api/event/${eventId}/transactions`,
        ];
        for (const p of txCandidates) {
          try {
            const r = await fetchApi(p);
            if (!r.ok) continue;
            const j = await r.json();
            if (Array.isArray(j)) { setTransactions(j); break; }
            if (Array.isArray(j?.items)) { setTransactions(j.items); break; }
          } catch {}
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
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/organizer-finances" className="text-indigo-700 hover:text-indigo-800">Finanças</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 dark:text-slate-200">{event?.name || 'Evento'}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Balanço do evento</h1>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-12 text-center">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Balanço disponível</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">R$ 0,00</div>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Receita dos ingressos</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">R$ 0,00</div>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Receita líquida</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">R$ 0,00</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900 dark:text-white">Histórico de transações</div>
                <button onClick={handleDownloadPdf} className="h-10 px-4 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] text-sm font-semibold text-slate-700 dark:text-white">Baixar relatório (PDF)</button>
              </div>

              <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">Nenhuma transação encontrada.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead className="bg-[#F6F7FB] text-slate-600 text-xs font-medium">
                        <tr>
                          <th className="py-3 px-4">Data</th>
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4">Valor</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {transactions.map((t) => (
                          <tr key={t.id} className="align-middle">
                            <td className="py-3 px-4">{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
                            <td className="py-3 px-4">{t.description}</td>
                            <td className="py-3 px-4">{currency(t.amount)}</td>
                            <td className="py-3 px-4">{t.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
