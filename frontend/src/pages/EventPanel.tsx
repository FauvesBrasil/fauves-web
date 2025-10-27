import * as React from "react";
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate } from "react-router-dom";
import { fetchApi } from '@/lib/apiBase';
import { getEventPath } from '@/lib/eventUrl';
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clipboard, ClipboardCheck, Users, Percent, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useOrganization } from '@/context/OrganizationContext';

const EventPanel: React.FC = () => {
  const { totalLeft } = useLayoutOffsets();
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId; // manter nome local, rota interna painel continua por ID após criação
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<any[]>([]);
  const [soldCount, setSoldCount] = React.useState<number>(0);
  const [capacity, setCapacity] = React.useState<number>(0);
  const [netSales, setNetSales] = React.useState<number>(0);
  const [pageViews, setPageViews] = React.useState<number>(0);
  const [copyOk, setCopyOk] = React.useState(false);
  // Courtesy form state
  const [courtesyEmail, setCourtesyEmail] = React.useState("");
  const [courtesyTicketTypeId, setCourtesyTicketTypeId] = React.useState<string>("");
  const { toast } = useToast();
  const [courtesyLoading, setCourtesyLoading] = React.useState(false);
  // Stricter email validation (HTML5-like)
  const isValidEmail = React.useCallback((s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()), []);
  const emailInvalid = courtesyEmail.length > 0 && !isValidEmail(courtesyEmail);
  const courtesyDisabled = courtesyLoading || !isValidEmail(courtesyEmail) || !courtesyTicketTypeId;

  const { selectedOrg } = useOrganization();

  React.useEffect(() => {
    if (!id || !selectedOrg) return;
    let cancelled = false;
    // Reset state when id or org changes
    setLoading(true);
    setError(null);
    setEvent(null);
    setTicketTypes([]);
    setSoldCount(0);
    setCapacity(0);
    setNetSales(0);
    setPageViews(0);

    const belongsToSelected = (evt: any) => !!evt && (evt.organizerId === selectedOrg.id || evt.organizationId === selectedOrg.id);

    const load = async () => {
      try {
        // 1. Fetch event
        const res = await fetchApi(`/api/event/${id}`);
        if (!res.ok) throw new Error('Falha ao carregar evento');
        const evt = await res.json();
        if (cancelled) return;

        if (!belongsToSelected(evt)) {
          // 2. Fetch org events list to redirect
            const listRes = await fetchApi(`/api/organization/${selectedOrg.id}/events`);
            let list: any[] = [];
            if (listRes.ok) {
              try { const j = await listRes.json(); if (Array.isArray(j)) list = j; } catch {}
            }
            if (cancelled) return;
            if (list.length > 0) {
              // Navigate to first event of this org
              navigate(`/painel-evento/${list[0].id}`, { replace: true });
            } else {
              navigate('/organizer-events', { replace: true });
            }
            return; // stop further loads
        }
        // Event matches organization, set and continue loading sub-resources
        setEvent(evt);
        // Tickets
        const ticketsRes = await fetchApi(`/api/ticket-type/event/${id}`);
        if (!cancelled && ticketsRes.ok) {
          const list = await ticketsRes.json();
          const arr = Array.isArray(list) ? list : [];
          setTicketTypes(arr);
          const cap = arr.reduce((acc: number, t: any) => acc + (Number(t.maxQuantity) || 0), 0);
          setCapacity(cap);
          setNetSales(0);
        }
        // Sold count
        const soldRes = await fetchApi(`/api/ticket/event/${id}/count`);
        if (!cancelled && soldRes.ok) {
          const json = await soldRes.json();
            setSoldCount(Number(json?.count || 0));
        }
        // Sold by type
        const byTypeRes = await fetchApi(`/api/ticket/event/${id}/by-type`);
        if (!cancelled && byTypeRes.ok) {
          const rows = await byTypeRes.json();
          const map: Record<string, number> = {};
          (rows || []).forEach((r: any) => { if (r.ticketTypeId) map[r.ticketTypeId] = Number(r.count || 0); });
          setTicketTypes(prev => prev.map(t => ({ ...t, soldCount: map[t.id] || 0 })));
        }
        // Placeholder page views
        if (!cancelled) setPageViews(0);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erro ao carregar o evento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, selectedOrg?.id]);

  const formatBRL = React.useCallback((n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n).replace(/\s/g, ''), []);
  const eventLink = React.useMemo(() => {
    if (!event || !id) return '';
    return window.location.origin + getEventPath({ id: event.id || id, slug: event.slug });
  }, [event, id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventLink);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    } catch (_) {}
  };

  // Courtesies refresh callback to be passed to child
  const courtesiesRef = React.useRef<() => void>();
  const setCourtesiesFetcher = (fn: () => void) => { courtesiesRef.current = fn; };
  const fetchCourtesies = () => courtesiesRef.current?.();

  const issueCourtesy = async () => {
    if (!id || courtesyDisabled) return;
    try {
      setCourtesyLoading(true);
      // Reuse ticket creation endpoint for now (no user binding in schema yet)
      // issuer = current user id (if logged in)
      const { data: userData } = await supabase.auth.getUser();
      const issuerId = userData?.user?.id;
      const res = await fetchApi('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, ticketTypeId: courtesyTicketTypeId, email: courtesyEmail, issuedBy: issuerId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.assigned) {
          toast({ title: 'Cortesia emitida', description: 'O ingresso já está disponível na conta do participante.' });
        } else if (data?.invited) {
          toast({ title: 'Convite enviado', description: 'Enviamos um e-mail para criar conta e acessar a cortesia.' });
        } else {
          toast({ title: 'Cortesia emitida', description: 'O ingresso de cortesia foi emitido com sucesso.' });
        }
        setCourtesyEmail('');
        setCourtesyTicketTypeId('');
        setSoldCount((s) => s + 1);
        // Update by-type count locally
        setTicketTypes((prev) => prev.map((t) => t.id === courtesyTicketTypeId ? { ...t, soldCount: (t.soldCount || 0) + 1 } : t));
      }
      else {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Falha ao emitir cortesia', description: err?.error || 'Tente novamente', variant: 'destructive' as any });
      }
    } catch (e: any) {
      toast({ title: 'Erro de conexão', description: 'Não foi possível emitir cortesia.', variant: 'destructive' as any });
    } finally {
      setCourtesyLoading(false);
      // Refresh courtesies list after issuing
      fetchCourtesies();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
      {/* Fixed main sidebar */}
      <SidebarMenu />
  {/* Fixed event details sidebar */}
      <EventDetailsSidebar
          eventName={event?.name}
          eventDate={event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : undefined}
          eventStatus={event?.isPublished ? 'Publicado' : 'Rascunho'}
          onBack={() => navigate('/organizer-events')}
          onViewEvent={() => event && navigate(getEventPath({ id: event.id || id!, slug: event.slug }))}
            eventIdOverride={id || null}
  panelRoute={`/painel-evento/${id}`}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
      />
      {/* Global header (full width) */}
      <AppHeader />
      {/* Content with left margin for both sidebars */}
  <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 min-h-screen relative">
          <div className="mt-24 max-w-[900px]">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-80 bg-gray-200 rounded mb-8" />
              <div className="h-40 w-full bg-gray-200 rounded" />
            </div>
          ) : error ? (
            <div className="text-red-600 font-semibold">{error}</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-[38px] font-bold text-[#091747] dark:text-white">Painel</h1>
                </div>
              </div>
              {/* Cards topo */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-[#242424] rounded-2xl border border-gray-200 dark:border-[#1F1F1F] p-5">
                  <div className="text-sm text-[#091747]/70 dark:text-slate-300">Vendas líquidas</div>
                  <div className="text-2xl font-bold text-[#091747] dark:text-white mt-1">{formatBRL(netSales)}</div>
                  <button className="text-xs text-[#2A2AD7] dark:text-white mt-2 hover:underline">Abrir o detalhamento de vendas do evento</button>
                </div>
                <div className="bg-white dark:bg-[#242424] rounded-2xl border border-gray-200 dark:border-[#1F1F1F] p-5">
                  <div className="text-sm text-[#091747]/70 dark:text-slate-300">Ingressos vendidos</div>
                  <div className="text-2xl font-bold text-[#091747] dark:text-white mt-1">{soldCount}/{capacity}</div>
                  <div className="text-xs text-[#091747]/70 dark:text-slate-300 mt-1">—</div>
                </div>
                <div className="bg-white dark:bg-[#242424] rounded-2xl border border-gray-200 dark:border-[#1F1F1F] p-5">
                  <div className="text-sm text-[#091747]/70 dark:text-slate-300">Visualizações de página</div>
                  <div className="text-2xl font-bold text-[#091747] dark:text-white mt-1">{pageViews}</div>
                  <button className="text-xs text-[#2A2AD7] dark:text-white mt-2 hover:underline">Abrir relatório de visualizações de página</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Emitir cortesia */}
                <div className="col-span-2 bg-white dark:bg-[#242424] rounded-2xl border-2 border-[#F15A29] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#EF4118]">🎫</span>
                    <div className="text-[#091747] font-semibold text-lg">Emitir cortesia</div>
                  </div>
                  <div className="text-xs text-[#091747]/70 dark:text-slate-300 mb-3">Use para convidados, parceiros e VIPs sem cobrança.</div>
                  <div className="flex flex-col gap-3 mb-4">
                    <Input
                      value={courtesyEmail}
                      onChange={(e) => setCourtesyEmail(e.target.value)}
                      placeholder="E-mail do participante"
                      aria-invalid={emailInvalid}
                      className={`h-11 ${emailInvalid ? 'border-red-500 focus-visible:ring-red-300' : ''} dark:bg-[#121212] dark:border-transparent dark:text-white`}
                    />
                    <Select value={courtesyTicketTypeId} onValueChange={setCourtesyTicketTypeId}>
                      <SelectTrigger className="h-11 dark:bg-[#121212] dark:border-transparent dark:text-white">
                        <SelectValue placeholder="Tipo do ingresso" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.filter(t => !t.isHalf).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-11 bg-[#EF4118] hover:bg-[#d53a14] text-white text-base disabled:opacity-60 flex items-center justify-center gap-2" onClick={issueCourtesy} disabled={courtesyDisabled}>
                    {courtesyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {courtesyLoading ? 'Emitindo…' : 'Emitir'}
                  </Button>
                </div>
                {/* Compartilhar */}
                <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-6">
                  <div className="text-[#091747] font-semibold mb-2 dark:text-white">Compartilhar</div>
                  <div className="text-xs text-[#091747]/70 mb-2 dark:text-slate-300">Link do evento</div>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={eventLink} className="dark:bg-[#121212] dark:border-transparent dark:text-white" />
                    <Button variant="outline" onClick={copyLink} className="flex items-center gap-2 dark:text-white">
                      {copyOk ? <ClipboardCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                      {copyOk ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                  <div className="text-xs text-[#091747]/70 mt-3 dark:text-slate-300">Compartilhar no</div>
                  <div className="flex items-center gap-2 mt-2 text-[#2A2AD7] dark:text-white">
                    <button aria-label="E-mail">✉️</button>
                    <button aria-label="WhatsApp">🟢</button>
                    <button aria-label="Facebook">f</button>
                    <button aria-label="X">𝕏</button>
                    <button aria-label="LinkedIn">in</button>
                    <button aria-label="Mais"><Share2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Vendas por tipo de ingresso */}
              <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-6 mt-6">
                <div className="font-semibold text-[#091747] mb-3 dark:text-white">Vendas por tipo de ingresso</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[#091747]/70">
                        <th className="py-2">Tipo de ingresso</th>
                        <th className="py-2">Preço</th>
                        <th className="py-2">Vendidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketTypes.filter(t => !t.isHalf).map((t) => (
                        <tr key={t.id} className="border-t border-gray-100 dark:border-[#1F1F1F]">
                          <td className="py-2">{t.name}</td>
                          <td className="py-2">{Number(t.price) > 0 ? formatBRL(Number(t.price)) : 'R$0,00'}</td>
                          <td className="py-2">{t.soldCount ?? 0}</td>
                        </tr>
                      ))}
                      {ticketTypes.filter(t => !t.isHalf).length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-[#091747]/60 dark:text-slate-300">Nenhum ingresso cadastrado ainda</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cortesias recentes */}
              <RecentCourtesies eventId={id!} onReady={setCourtesiesFetcher} />

              {/* Pedidos recentes */}
              <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-6 mt-6">
                <div className="font-semibold text-[#091747] mb-3 dark:text-white">Pedidos recentes</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[#091747]/70 dark:text-slate-300">
                        <th className="py-2">Pedido n.º</th>
                        <th className="py-2">Nome</th>
                        <th className="py-2">Quantidade</th>
                        <th className="py-2">Preço</th>
                        <th className="py-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Static examples since backend not wired yet */}
                      {[1,2,3].map(i => (
                        <tr key={i} className="border-t border-gray-100 bg-indigo-50/30 dark:border-[#1F1F1F] dark:bg-indigo-900/10">
                          <td className="py-2 font-medium text-indigo-600 dark:text-indigo-300">EXEMPLO{i}<span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-indigo-600 text-white">demo</span></td>
                          <td className="py-2 dark:text-slate-300">Participante {i}</td>
                          <td className="py-2 dark:text-slate-300">{i+1}</td>
                          <td className="py-2 dark:text-slate-300">R${(i*120).toFixed(2).replace('.', ',')}</td>
                          <td className="py-2 dark:text-slate-300">{new Date(Date.now()-i*3600000).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={5} className="py-3 text-[11px] text-indigo-600 text-center bg-indigo-50 border-t border-indigo-100 dark:text-slate-300 dark:bg-indigo-900/10 dark:border-[#1F1F1F]">Exibindo exemplos estáticos. Integre pedidos reais para substituir.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
  );
};

export default EventPanel;

// --- Cortesias recentes ---
const RecentCourtesies: React.FC<{ eventId: string, onReady?: (fn: () => void) => void }> = ({ eventId, onReady }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCourtesies = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/ticket/event/${eventId}/courtesies`);
      if (!res.ok) throw new Error('Falha ao carregar cortesias');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar cortesias');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchCourtesies();
    onReady?.(fetchCourtesies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCourtesies]);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mt-6 dark:bg-[#242424] dark:border-[#1F1F1F]">
      <div className="font-semibold text-[#091747] mb-3 dark:text-white">Cortesias recentes</div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="h-6 w-full bg-gray-200 rounded animate-pulse dark:bg-[#1F1F1F]" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <>
          <div className="text-sm text-[#091747]/70 dark:text-slate-300">Sem cortesias ainda</div>
          <div className="mt-4 space-y-2">
            {[1,2].map(i => (
              <div key={i} className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 text-[12px] flex justify-between dark:bg-indigo-900/10 dark:border-[#1F1F1F]">
                <span className="font-medium text-indigo-700 dark:text-indigo-300">CORTESIA_EXEMPLO_{i}</span>
                <span className="text-indigo-600 dark:text-slate-300">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
            <div className="text-[11px] text-indigo-500 dark:text-slate-300">Exemplos estáticos para layout.</div>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#091747]/70">
                <th className="py-2">Participante</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Emitido por</th>
                <th className="py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-[#1F1F1F]">
                  <td className="py-2 dark:text-slate-300">{r.userEmail || r.guestEmail || '—'}</td>
                  <td className="py-2 dark:text-slate-300">{r.ticketTypeName || '—'}</td>
                  <td className="py-2 dark:text-slate-300">{r.issuerEmail || '—'}</td>
                  <td className="py-2 dark:text-slate-300">{r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
