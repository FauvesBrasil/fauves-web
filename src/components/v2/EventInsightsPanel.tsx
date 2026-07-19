import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, Clock, ExternalLink, MapPin, Monitor } from 'lucide-react';

type Period = '24hours' | '7days' | '30days' | '3months';

type InsightsData = {
  series?: Array<{ date: string; views: number }>;
  totals?: { last24Hours?: number; last7Days?: number; last30Days?: number };
  sources?: Array<{ label: string; count: number; percentage: number }>;
  cities?: Array<{ label: string; count: number; percentage: number }>;
  utmSources?: Array<{ label: string; count: number; percentage: number }>;
  liveTraffic?: Array<{ source: string; city?: string; region?: string; viewedAt: string }>;
  referrals?: Array<{ id: string; referralCode: string; totalSales: number; totalRevenue: number; name?: string; email?: string }>;
  feedback?: { enabled?: boolean; scheduledAt?: string | null; sentAt?: string | null; responseCount?: number; average?: number };
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: '24hours', label: 'Últimas 24 horas' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '3months', label: 'Últimos 3 meses' },
];

const formatAxisDate = (value: string, period: Period) => {
  const date = new Date(value);
  if (period === '24hours') return date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: period === '7days' ? '2-digit' : undefined }).replace('.', '');
};

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const views = Number(point?.views || 0);
  return (
    <div className="pointer-events-none text-[#ff4fa3] text-[13px] font-semibold leading-5 drop-shadow-[0_1px_8px_rgba(0,0,0,.9)]">
      <div>{new Date(point.date).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit' }).replace('.', '')}</div>
      <div>{views} {views === 1 ? 'visualização' : 'visualizações'}</div>
    </div>
  );
};

const EmptyReferralIcon = () => (
  <svg viewBox="0 0 150 150" className="w-[145px] h-[145px] text-zinc-700" fill="none" stroke="currentColor">
    <ellipse cx="75" cy="75" rx="59" ry="20" strokeWidth="4" transform="rotate(-18 75 75)" />
    <ellipse cx="75" cy="75" rx="59" ry="20" strokeWidth="4" transform="rotate(62 75 75)" />
    <ellipse cx="75" cy="75" rx="59" ry="20" strokeWidth="4" transform="rotate(20 75 75)" />
    <path d="M75 38c-17 0-29 13-29 29 0 21 29 48 29 48s29-27 29-48c0-16-12-29-29-29Z" fill="currentColor" strokeWidth="3" />
    <circle cx="75" cy="67" r="10" fill="#151617" stroke="none" />
    <circle cx="20" cy="69" r="5" fill="currentColor" stroke="none" />
    <circle cx="124" cy="49" r="5" fill="currentColor" stroke="none" />
    <circle cx="116" cy="115" r="5" fill="currentColor" stroke="none" />
  </svg>
);

