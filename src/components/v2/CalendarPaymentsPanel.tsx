import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Building2, Check, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { fetchCep, maskCep } from '@/lib/cep';
import { fetchCnpj } from '@/lib/cnpj';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import fauvesLogo from '@/assets/logo-square-fauves.svg';
import efiLogo from '@/assets/logo-efi-bank.svg';

type Props = { calendarId?: string; calendarName?: string; onOpenFauvesPlus: () => void };
type PaymentStatus = {
  provider: 'efibank'; status: string; step: string; ready: boolean;
  account: { numberMasked: string; digit?: string | null } | null;
  validatedAt?: string | null; platformFeePercent?: number | null;
};

function getApiErrorMessage(data: any, fallback: string) {
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (Array.isArray(data?.message) && data.message.length) return data.message.join(' ');
  if (typeof data?.hint === 'string' && data.hint.trim()) return data.hint;
  if (typeof data?.error_description === 'string' && data.error_description.trim()) return data.error_description;
  return fallback;
}
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

const onlyDigits = (value: string, limit: number) => value.replace(/\D/g, '').slice(0, limit);
const maskCpf = (value: string) => {
  const digits = onlyDigits(value, 11);
  return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
};
const maskCnpj = (value: string) => {
  const digits = onlyDigits(value, 14);
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
};
const maskPhone = (value: string) => {
  const digits = onlyDigits(value, 11);
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

function EfiMark({ muted = false }: { muted?: boolean }) {
  return <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f37124] ${muted ? 'opacity-80' : ''}`}><img src={efiLogo} alt="Efí Bank" className="h-auto w-7 brightness-0 invert" /></span>;
}

function ConnectionMarks() {
  return <div className="flex items-center" aria-label="Fauves conectada à Efí Bank">
    <span className="relative z-20 grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#2828db] ring-2 ring-white dark:ring-[#202123]"><img src={fauvesLogo} alt="Fauves" className="h-full w-full object-cover" /></span>
    <span className="relative z-10 -ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-zinc-100 text-sm font-bold text-zinc-500 ring-1 ring-zinc-200 dark:border-[#202123] dark:bg-zinc-800 dark:ring-zinc-700">+</span>
    <span className="-ml-1.5"><EfiMark /></span>
  </div>;
}

function OnboardingField({ form, setValue, inputClass, labelClass, isDark, name, text, type = 'text', placeholder, span = false, maxLength, inputMode, format, help }: {
  form: OnboardingForm;
  setValue: (key: keyof OnboardingForm, value: string) => void;
  inputClass: string;
  labelClass: string;
  isDark: boolean;
  name: keyof OnboardingForm;
  text: string;
  type?: string;
  placeholder?: string;
  span?: boolean;
  maxLength?: number;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  format?: (value: string) => string;
  help?: React.ReactNode;
}) {
  return <label className={`${span ? 'sm:col-span-2' : ''} block`}>
    <span className={`mb-1.5 block text-sm font-semibold ${labelClass}`}>{text}</span>
    <input type={type} inputMode={inputMode} value={form[name]} maxLength={maxLength} placeholder={placeholder} onChange={(event) => setValue(name, format ? format(event.target.value) : event.target.value)} className={`h-11 w-full rounded-xl border px-3 text-[15px] outline-none transition-colors ${inputClass}`} />
    {help && <span className={`mt-1.5 flex min-h-4 items-center gap-1.5 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{help}</span>}
  </label>;
}

