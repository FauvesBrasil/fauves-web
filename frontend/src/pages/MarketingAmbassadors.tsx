import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, Ticket, Coins, X } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

type AmbassadorRow = {
  id: string;
  name: string;
  email?: string;
  referredTickets: number;
  generatedRevenue: number;
  cashbackAmount: number;
  refereeDiscountAmount: number;
};

type ProgramConfig = {
  active: boolean;
  cashbackPercent: number; // % for ambassador on ticket price
  discountPercent: number; // % discount to invitee (optional)
};

const defaultProgram: ProgramConfig = { active: false, cashbackPercent: 15, discountPercent: 10 };

export default function MarketingAmbassadors() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Event summary (used by sidebar header)
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');

  // Program state
  const [program, setProgram] = useState<ProgramConfig>({ ...defaultProgram });
  const [rows, setRows] = useState<AmbassadorRow[]>([]);
  const [openConfig, setOpenConfig] = useState(false);
  const [cashbackInput, setCashbackInput] = useState('10');
  const [discountInput, setDiscountInput] = useState('0');

  // Local storage keys
  const storageKey = useMemo(() => `AMBASSADOR_PROGRAM_${id || 'global'}`,[id]);
  const rowsKey = useMemo(() => `AMBASSADOR_ROWS_${id || 'global'}`,[id]);
  const bannerKey = useMemo(() => `AMBASSADOR_BANNER_HIDE_${id || 'global'}`,[id]);
  const [bannerOpen, setBannerOpen] = useState(true);

  // Load event (when in event context)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const res = await fetchApi(`/api/event/${id}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart} às ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch {}
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Load program + rows from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setProgram(raw ? JSON.parse(raw) : { ...defaultProgram });
    } catch {}
    try {
      const rr = localStorage.getItem(rowsKey);
      setRows(rr ? JSON.parse(rr) : []);
    } catch {}
  }, [storageKey, rowsKey]);

  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(program)); } catch {} }, [program, storageKey]);
  useEffect(() => { try { localStorage.setItem(rowsKey, JSON.stringify(rows)); } catch {} }, [rows, rowsKey]);
  useEffect(() => { try { const h = localStorage.getItem(bannerKey); if (h === '1') setBannerOpen(false); } catch {} }, [bannerKey]);
  const dismissBanner = () => { setBannerOpen(false); try { localStorage.setItem(bannerKey, '1'); } catch {} };

  const ticketsSold = useMemo(() => rows.reduce((acc, r) => acc + r.referredTickets, 0), [rows]);
  const totalRevenue = useMemo(() => rows.reduce((acc, r) => acc + r.generatedRevenue, 0), [rows]);
  const programCost = useMemo(() => rows.reduce((acc, r) => acc + r.cashbackAmount + r.refereeDiscountAmount, 0), [rows]);

  // Activate/Save config
  function openActivate() {
    setCashbackInput(String(program.cashbackPercent || 10));
    setDiscountInput(String(program.discountPercent || 0));
    setOpenConfig(true);
  }
  function persistConfig() {
    const cashback = Math.min(100, Math.max(0, Number(cashbackInput) || 0));
    const discount = Math.min(100, Math.max(0, Number(discountInput) || 0));
    setProgram({ active: true, cashbackPercent: cashback, discountPercent: discount });
    setOpenConfig(false);
    toast({ title: 'Programa de Cashback', description: 'Configuração salva.' });
  }

  const { totalLeft } = useLayoutOffsets();

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      <SidebarMenu />
      {id && (
        <EventDetailsSidebar
          eventName={eventName}
          eventDate={eventDate}
          eventStatus={eventStatus}
          onBack={() => navigate(-1)}
          onStatusChange={() => {}}
          onViewEvent={() => { if (id) navigate(`/event/${id}`); }}
          eventIdOverride={id || null}
          fixed
          fixedLeft={70}
          fixedWidth={300}
          fixedTop={0}
        />
      )}
      <AppHeader />

      <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 pb-16 relative">
        <div className="mt-24 max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Programa de Cashback</h1>
            <Button onClick={openActivate} className="bg-indigo-600 hover:bg-indigo-700">{program.active ? 'Configurar' : 'Ativar Programa'}</Button>
          </div>
          {/* Banner (light/dark, dismissible) */}
          {bannerOpen && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212]">
              <button
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
                onClick={dismissBanner}
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="p-8 bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 dark:from-indigo-500/20 dark:to-fuchsia-500/20">
                <div className="text-xl font-semibold text-slate-900 dark:text-white">Transforme seus clientes em Embaixadores</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Aproveite o poder da influência do seu público e recompense-o quando as pessoas comprarem ingressos graças a ele.</div>
                <a className="inline-flex items-center gap-1 mt-3 text-indigo-600 hover:underline" href="https://help.fauves.app/cashback" target="_blank" rel="noreferrer">Saiba mais</a>
              </div>
              <div className="bg-black text-white">
                <div className="px-6 pt-4 pb-3 text-xs tracking-wide opacity-80">EXEMPLO DE BENEFÍCIO</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                  <div className="p-6">
                    <div className="text-5xl font-extrabold">15%</div>
                    <div className="mt-2 text-sm">O Embaixador recebe <span className="font-semibold">15%</span> de cashback por cada ingresso vendido através do link.</div>
                  </div>
                  <div className="p-6">
                    <div className="text-5xl font-extrabold">10%</div>
                    <div className="mt-2 text-sm">O convidado recebe <span className="font-semibold">10%</span> de desconto na compra do ingresso. (opcional)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="text-xs text-slate-500">INGRESSOS VENDIDOS</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white"><Ticket size={18} /> {ticketsSold}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="text-xs text-slate-500">CUSTO DO PROGRAMA DE CASHBACK</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white"><Coins size={18} /> R$ {programCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="text-xs text-slate-500">RECEITA TOTAL GERADA</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white"><TrendingUp size={18} /> R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Table or empty state */}
          <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212]">
            {rows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-lg font-semibold text-slate-900 dark:text-white">Sem clientes-embaixadores ainda</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Ative o Programa de Cashback para transformar os seus clientes em embaixadores.</div>
                {!program.active && <div className="mt-3"><Button onClick={openActivate}>Ativar Programa de Cashback</Button></div>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500 border-b dark:text-slate-300 dark:border-zinc-700">
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4"># Ingressos</th>
                      <th className="py-3 px-4">Revenda gerada</th>
                      <th className="py-3 px-4">Cashback do embaixador</th>
                      <th className="py-3 px-4">Desconto do convidado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b dark:border-zinc-800">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{r.name}</div>
                          {r.email && <div className="text-xs text-slate-500 dark:text-slate-400">{r.email}</div>}
                        </td>
                        <td className="py-3 px-4">{r.referredTickets}</td>
                        <td className="py-3 px-4">R$ {r.generatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">R$ {r.cashbackAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">R$ {r.refereeDiscountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: configurações */}
      <Dialog open={openConfig} onOpenChange={setOpenConfig}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Configurações do Programa de Cashback do evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1a1a1a] p-4">
              <div className="font-medium text-slate-900 dark:text-white mb-3">Benefício do Embaixador</div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Cashback por ingresso vendido (%)</label>
              <Input type="number" min={0} max={100} value={cashbackInput} onChange={(e) => setCashbackInput(e.target.value)} className="mt-1" />
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                O Embaixador vai receber {Number(cashbackInput) || 0}% por ingresso vendido. Ex: se vender 5 ingressos com preço médio de R$ 30, receberá R$ {(Number(cashbackInput) || 0) / 100 * 30 * 5}.
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1a1a1a] p-4">
              <div className="font-medium text-slate-900 dark:text-white mb-3">Benefício do convidado</div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Desconto para convidados (%)</label>
              <Input type="number" min={0} max={100} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="mt-1" />
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">Clientes convidados pelos Embaixadores vão receber {Number(discountInput) || 0}% de desconto.</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenConfig(false)}>Cancelar</Button>
            <Button onClick={persistConfig}>Ativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
