import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Building2, Check, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import fauvesLogo from '@/assets/logo-square-fauves.svg';

type Props = { calendarId?: string; calendarName?: string; onOpenFauvesPlus: () => void };
type PaymentStatus = {
  provider: 'efibank'; status: string; step: string; ready: boolean;
  account: { numberMasked: string; digit?: string | null } | null;
  validatedAt?: string | null; platformFeePercent?: number | null;
};
type OnboardingForm = {
  accountType: 'PF' | 'PJ'; cpf: string; cnpj: string; fullName: string;
  birthDate: string; motherName: string; companyName: string; phone: string;
  email: string; zipCode: string; state: string; city: string;
  neighborhood: string; street: string; number: string; complement: string;
};
const emptyForm: OnboardingForm = {
  accountType: 'PF', cpf: '', cnpj: '', fullName: '', birthDate: '', motherName: '',
  companyName: '', phone: '', email: '', zipCode: '', state: '', city: '',
  neighborhood: '', street: '', number: '', complement: '',
};

function EfiMark({ muted = false }: { muted?: boolean }) {
  return <span className={`grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full text-[21px] font-black lowercase tracking-[-0.08em] ${muted ? 'bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-[#5d2de1] text-white'}`}>efí</span>;
}

function ConnectionMarks() {
  return <div className="flex items-center" aria-label="Fauves conectada à Efí Bank">
    <span className="relative z-20 grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-full bg-[#2828db] ring-4 ring-white dark:ring-[#202123]"><img src={fauvesLogo} alt="Fauves" className="h-full w-full object-cover" /></span>
    <span className="relative z-10 -ml-2 grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-zinc-100 text-xl font-bold text-zinc-500 ring-1 ring-zinc-200 dark:border-[#202123] dark:bg-zinc-800 dark:ring-zinc-700">+</span>
    <span className="-ml-2"><EfiMark muted /></span>
  </div>;
}