const FeedbackEnvelope = () => (
  <svg viewBox="0 0 150 105" className="w-[150px] h-[105px] text-zinc-700" fill="none" stroke="currentColor">
    <defs>
      <linearGradient id="feedback-envelope" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3f3f42" />
        <stop offset="1" stopColor="#202022" />
      </linearGradient>
    </defs>
    <rect x="18" y="15" width="114" height="74" rx="7" fill="url(#feedback-envelope)" strokeWidth="2" />
    <path d="m20 20 55 43 55-43" stroke="#4b4b4f" strokeWidth="2" />
    <path d="m20 85 41-36M130 85 89 49" stroke="#303034" strokeWidth="2" />
    <circle cx="75" cy="62" r="12" fill="#3d3d40" stroke="#4a4a4e" />
    <path d="m69 62 4 4 8-9" stroke="#1c1c1e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function EventInsightsPanel({
  data,
  loading,
  period,
  onPeriodChange,
  dropdownOpen,
  onDropdownOpenChange,
  onScheduleFeedback,
  eventId,
}: {
  data: InsightsData | null;
  loading: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
  dropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  onScheduleFeedback: () => void;
  eventId: string;
}) {
  const series = data?.series || [];
  const totals = data?.totals || {};
  const liveTraffic = data?.liveTraffic || [];
  const referrals = data?.referrals || [];
  const feedback = data?.feedback || {};
  const periodLabel = PERIODS.find((option) => option.value === period)?.label || 'Últimos 7 dias';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`text-left transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
      <div className="font-sans">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[20px] leading-7 font-bold text-white">Visualizações de Página</h2>
            <p className="text-zinc-300 text-[16px] leading-6 mt-0.5">Veja as visualizações recentes da página do evento.</p>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => onDropdownOpenChange(!dropdownOpen)}
              className="h-[31px] px-3 flex items-center gap-1.5 rounded-[8px] bg-[#2b2c2e] border-0 text-zinc-300 text-[14px] font-semibold cursor-pointer hover:bg-[#343537]"
            >
              <Clock size={14} />
              {periodLabel}
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => onDropdownOpenChange(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="fauves-floating-surface absolute right-0 top-[38px] z-30 w-[136px] rounded-[9px] border p-1"
                  >
                    {PERIODS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => { onPeriodChange(option.value); onDropdownOpenChange(false); }}
                        className={`w-full h-[32px] px-2 rounded-[5px] border-0 text-left text-[14px] font-semibold text-white cursor-pointer ${period === option.value ? 'bg-white/10' : 'bg-transparent hover:bg-white/[0.06]'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-white/10 bg-[#1d1f20]">
          <div className="h-[250px] px-4 pt-5 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="date" tickFormatter={(value) => formatAxisDate(value, period)} stroke="#595b5e" fontSize={11} tickLine={false} axisLine={{ stroke: '#3b3d40' }} minTickGap={42} />
                <YAxis allowDecimals={false} stroke="#737579" fontSize={11} tickLine={false} axisLine={{ stroke: '#3b3d40' }} domain={[0, (maximum: number) => Math.max(1, Math.ceil(maximum * 1.15))]} />
                <Tooltip cursor={{ fill: 'rgba(236,72,153,.13)' }} content={<ChartTooltip />} />
                <Bar dataKey="views" fill="#ef4895" barSize={7} radius={[3, 3, 0, 0]} activeBar={{ fill: '#ff55a5' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/10 bg-[#292a2c] md:divide-x divide-white/10">
            <div className="p-5 min-h-[300px]">
              <h3 className="text-[16px] font-bold text-white">Visualizações de Página</h3>
              <div className="grid grid-cols-3 gap-5 mt-3">
                {[
                  ['24 horas', totals.last24Hours || 0],
                  ['7 dias', totals.last7Days || 0],
                  ['30 dias', totals.last30Days || 0],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <div className="text-zinc-300 text-[14px]">{label}</div>
                    <div className="text-white text-[18px] leading-6 font-bold mt-1">{value}</div>
                  </div>
                ))}
              </div>

              <h3 className="text-[16px] font-bold text-white mt-7">Tráfego ao vivo</h3>
              {liveTraffic.length === 0 ? (
                <div className="mt-3">
                  <p className="text-white text-[15px] font-medium">Nenhuma visualização de página na última hora.</p>
                  <p className="text-zinc-400 text-[14px] leading-5 mt-1">Comece a compartilhar seu link e você verá o tráfego em tempo real aqui.</p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {liveTraffic.slice(0, 4).map((visitor, index) => (
                    <div key={`${visitor.viewedAt}-${index}`} className="flex items-center justify-between rounded-[8px] bg-black/10 px-3 py-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Monitor size={15} className="text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-white text-[13px] font-semibold truncate">Visitante de {visitor.source || 'acesso direto'}</div>
                          {(visitor.city || visitor.region) && <div className="text-zinc-400 text-[11px] flex items-center gap-1"><MapPin size={10} />{[visitor.city, visitor.region].filter(Boolean).join(', ')}</div>}
                        </div>
                      </div>
                      <span className="text-zinc-500 text-[11px]">{new Date(visitor.viewedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 min-h-[300px] border-t md:border-t-0 border-white/10">
              <MetricList title="Fontes" rows={data?.sources || []} empty="Nenhuma fonte identificada." />
              <MetricList title="Cidades" rows={data?.cities || []} empty="As cidades aparecerão quando o provedor de acesso disponibilizar a localização." className="mt-6" />
              <MetricList title="Fontes UTM" rows={data?.utmSources || []} empty="Configure um link de rastreamento adicionando ?utm_source=nome-do-seu-link à sua URL." className="mt-6" />
            </div>
          </div>
        </div>

        <section className="mt-8 pt-7 border-t border-white/10">
          <h3 className="text-[20px] leading-7 font-bold text-white">Indicações de Cadastro</h3>
          <p className="text-zinc-300 text-[16px] leading-6 mt-0.5">Cada convidado tem um link de indicação único para convidar amigos. <a href={`/marketing/embaixadores/${eventId}`} className="inline-flex items-center gap-0.5 text-[#ff6bac] font-semibold no-underline hover:underline">Saiba mais <ExternalLink size={13} /></a></p>
          {referrals.length === 0 ? (
            <div className="min-h-[350px] flex flex-col items-center justify-center text-center">
              <EmptyReferralIcon />
              <h4 className="text-zinc-400 text-[20px] font-bold mt-3">Sem Indicações</h4>
              <p className="text-zinc-400 text-[16px] leading-6 max-w-[600px] mt-1">As indicações começarão a aparecer aqui quando os convidados começarem a convidar seus amigos.</p>
            </div>
          ) : (
            <div className="mt-6 rounded-[12px] border border-white/10 overflow-hidden divide-y divide-white/10">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-white/[0.03]">
                  <div><div className="text-white font-semibold">{referral.name || referral.email || referral.referralCode}</div><div className="text-zinc-500 text-xs">{referral.referralCode}</div></div>
                  <div className="text-right"><div className="text-white font-bold">{referral.totalSales || 0} inscrições</div><div className="text-zinc-500 text-xs">R$ {Number(referral.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pt-7 border-t border-white/10">
          <h3 className="text-[20px] leading-7 font-bold text-white">Feedback do Evento</h3>
          <p className="text-zinc-300 text-[16px] leading-6 mt-0.5">Veja o quanto seus convidados gostaram do evento.</p>
          {Number(feedback.responseCount || 0) > 0 ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <div className="text-center"><div className="text-[#ff4f9c] text-[44px] font-bold">{Number(feedback.average || 0).toFixed(1)}</div><div className="text-zinc-300 text-[17px] font-semibold">{feedback.responseCount} respostas recebidas</div></div>
            </div>
          ) : feedback.enabled ? (
            <div className="min-h-[320px] flex flex-col items-center justify-center text-center">
              <FeedbackEnvelope />
              <h4 className="text-zinc-400 text-[20px] font-bold mt-3">E-mail de Feedback {feedback.sentAt ? 'Enviado' : 'Agendado'}</h4>
              <p className="text-zinc-400 text-[16px] leading-6 max-w-[680px] mt-1">
                {feedback.sentAt
                  ? `O e-mail de feedback foi enviado em ${new Date(feedback.sentAt).toLocaleString('pt-BR')}. Confira depois as respostas!`
                  : `O e-mail de feedback está agendado para ${feedback.scheduledAt ? new Date(feedback.scheduledAt).toLocaleString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : 'depois do evento'}. Confira depois!`}
              </p>
            </div>
          ) : (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
              <FeedbackEnvelope />
              <h4 className="text-zinc-400 text-[20px] font-bold mt-3">Nenhum e-mail pós-evento agendado</h4>
              <p className="text-zinc-400 text-[16px] leading-6 max-w-[560px] mt-1">Para coletar feedback, agende um e-mail de agradecimento pós-evento. Nós cuidaremos do resto!</p>
              <button type="button" onClick={onScheduleFeedback} className="mt-4 h-[36px] px-3 rounded-[8px] border border-white/10 bg-white/10 text-zinc-200 text-sm font-semibold cursor-pointer hover:bg-white/15">Agendar E-mail de Feedback</button>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function MetricList({ title, rows, empty, className = '' }: { title: string; rows: Array<{ label: string; percentage: number }>; empty: string; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-[16px] font-bold text-white">{title}</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2">
          {rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 text-[14px]"><span className="text-zinc-300 truncate">{row.label}</span><span className="text-white font-bold">{row.percentage}%</span></div>)}
        </div>
      ) : <p className="text-zinc-400 text-[14px] leading-5 mt-3">{empty}</p>}
    </div>
  );
}
