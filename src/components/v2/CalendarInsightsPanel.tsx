import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Check, ChevronDown, Clock, DollarSign, Download, Info, Ticket, UserRound, Users } from 'lucide-react';

type Period = '24hours' | '7days' | '30days' | '3months' | '1year';

type Props = {
  eventCount?: number;
  contactCount?: number;
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: '24hours', label: 'Últimas 24 horas' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: '1year', label: 'Último Ano' },
];

const FEEDBACK_FILTERS = [
  { label: 'Por Evento', icon: Ticket },
  { label: 'Por Convidado', icon: UserRound },
  { label: 'Mais recente', icon: Clock },
];

const atDate = (daysAgo: number, hour = 0) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const SERIES: Record<Period, Array<{ date: string; views: number }>> = {
  '24hours': [0, 4, 8, 12, 16, 20, 23].map((hour, index) => ({ date: atDate(0, hour), views: index === 5 ? 1 : 0 })),
  '7days': [
    { date: atDate(6), views: 0 },
    { date: atDate(5, 9), views: 3 },
    { date: atDate(4), views: 0 },
    { date: atDate(3), views: 0 },
    { date: atDate(2, 18), views: 1 },
    { date: atDate(2, 23), views: 2 },
    { date: atDate(1, 8), views: 1 },
    { date: atDate(1, 22), views: 1 },
    { date: atDate(0), views: 0 },
  ],
  '30days': Array.from({ length: 11 }, (_, index) => ({ date: atDate(30 - index * 3), views: index === 2 ? 1 : index === 8 ? 3 : 0 })),
  '3months': Array.from({ length: 10 }, (_, index) => ({ date: atDate(90 - index * 10), views: index === 4 ? 3 : index === 8 ? 2 : 0 })),
  '1year': Array.from({ length: 13 }, (_, index) => ({ date: atDate(365 - index * 30), views: index === 5 ? 4 : index === 10 ? 3 : 0 })),
};

const periodLabel = (period: Period) => PERIODS.find((option) => option.value === period)?.label || 'Últimos 7 dias';