function OnboardingModal({ open, busy, error, onClose, onSubmit }: {
  open: boolean; busy: boolean; error: string; onClose: () => void;
  onSubmit: (form: OnboardingForm) => void;
}) {
  const { isDark } = useTheme();
  const [form, setForm] = React.useState<OnboardingForm>(emptyForm);
  React.useEffect(() => { if (!open) setForm(emptyForm); }, [open]);
  if (!open) return null;
  const surface = isDark ? 'border-white/10 bg-[#202123] text-white' : 'border-zinc-200 bg-white text-zinc-950';
  const input = isDark ? 'border-white/10 bg-[#151617] text-white placeholder:text-zinc-600 focus:border-white/40' : 'border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-700';
  const label = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const set = (key: keyof OnboardingForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const required = ['cpf', 'fullName', 'birthDate', 'motherName', 'phone', 'email', 'zipCode', 'state', 'city', 'neighborhood', 'street', 'number'] as const;
  const complete = required.every((key) => form[key].trim()) && (form.accountType === 'PF' || Boolean(form.cnpj.trim() && form.companyName.trim()));
  const Field = ({ name, text, type = 'text', placeholder, span = false, maxLength }: { name: keyof OnboardingForm; text: string; type?: string; placeholder?: string; span?: boolean; maxLength?: number }) => <label className={`${span ? 'sm:col-span-2' : ''} block`}>
    <span className={`mb-1.5 block text-sm font-semibold ${label}`}>{text}</span>
    <input type={type} value={form[name]} maxLength={maxLength} placeholder={placeholder} onChange={(event) => set(name, event.target.value)} className={`h-11 w-full rounded-xl border px-3 text-[15px] outline-none transition-colors ${input}`} />
  </label>;

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onMouseDown={() => !busy && onClose()}>
    <motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (complete && !busy) onSubmit(form); }} className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[22px] border p-5 shadow-2xl sm:p-7 ${surface}`}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="mb-4 flex items-center gap-3"><EfiMark /><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">Ambiente seguro</span></div><h2 className="text-2xl font-bold tracking-[-0.03em]">Ativar venda de ingressos</h2><p className={`mt-1 max-w-xl text-sm leading-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Enviaremos estes dados à Efí para abrir ou vincular sua conta. A Efí enviará um link por WhatsApp ou SMS para você autorizar a integração.</p></div>
        <button type="button" onClick={onClose} disabled={busy} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-zinc-100 hover:bg-zinc-200'}`} aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className={`my-6 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-black/20">{(['PF', 'PJ'] as const).map((kind) => <button key={kind} type="button" onClick={() => set('accountType', kind)} className={`h-10 rounded-lg text-sm font-bold ${form.accountType === kind ? 'bg-white text-zinc-950 shadow-sm' : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>{kind === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'}</button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="fullName" text="Nome completo" span /><Field name="cpf" text="CPF" placeholder="Somente números" maxLength={14} /><Field name="birthDate" text="Data de nascimento" type="date" /><Field name="motherName" text="Nome completo da mãe" span />
        {form.accountType === 'PJ' && <><Field name="cnpj" text="CNPJ" placeholder="Somente números" maxLength={18} /><Field name="companyName" text="Razão social" /></>}
        <Field name="phone" text="Celular com DDD" placeholder="(85) 99999-9999" /><Field name="email" text="E-mail" type="email" />
      </div>
      <h3 className="mb-4 mt-7 text-base font-bold">Endereço</h3>
      <div className="grid gap-4 sm:grid-cols-2"><Field name="zipCode" text="CEP" maxLength={9} /><Field name="state" text="UF" placeholder="CE" maxLength={2} /><Field name="city" text="Cidade" /><Field name="neighborhood" text="Bairro" /><Field name="street" text="Logradouro" span /><Field name="number" text="Número" /><Field name="complement" text="Complemento (opcional)" /></div>
      {error && <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{error}</div>}
      <div className={`mt-6 rounded-xl px-4 py-3 text-xs leading-5 ${isDark ? 'bg-white/[0.055] text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>Ao continuar, você autoriza o envio dos dados à Efí Bank para análise cadastral e criação da conta necessária ao split de pagamentos.</div>
      <button type="submit" disabled={!complete || busy} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2727d8] text-base font-bold text-white hover:bg-[#2020bd] disabled:cursor-not-allowed disabled:opacity-40">{busy && <Loader2 size={18} className="animate-spin" />}{busy ? 'Enviando para a Efí...' : 'Enviar e receber link de autorização'}</button>
    </motion.form>
  </motion.div>;
}

export function CalendarPaymentsPanel({ calendarId, calendarName = 'Fauves', onOpenFauvesPlus }: Props) {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<PaymentStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [working, setWorking] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const loadStatus = React.useCallback(async () => {
    if (!calendarId) { setLoading(false); return; }
    setLoading(true); setLoadError('');
    try {
      const response = await fetchApi(`/api/organization/${calendarId}/payments/status`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Não foi possível consultar a conta de pagamentos.');
      setStatus(data);
    } catch (error: any) { setLoadError(error?.message || 'Não foi possível consultar a conta de pagamentos.'); }
    finally { setLoading(false); }
  }, [calendarId]);
  React.useEffect(() => { void loadStatus(); }, [loadStatus]);

  const submitOnboarding = async (form: OnboardingForm) => {
    if (!calendarId) return;
    setWorking(true); setFormError('');
    try {
      const response = await fetchApi(`/api/organization/${calendarId}/onboarding`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        accountType: form.accountType, cpf: form.cpf, cnpj: form.cnpj, fullName: form.fullName,
        birthDate: form.birthDate, motherName: form.motherName, companyName: form.companyName,
        phone: form.phone, email: form.email, address: { zipCode: form.zipCode, state: form.state,
          city: form.city, neighborhood: form.neighborhood, street: form.street, number: form.number, complement: form.complement },
      }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Não foi possível iniciar o cadastro na Efí.');
      setShowOnboarding(false);
      toast({ title: 'Cadastro enviado à Efí', description: 'Confira o WhatsApp ou SMS informado e autorize a integração.' });
      await loadStatus();
    } catch (error: any) { setFormError(error?.message || 'Não foi possível iniciar o cadastro na Efí.'); }
    finally { setWorking(false); }
  };
  const refresh = async () => {
    if (!calendarId) return;
    setWorking(true);
    try {
      const response = await fetchApi(`/api/organization/${calendarId}/onboarding/refresh`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Não foi possível atualizar o status.');
      setStatus(data); toast({ title: data.ready ? 'Pagamentos ativados' : 'Análise ainda em andamento' });
    } catch (error: any) { toast({ title: 'Falha ao atualizar', description: error?.message, variant: 'destructive' }); }
    finally { setWorking(false); }
  };

  const card = isDark ? 'border-white/10 bg-white/[0.055]' : 'border-zinc-200 bg-white';
  const title = isDark ? 'text-white' : 'text-zinc-950';
  const body = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const mutedSurface = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-zinc-200 bg-zinc-50';
  if (loading) return <div className={`grid min-h-[260px] place-items-center ${body}`}><Loader2 className="animate-spin" /></div>;
  if (loadError) return <div className={`rounded-2xl border p-6 ${card}`}><p className={`font-semibold ${title}`}>{loadError}</p><button type="button" onClick={() => void loadStatus()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2727d8] px-4 font-bold text-white"><RefreshCw size={16} />Tentar novamente</button></div>;
  const state = String(status?.status || 'NONE').toUpperCase();
  const pending = ['SUBMITTING', 'PENDING_AUTHORIZATION', 'PROCESSING'].includes(state);
  const failed = ['ERROR', 'REJECTED'].includes(state);

  if (!status?.ready) return <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-left">
    <h2 className={`mb-8 text-[30px] font-bold tracking-[-0.035em] ${title}`}>Venda de Ingressos</h2>
    <section className={`rounded-[24px] border p-6 shadow-sm sm:p-10 ${card}`}>
      <ConnectionMarks />
      <div className="mt-8 max-w-4xl"><h3 className={`text-[28px] font-bold tracking-[-0.035em] sm:text-[32px] ${title}`}>{pending ? 'Conclua a autorização na Efí' : failed ? 'Precisamos tentar novamente' : 'Comece a vender ingressos'}</h3>
        <p className={`mt-3 text-base font-medium leading-7 sm:text-lg ${body}`}>{pending ? 'Seu cadastro foi enviado. Abra o link recebido por WhatsApp ou SMS, autorize a integração e depois atualize o status aqui.' : failed ? 'A configuração anterior não foi concluída. Revise os dados e envie uma nova solicitação para liberar ingressos pagos.' : 'Configure a conta Efí deste calendário para receber pagamentos com split automático. O processo normalmente leva poucos minutos.'}</p>
        <div className="mt-6">{pending ? <button type="button" onClick={() => void refresh()} disabled={working} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2727d8] px-6 text-base font-bold text-white disabled:opacity-50">{working ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}Verificar novamente</button> : <button type="button" onClick={() => { setFormError(''); setShowOnboarding(true); }} className="h-12 rounded-xl bg-[#2727d8] px-7 text-base font-bold text-white hover:bg-[#2020bd]">{failed ? 'Tentar novamente' : 'Começar'}</button>}</div>
      </div>
    </section>
    <p className={`mt-6 text-base font-medium ${body}`}><strong>Efí Bank</strong> processa os pagamentos e repassa automaticamente a parte do organizador para a conta configurada.</p>
    <div className={`mt-8 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-300'}`} />
    <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${mutedSurface}`}><ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={21} /><p className={`text-sm leading-6 ${body}`}>Eventos continuam podendo ser criados normalmente. Apenas a criação de <strong className={title}>ingressos pagos</strong> fica bloqueada até esta configuração ser concluída.</p></div>
    <AnimatePresence><OnboardingModal open={showOnboarding} busy={working} error={formError} onClose={() => setShowOnboarding(false)} onSubmit={(form) => void submitOnboarding(form)} /></AnimatePresence>
  </motion.div>;

  const fee = Number(status.platformFeePercent ?? 15);
  return <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-left">
    <h2 className={`mb-6 text-[30px] font-bold tracking-[-0.035em] ${title}`}>Venda de Ingressos</h2>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`flex min-h-[250px] flex-col rounded-2xl border ${card}`}><div className={`flex items-center gap-4 border-b px-5 py-5 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}><EfiMark /><div><h3 className={`text-xl font-bold ${title}`}>Conta Efí Bank</h3><span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ativa</span></div></div><div className="flex flex-1 flex-col justify-between gap-6 p-5"><div><p className={`font-semibold ${body}`}>Conta conectada: <strong className={title}>{calendarName}</strong></p><p className={`mt-2 text-sm ${body}`}>Split habilitado para Pix e cartão{status.account ? ` · conta ${status.account.numberMasked}${status.account.digit ? `-${status.account.digit}` : ''}` : ''}.</p></div><a href="https://sejaefi.com.br/login" target="_blank" rel="noreferrer" className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold ${isDark ? 'bg-white/10 text-zinc-200 hover:bg-white/15' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>Abrir Efí <ArrowUpRight size={15} /></a></div></section>
      <section className={`flex min-h-[250px] flex-col justify-between rounded-2xl border p-5 ${card}`}><div className="grid grid-cols-2 gap-6">{[['Todo o tempo', 'R$ 0'], ['Mês passado', 'R$ 0'], ['Ingressos vendidos', '0'], ['Taxa da plataforma', `${fee.toLocaleString('pt-BR')}%`]].map(([label, value]) => <div key={label}><span className={`text-sm font-semibold ${body}`}>{label}</span><strong className={`mt-1 block text-2xl ${title}`}>{value}</strong></div>)}</div>{fee > 0 && <div><p className={`mb-2 text-center text-sm font-semibold ${body}`}>Isente a taxa da plataforma com o Fauves Plus.</p><button type="button" onClick={onOpenFauvesPlus} className="h-11 w-full rounded-xl bg-pink-600 text-base font-bold text-white hover:bg-pink-500">Faça upgrade para o Fauves Plus</button></div>}</section>
    </div>
    <div className={`my-8 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
    <section><h3 className={`text-xl font-bold ${title}`}>Métodos de pagamento</h3><p className={`mt-1 ${body}`}>O split é aplicado pela API Efí antes da cobrança ser apresentada ao comprador.</p><div className={`mt-5 overflow-hidden rounded-2xl border ${card}`}>{[
      { icon: <WalletCards size={20} />, name: 'Pix', text: 'Cobrança vinculada à configuração de split Efí.' },
      { icon: <CreditCard size={20} />, name: 'Cartão de crédito', text: 'Repasse feito pelo payee_code da conta conectada.' },
    ].map((method, index) => <div key={method.name} className={`flex items-center justify-between gap-4 px-5 py-4 ${index === 0 ? (isDark ? 'border-b border-white/10' : 'border-b border-zinc-200') : ''}`}><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>{method.icon}</span><div><strong className={title}>{method.name}</strong><p className={`mt-0.5 text-sm ${body}`}>{method.text}</p></div></div><span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-500"><Check size={14} className="mr-1 inline" />Ativado</span></div>)}</div></section>
    <div className={`my-8 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
    <section className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${mutedSurface}`}><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" /><div><h3 className={`font-bold ${title}`}>Ingressos pagos liberados</h3><p className={`mt-1 text-sm leading-6 ${body}`}>Todos os eventos criados dentro deste calendário podem vender ingressos e receber o repasse nesta conta.</p></div></div><span className={`inline-flex shrink-0 items-center gap-2 text-sm font-semibold ${body}`}><Building2 size={16} />Configuração do calendário</span></section>
  </motion.div>;
}