function OnboardingModal({ open, busy, error, onClose, onSubmit }: {
  open: boolean; busy: boolean; error: string; onClose: () => void;
  onSubmit: (form: OnboardingForm) => void;
}) {
  const { isDark } = useTheme();
  const [form, setForm] = React.useState<OnboardingForm>(emptyForm);
  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [cepLookup, setCepLookup] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cnpjLookup, setCnpjLookup] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setStep(0);
      setDirection(1);
      setCepLookup('idle');
      setCnpjLookup('idle');
      return;
    }
    let active = true;
    setStep(0);
    setLoadingProfile(true);
    void fetchApi('/account-settings')
      .then((response) => response.ok ? response.json() : null)
      .then((profile) => {
        if (!active || !profile) return;
        const name = String(profile.name || '').trim();
        const surname = String(profile.surname || '').trim();
        const fullName = surname && !name.toLowerCase().endsWith(surname.toLowerCase())
          ? `${name} ${surname}`.trim()
          : name;
        setForm((current) => ({
          ...current,
          cpf: maskCpf(String(profile.cpf || '')),
          fullName,
          birthDate: profile.birth ? String(profile.birth).slice(0, 10) : '',
          phone: maskPhone(String(profile.phone || '')),
          email: String(profile.email || ''),
          zipCode: maskCep(String(profile.cep || '')),
          state: String(profile.state || ''),
          city: String(profile.city || ''),
          street: String(profile.address || ''),
          complement: String(profile.complement || ''),
        }));
      })
      .catch(() => {})
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, [open]);

  React.useEffect(() => {
    if (!open || onlyDigits(form.zipCode, 8).length !== 8) {
      setCepLookup('idle');
      return;
    }
    let active = true;
    const timeout = window.setTimeout(() => {
      setCepLookup('loading');
      void fetchCep(form.zipCode)
        .then((result) => {
          if (!active) return;
          setForm((current) => ({
            ...current,
            zipCode: maskCep(result.cep),
            state: result.state,
            city: result.city,
            neighborhood: result.neighborhood,
            street: result.address,
            complement: current.complement || result.complement,
          }));
          setCepLookup('success');
        })
        .catch(() => { if (active) setCepLookup('error'); });
    }, 350);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [form.zipCode, open]);

  React.useEffect(() => {
    if (!open || form.accountType !== 'PJ' || onlyDigits(form.cnpj, 14).length !== 14) {
      setCnpjLookup('idle');
      return;
    }
    let active = true;
    const timeout = window.setTimeout(() => {
      setCnpjLookup('loading');
      void fetchCnpj(form.cnpj)
        .then((result) => {
          if (!active) return;
          setForm((current) => ({
            ...current,
            companyName: result.companyName || current.companyName,
            zipCode: result.zipCode ? maskCep(result.zipCode) : current.zipCode,
            state: result.state || current.state,
            city: result.city || current.city,
            neighborhood: result.neighborhood || current.neighborhood,
            street: result.street || current.street,
            number: result.number || current.number,
            complement: result.complement || current.complement,
          }));
          setCnpjLookup('success');
        })
        .catch(() => { if (active) setCnpjLookup('error'); });
    }, 450);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [form.accountType, form.cnpj, open]);

  if (!open) return null;
  const surface = isDark ? 'border-white/10 bg-[#202123] text-white' : 'border-zinc-200 bg-white text-zinc-950';
  const input = isDark ? 'border-white/10 bg-[#151617] text-white placeholder:text-zinc-600 focus:border-white/40' : 'border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-700';
  const label = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const set = (key: keyof OnboardingForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const stepComplete = [
    onlyDigits(form.cpf, 11).length === 11 && (form.accountType === 'PF' || (onlyDigits(form.cnpj, 14).length === 14 && Boolean(form.companyName.trim()))),
    Boolean(form.fullName.trim() && form.birthDate.trim() && form.motherName.trim() && onlyDigits(form.phone, 11).length >= 10 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())),
    onlyDigits(form.zipCode, 8).length === 8 && Boolean(form.state.trim() && form.city.trim() && form.neighborhood.trim() && form.street.trim() && form.number.trim()),
  ];
  const complete = stepComplete.every(Boolean);
  const stepTitles = ['Tipo de conta', 'Dados do titular', 'Endereço'];
  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };
  const fieldProps = { form, setValue: set, inputClass: input, labelClass: label, isDark };

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onMouseDown={() => !busy && onClose()}>
    <motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (step < 2 && stepComplete[step]) goToStep(step + 1); else if (complete && !busy) onSubmit(form); }} className={`max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6 ${surface}`}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="mb-3 flex items-center gap-2.5"><EfiMark /><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-500">Ambiente seguro</span></div><h2 className="text-xl font-bold tracking-[-0.02em]">Ativar venda de ingressos</h2><p className={`mt-1 max-w-xl text-sm leading-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Enviaremos estes dados à Efí para abrir ou vincular sua conta. A Efí enviará um link por WhatsApp ou SMS para você autorizar a integração.</p></div>
        <button type="button" onClick={onClose} disabled={busy} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-zinc-100 hover:bg-zinc-200'}`} aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className="mb-5 mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold"><span className={label}>Etapa {step + 1} de 3</span><span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>{stepTitles[step]}</span></div>
        <div className="grid grid-cols-3 gap-1.5">{stepTitles.map((item, index) => <span key={item} className={`h-1 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}><motion.span initial={false} animate={{ scaleX: index <= step ? 1 : 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="block h-full origin-left rounded-full bg-[#f37124]" /></span>)}</div>
      </div>

      {loadingProfile ? <div className={`flex min-h-[220px] items-center justify-center gap-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}><Loader2 size={16} className="animate-spin" />Carregando seus dados…</div> : <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={step} custom={direction} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -18 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            {step === 0 && <div>
              <h3 className="text-base font-bold">Como você vai receber?</h3>
              <p className={`mt-1 text-sm leading-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Escolha o tipo de conta e confirme o documento do titular.</p>
              <div className="mb-5 mt-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-black/20">{(['PF', 'PJ'] as const).map((kind) => <button key={kind} type="button" onClick={() => set('accountType', kind)} className={`h-10 rounded-lg text-sm font-bold transition-all duration-200 ${form.accountType === kind ? 'bg-white text-zinc-950 shadow-sm' : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')}`}>{kind === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'}</button>)}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <OnboardingField {...fieldProps} name="cpf" text="CPF do titular" placeholder="000.000.000-00" maxLength={14} inputMode="numeric" format={maskCpf} span={form.accountType === 'PF'} />
                {form.accountType === 'PJ' && <>
                  <OnboardingField {...fieldProps} name="cnpj" text="CNPJ" placeholder="00.000.000/0000-00" maxLength={18} inputMode="numeric" format={maskCnpj} help={cnpjLookup === 'loading' ? <><Loader2 size={12} className="animate-spin" />Buscando empresa…</> : cnpjLookup === 'success' ? <><Check size={12} className="text-emerald-500" />Dados da empresa preenchidos</> : cnpjLookup === 'error' ? <span className="text-amber-500">Não foi possível preencher automaticamente</span> : 'Preenche razão social e endereço'} />
                  <OnboardingField {...fieldProps} name="companyName" text="Razão social" span />
                </>}
              </div>
            </div>}

            {step === 1 && <div>
              <h3 className="text-base font-bold">Dados do titular</h3>
              <p className={`mt-1 text-sm leading-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Alguns campos já vêm preenchidos com os dados do seu perfil.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><OnboardingField {...fieldProps} name="fullName" text="Nome completo" span /><OnboardingField {...fieldProps} name="birthDate" text="Data de nascimento" type="date" /><OnboardingField {...fieldProps} name="phone" text="Celular com DDD" placeholder="(85) 99999-9999" maxLength={15} inputMode="tel" format={maskPhone} /><OnboardingField {...fieldProps} name="motherName" text="Nome completo da mãe" span /><OnboardingField {...fieldProps} name="email" text="E-mail" type="email" inputMode="email" span /></div>
            </div>}

            {step === 2 && <div>
              <h3 className="text-base font-bold">Endereço</h3>
              <p className={`mt-1 text-sm leading-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Digite o CEP e complete apenas o que faltar.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><OnboardingField {...fieldProps} name="zipCode" text="CEP" placeholder="00000-000" maxLength={9} inputMode="numeric" format={maskCep} help={cepLookup === 'loading' ? <><Loader2 size={12} className="animate-spin" />Buscando endereço…</> : cepLookup === 'success' ? <><Check size={12} className="text-emerald-500" />Endereço preenchido</> : cepLookup === 'error' ? <span className="text-amber-500">CEP não encontrado; preencha manualmente</span> : 'Preenche o endereço automaticamente'} /><OnboardingField {...fieldProps} name="state" text="UF" placeholder="CE" maxLength={2} format={(value) => value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()} /><OnboardingField {...fieldProps} name="city" text="Cidade" /><OnboardingField {...fieldProps} name="neighborhood" text="Bairro" /><OnboardingField {...fieldProps} name="street" text="Logradouro" span /><OnboardingField {...fieldProps} name="number" text="Número" /><OnboardingField {...fieldProps} name="complement" text="Complemento (opcional)" /></div>
            </div>}
          </motion.div>
        </AnimatePresence>
      </div>}

      {error && <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{error}</div>}
      {step === 2 && <div className={`mt-5 rounded-xl px-3 py-2.5 text-xs leading-5 ${isDark ? 'bg-white/[0.055] text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>Ao continuar, você autoriza o envio dos dados à Efí Bank para análise cadastral e criação da conta necessária ao split de pagamentos.</div>}
      <div className="mt-5 flex items-center gap-2">
        {step > 0 && <button type="button" disabled={busy} onClick={() => goToStep(step - 1)} className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors ${isDark ? 'bg-white/10 text-zinc-300 hover:bg-white/15' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>Voltar</button>}
        <button type="submit" disabled={loadingProfile || !stepComplete[step] || busy} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2727d8] px-4 text-sm font-bold text-white hover:bg-[#2020bd] disabled:cursor-not-allowed disabled:opacity-40">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Enviando para a Efí...' : step < 2 ? 'Continuar' : 'Enviar e receber autorização'}</button>
      </div>
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
      const response = await fetchApi(`/api/organization/${calendarId}/onboarding`, { method: 'POST', timeoutMs: 45_000, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        accountType: form.accountType, cpf: form.cpf, cnpj: form.cnpj, fullName: form.fullName,
        birthDate: form.birthDate, motherName: form.motherName, companyName: form.companyName,
        phone: form.phone, email: form.email, address: { zipCode: form.zipCode, state: form.state,
          city: form.city, neighborhood: form.neighborhood, street: form.street, number: form.number, complement: form.complement },
      }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Não foi possível iniciar o cadastro na Efí. Tente novamente em instantes.'));
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
  if (loading) return <div className={`grid min-h-[180px] place-items-center ${body}`}><Loader2 size={20} className="animate-spin" /></div>;
  if (loadError) return <div className={`rounded-xl border p-4 ${card}`}><p className={`text-sm font-semibold ${title}`}>{loadError}</p><button type="button" onClick={() => void loadStatus()} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#2727d8] px-3 text-sm font-bold text-white"><RefreshCw size={14} />Tentar novamente</button></div>;
  const state = String(status?.status || 'NONE').toUpperCase();
  const pending = ['SUBMITTING', 'PENDING_AUTHORIZATION', 'PROCESSING'].includes(state);
  const failed = ['ERROR', 'REJECTED'].includes(state);

  if (!status?.ready) return <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-left">
    <h2 className={`mb-4 text-lg font-bold tracking-[-0.02em] ${title}`}>Venda de Ingressos</h2>
    <section className={`rounded-xl border p-4 shadow-sm sm:p-5 ${card}`}>
      <ConnectionMarks />
      <div className="mt-5 max-w-2xl"><h3 className={`text-lg font-bold tracking-[-0.02em] ${title}`}>{pending ? 'Conclua a autorização na Efí' : failed ? 'Precisamos tentar novamente' : 'Comece a vender ingressos'}</h3>
        <p className={`mt-1.5 text-sm font-medium leading-5 ${body}`}>{pending ? 'Seu cadastro foi enviado. Abra o link recebido por WhatsApp ou SMS, autorize a integração e depois atualize o status aqui.' : failed ? 'A configuração anterior não foi concluída. Revise os dados e envie uma nova solicitação para liberar ingressos pagos.' : 'Configure a conta Efí deste calendário para receber pagamentos com split automático. O processo normalmente leva poucos minutos.'}</p>
        <div className="mt-4">{pending ? <button type="button" onClick={() => void refresh()} disabled={working} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2727d8] px-4 text-sm font-bold text-white disabled:opacity-50">{working ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Verificar novamente</button> : <button type="button" onClick={() => { setFormError(''); setShowOnboarding(true); }} className="h-9 rounded-lg bg-[#2727d8] px-4 text-sm font-bold text-white hover:bg-[#2020bd]">{failed ? 'Tentar novamente' : 'Começar'}</button>}</div>
      </div>
    </section>
    <p className={`mt-4 text-xs font-medium leading-5 ${body}`}><strong>Efí Bank</strong> processa os pagamentos e repassa automaticamente a parte do organizador para a conta configurada.</p>
    <div className={`mt-5 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-300'}`} />
    <div className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 ${mutedSurface}`}><ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={17} /><p className={`text-xs leading-5 ${body}`}>Eventos continuam podendo ser criados normalmente. Apenas a criação de <strong className={title}>ingressos pagos</strong> fica bloqueada até esta configuração ser concluída.</p></div>
    <AnimatePresence><OnboardingModal open={showOnboarding} busy={working} error={formError} onClose={() => setShowOnboarding(false)} onSubmit={(form) => void submitOnboarding(form)} /></AnimatePresence>
  </motion.div>;

  const fee = Number(status.platformFeePercent ?? 15);
  return <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-left">
    <h2 className={`mb-4 text-lg font-bold tracking-[-0.02em] ${title}`}>Venda de Ingressos</h2>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`flex min-h-[190px] flex-col rounded-xl border ${card}`}><div className={`flex items-center gap-3 border-b px-4 py-4 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}><EfiMark /><div><h3 className={`text-sm font-bold ${title}`}>Conta Efí Bank</h3><span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ativa</span></div></div><div className="flex flex-1 flex-col justify-between gap-4 p-4"><div><p className={`text-xs font-semibold ${body}`}>Conta conectada: <strong className={title}>{calendarName}</strong></p><p className={`mt-1 text-xs leading-5 ${body}`}>Split habilitado para Pix e cartão{status.account ? ` · conta ${status.account.numberMasked}${status.account.digit ? `-${status.account.digit}` : ''}` : ''}.</p></div><a href="https://sejaefi.com.br/login" target="_blank" rel="noreferrer" className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-white/10 text-zinc-200 hover:bg-white/15' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>Abrir Efí <ArrowUpRight size={13} /></a></div></section>
      <section className={`flex min-h-[190px] flex-col justify-between rounded-xl border p-4 ${card}`}><div className="grid grid-cols-2 gap-4">{[['Todo o tempo', 'R$ 0'], ['Mês passado', 'R$ 0'], ['Ingressos vendidos', '0'], ['Taxa da plataforma', `${fee.toLocaleString('pt-BR')}%`]].map(([label, value]) => <div key={label}><span className={`text-[10px] font-bold uppercase tracking-wider ${body}`}>{label}</span><strong className={`mt-1 block text-lg ${title}`}>{value}</strong></div>)}</div>{fee > 0 && <div className="mt-4"><p className={`mb-2 text-center text-[10px] ${body}`}>Isente a taxa da plataforma com o Fauves Plus.</p><button type="button" onClick={onOpenFauvesPlus} className="h-9 w-full rounded-lg bg-pink-600 text-xs font-bold text-white hover:bg-pink-500">Faça upgrade para o Fauves Plus</button></div>}</section>
    </div>
    <div className={`my-6 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
    <section><h3 className={`text-base font-bold ${title}`}>Métodos de pagamento</h3><p className={`mt-1 text-xs leading-5 ${body}`}>O split é aplicado pela API Efí antes da cobrança ser apresentada ao comprador.</p><div className={`mt-3 overflow-hidden rounded-xl border ${card}`}>{[
      { icon: <WalletCards size={16} />, name: 'Pix', text: 'Cobrança vinculada à configuração de split Efí.' },
      { icon: <CreditCard size={16} />, name: 'Cartão de crédito', text: 'Repasse feito pelo payee_code da conta conectada.' },
    ].map((method, index) => <div key={method.name} className={`flex items-center justify-between gap-3 px-4 py-3 ${index === 0 ? (isDark ? 'border-b border-white/10' : 'border-b border-zinc-200') : ''}`}><div className="flex items-center gap-2.5"><span className={`grid h-8 w-8 place-items-center rounded-lg ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>{method.icon}</span><div><strong className={`text-xs ${title}`}>{method.name}</strong><p className={`mt-0.5 text-xs leading-5 ${body}`}>{method.text}</p></div></div><span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-500"><Check size={11} className="mr-1 inline" />Ativado</span></div>)}</div></section>
    <div className={`my-6 h-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
    <section className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${mutedSurface}`}><div className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={18} /><div><h3 className={`text-sm font-bold ${title}`}>Ingressos pagos liberados</h3><p className={`mt-1 text-xs leading-5 ${body}`}>Todos os eventos criados dentro deste calendário podem vender ingressos e receber o repasse nesta conta.</p></div></div><span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${body}`}><Building2 size={14} />Configuração do calendário</span></section>
  </motion.div>;
}