const formatAxisDate = (value: string, period: Period) => {
  const date = new Date(value);
  if (period === '24hours') return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: period === '7days' ? '2-digit' : undefined }).replace('.', '');
};

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { date?: string; views?: number } }> }) => {
  if (!active || !payload?.length || !payload[0]?.payload?.date) return null;
  const point = payload[0].payload;
  const views = Number(point.views || 0);
  return (
    <div className="pointer-events-none text-[13px] font-semibold leading-5 text-[#ff4fa3] drop-shadow-[0_1px_8px_rgba(0,0,0,.9)]">
      <div>{new Date(point.date).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit' }).replace('.', '')}</div>
      <div>{views} {views === 1 ? 'visualização' : 'visualizações'}</div>
    </div>
  );
};

const FeedbackEmptyArt = () => (
  <svg viewBox="0 0 210 180" className="h-[180px] w-[210px]" aria-hidden="true">
    <defs>
      <linearGradient id="feedback-card-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#555658" />
        <stop offset="1" stopColor="#292a2c" />
      </linearGradient>
      <filter id="feedback-star-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <rect x="39" y="30" width="145" height="118" rx="15" fill="url(#feedback-card-gradient)" stroke="#626365" strokeOpacity=".45" />
    <rect x="56" y="47" width="43" height="10" rx="5" fill="#171819" />
    <rect x="56" y="68" width="111" height="43" rx="9" fill="#171819" />
    <g fill="#18191a" stroke="#656669" strokeWidth="2">
      {[63, 87, 111, 135, 159].map((x) => <path key={x} d={`M${x} 118l3 6 7 .9-5 4.8 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-4.8 7-.9 3-6z`} />)}
    </g>
    <rect x="56" y="143" width="83" height="12" rx="6" fill="#252628" />
    <path d="M34 44l5.3 10.8L51 56.5l-8.5 8.2 2 11.6L34 70.8l-10.5 5.5 2-11.6-8.5-8.2 11.7-1.7L34 44z" fill="#f6b83d" filter="url(#feedback-star-glow)" />
    <path d="M184 104l6.6 13.4 14.8 2.1-10.7 10.4 2.5 14.7-13.2-7-13.2 7 2.5-14.7-10.7-10.4 14.8-2.1L184 104z" fill="#f6b83d" filter="url(#feedback-star-glow)" />
  </svg>
);

export function CalendarInsightsPanel({ eventCount = 0, contactCount = 0 }: Props) {
  const [period, setPeriod] = React.useState<Period>('7days');
  const [periodOpen, setPeriodOpen] = React.useState(false);
  const [feedbackFilter, setFeedbackFilter] = React.useState('Por Evento');
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const periodRef = React.useRef<HTMLDivElement>(null);
  const feedbackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!periodRef.current?.contains(event.target as Node)) setPeriodOpen(false);
      if (!feedbackRef.current?.contains(event.target as Node)) setFeedbackOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPeriodOpen(false); setFeedbackOpen(false); }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const downloadFeedback = () => {
    const blob = new Blob(['Evento,Avaliação,Comentário,Data\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feedback-do-calendario.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const buttonClass = 'flex h-[31px] items-center gap-1.5 rounded-lg border-0 bg-white/[0.10] px-3 text-[14px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.15] hover:text-white';

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="text-left font-sans">
      <section>
        <div className="grid grid-cols-2 gap-x-7 gap-y-6 md:grid-cols-4">
          {[
            { label: 'Eventos', value: eventCount, previous: `${eventCount} na semana passada`, icon: CalendarDays },
            { label: 'Ingressos', value: 0, previous: '0 na semana passada', icon: Ticket },
            { label: 'Contatos', value: contactCount, previous: '0 na semana passada', icon: Users },
            { label: 'Vendas', value: 'R$ 0,00', previous: 'R$ 0,00 na semana passada', icon: DollarSign },
          ].map((metric) => <div key={metric.label}><div className="flex items-center gap-1.5 text-[14px] font-semibold text-zinc-500"><metric.icon size={14} strokeWidth={2} />{metric.label}</div><strong className="mt-0.5 block text-[22px] leading-7 text-white">{metric.value}</strong><div className="mt-1 text-[14px] font-semibold text-zinc-300">{metric.previous}</div></div>)}
        </div>
        <div className="mt-[18px] flex items-center gap-2 text-[14px] font-medium leading-5 text-zinc-500"><Info size={14} className="shrink-0" /><span>Apenas os eventos criados neste calendário são contabilizados nessas estatísticas.</span></div>
      </section>

      <div className="my-8 h-px bg-white/[0.10]" />

      <section>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Visualizações de Página</h2><p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Veja as visualizações recentes da página do calendário.</p></div>
          <div ref={periodRef} className="relative shrink-0">
            <button type="button" onClick={() => setPeriodOpen((open) => !open)} aria-expanded={periodOpen} className={buttonClass}><Clock size={14} />{periodLabel(period)}<ChevronDown size={14} /></button>
            <AnimatePresence>{periodOpen && <motion.div initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="absolute right-0 top-[38px] z-30 w-[143px] origin-top-right rounded-[9px] border border-white/10 bg-[#242526] p-1.5 shadow-2xl">{PERIODS.map((option) => <button key={option.value} type="button" onClick={() => { setPeriod(option.value); setPeriodOpen(false); }} className="flex h-9 w-full items-center rounded-md border-0 bg-transparent px-2 text-left text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.10]">{option.label}</button>)}</motion.div>}</AnimatePresence>
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-white/10 bg-[#1d1f20]">
          <div className="h-[250px] px-4 pb-1 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SERIES[period]} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="date" tickFormatter={(value) => formatAxisDate(value, period)} stroke="#595b5e" fontSize={11} tickLine={false} axisLine={{ stroke: '#3b3d40' }} minTickGap={60} />
                <YAxis allowDecimals={false} stroke="#737579" fontSize={11} tickLine={false} axisLine={{ stroke: '#3b3d40' }} domain={[0, (maximum: number) => Math.max(3, maximum)]} />
                <Tooltip cursor={{ fill: 'rgba(236,72,153,.10)' }} content={<ChartTooltip />} />
                <Bar dataKey="views" fill="#ef4895" barSize={7} radius={[3, 3, 0, 0]} activeBar={{ fill: '#ff55a5' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 border-t border-white/10 bg-[#292a2c] md:grid-cols-2 md:divide-x md:divide-white/10">
            <div className="min-h-[300px] p-5">
              <h3 className="text-[16px] font-bold text-white">Visualizações de Página</h3>
              <div className="mt-3 grid grid-cols-3 gap-5">{[['24 horas', 0], ['7 dias', 8], ['30 dias', 9]].map(([label, value]) => <div key={String(label)}><div className="text-[14px] text-zinc-300">{label}</div><div className="mt-1 text-[18px] font-bold leading-6 text-white">{value}</div></div>)}</div>
              <h3 className="mt-7 text-[16px] font-bold text-white">Tráfego ao vivo</h3>
              <p className="mt-3 text-[15px] font-medium text-white">Nenhuma visualização de página na última hora.</p>
              <p className="mt-1 max-w-[360px] text-[14px] leading-5 text-zinc-400">Comece a compartilhar seu link e você verá o tráfego em tempo real aqui.</p>
            </div>
            <div className="min-h-[300px] border-t border-white/10 p-5 md:border-t-0">
              <h3 className="text-[16px] font-bold text-white">Fontes</h3><div className="mt-3 flex items-center justify-between text-[14px]"><span className="font-medium text-zinc-300">Fauves</span><strong className="text-white">88%</strong></div>
              <h3 className="mt-6 text-[16px] font-bold text-white">Cidades</h3><div className="mt-3 space-y-2 text-[14px]"><div className="flex justify-between gap-3"><span className="text-zinc-300">Pouso Alegre, Minas Gerais</span><strong>63%</strong></div><div className="flex justify-between gap-3"><span className="text-zinc-300">Fortaleza, Ceará</span><strong>38%</strong></div></div>
              <h3 className="mt-6 text-[16px] font-bold text-white">Fontes UTM</h3><p className="mt-3 text-[14px] leading-5 text-zinc-400">Configure um link de rastreamento adicionando <span className="font-mono">?utm_source=nome-do-seu-link</span> à sua URL.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="my-8 h-px bg-white/[0.10]" />

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Feedback do Evento</h2>
          <div className="flex items-center gap-1.5">
            <div ref={feedbackRef} className="relative">
              <button type="button" onClick={() => setFeedbackOpen((open) => !open)} aria-expanded={feedbackOpen} className={`flex h-[31px] items-center gap-1.5 rounded-lg border-0 px-3 text-[14px] font-semibold transition-colors ${feedbackOpen ? 'bg-[#b4b5b7] text-[#242526]' : 'bg-white/[0.10] text-zinc-300 hover:bg-[#b4b5b7] hover:text-[#242526]'}`}>{feedbackFilter}<ChevronDown size={14} /></button>
              <AnimatePresence>{feedbackOpen && <motion.div initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="absolute right-0 top-[38px] z-30 w-[172px] origin-top-right rounded-[9px] border border-white/10 bg-[#242526] p-1.5 shadow-2xl">{FEEDBACK_FILTERS.map((option) => { const FilterIcon = option.icon; const selected = feedbackFilter === option.label; return <button key={option.label} type="button" onClick={() => { setFeedbackFilter(option.label); setFeedbackOpen(false); }} className={`grid h-9 w-full grid-cols-[16px_18px_1fr] items-center gap-2 rounded-md border-0 px-2 text-left text-[14px] font-semibold text-white ${selected ? 'bg-white/10' : 'bg-transparent hover:bg-white/[0.06]'}`}><span>{selected && <Check size={15} />}</span><FilterIcon size={16} className="text-zinc-400" /><span>{option.label}</span></button>; })}</motion.div>}</AnimatePresence>
            </div>
            <div className="group relative"><button type="button" onClick={downloadFeedback} aria-label="Baixar como CSV" className="flex h-[31px] w-[31px] items-center justify-center rounded-lg border-0 bg-white/[0.10] p-0 text-zinc-300 transition-colors hover:bg-[#b4b5b7] hover:text-[#242526]"><Download size={15} /></button><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 z-40 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-[13px] font-medium leading-none text-zinc-800 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">Baixar como CSV<span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-white" /></span></div>
          </div>
        </div>
        <div className="flex min-h-[405px] flex-col items-center justify-center pb-12 text-center">
          <FeedbackEmptyArt />
          <h3 className="mt-2 text-[20px] font-bold text-zinc-400">Nenhum Feedback</h3>
          <p className="mt-1 text-[16px] font-medium text-zinc-400">Nenhum feedback foi coletado para seus eventos.</p>
        </div>
      </section>
    </motion.div>
  );
}
