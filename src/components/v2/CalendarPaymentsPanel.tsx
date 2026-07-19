import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Download,
  FileText,
  Landmark,
  MapPin,
  MoreHorizontal,
  PenLine,
  Plus,
  Ticket,
} from 'lucide-react';
import { CouponModalV2, type CouponDraft } from './CouponModalV2';

type Coupon = CouponDraft;
type Billing = { sellerName: string; address: string; memo: string };

type Props = {
  calendarId?: string;
  calendarName?: string;
  onOpenFauvesPlus: () => void;
};

const EmptyRow = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex min-h-[73px] items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.055] px-4 py-3 text-left">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/20 text-zinc-600">{icon}</span>
    <div><h4 className="text-base font-bold text-zinc-400">{title}</h4><p className="mt-0.5 text-sm font-semibold text-zinc-500">{description}</p></div>
  </div>
);

const BillingModal = ({ draft, onChange, onClose, onSave }: { draft: Billing; onChange: (draft: Billing) => void; onClose: () => void; onSave: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={onClose}
    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px]"
  >
    <motion.form
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ type: 'spring', stiffness: 340, damping: 29 }}
      onMouseDown={(event) => event.stopPropagation()}
      onSubmit={(event) => { event.preventDefault(); onSave(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
      className="w-full max-w-[342px] rounded-[20px] border border-white/[0.04] bg-[#1c1d1e] px-5 pb-[18px] pt-5 text-left text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-zinc-300">
        <ClipboardList size={28} strokeWidth={1.7} />
      </div>

      <h2 id="billing-modal-title" className="mb-0 mt-[14px] text-[21px] font-bold leading-[27px] tracking-[-0.025em]">Informações da Fatura</h2>
      <p className="mb-0 mt-1 text-[14px] font-medium leading-[21px] text-zinc-300">Personalize as informações exibidas nas<br className="hidden min-[350px]:block" /> faturas dos convidados.</p>

      <div className="mt-[17px]">
        <label htmlFor="billing-seller-name" className="mb-[7px] block text-[14px] font-semibold text-zinc-300">Nome do Vendedor</label>
        <input
          id="billing-seller-name"
          autoFocus
          value={draft.sellerName}
          onChange={(event) => onChange({ ...draft, sellerName: event.target.value })}
          className="h-[39px] w-full rounded-lg border border-white/10 bg-[#171819] px-3 text-[15px] text-white outline-none transition-colors focus:border-white/40"
        />
      </div>

      <div className="mt-[14px]">
        <label htmlFor="billing-address" className="mb-[7px] block text-[14px] font-semibold text-zinc-300">Endereço</label>
        <div className="relative">
          <MapPin aria-hidden="true" size={17} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="billing-address"
            value={draft.address}
            onChange={(event) => onChange({ ...draft, address: event.target.value })}
            placeholder="Qual é o endereço?"
            className="h-[39px] w-full rounded-lg border border-white/10 bg-[#171819] pl-9 pr-3 text-[15px] text-white outline-none transition-colors placeholder:font-semibold placeholder:text-zinc-600 focus:border-white/40"
          />
        </div>
      </div>

      <div className="mt-[14px]">
        <label htmlFor="billing-memo" className="mb-[7px] block text-[14px] font-semibold text-zinc-300">Memorando</label>
        <textarea
          id="billing-memo"
          value={draft.memo}
          onChange={(event) => onChange({ ...draft, memo: event.target.value })}
          className="h-[84px] w-full resize-none rounded-lg border border-white/10 bg-[#171819] p-3 text-[15px] leading-5 text-white outline-none transition-colors focus:border-white/40"
        />
      </div>

      <button type="submit" className="mt-[17px] flex h-[38px] w-full items-center justify-center rounded-lg border-0 bg-white text-[16px] font-medium text-[#171819] transition-colors hover:bg-zinc-100 active:bg-zinc-200">Salvar Alterações</button>
    </motion.form>
  </motion.div>
);

const RefundPolicyModal = ({ value, onChange, onClose, onSave }: { value: string; onChange: (value: string) => void; onClose: () => void; onSave: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={onClose}
    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px]"
  >
    <motion.form
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ type: 'spring', stiffness: 340, damping: 29 }}
      onMouseDown={(event) => event.stopPropagation()}
      onSubmit={(event) => { event.preventDefault(); onSave(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-policy-modal-title"
      className="w-full max-w-[482px] rounded-[20px] border border-white/[0.04] bg-[#1c1d1e] px-5 pb-4 pt-5 text-left text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-zinc-300">
        <ClipboardList size={28} strokeWidth={1.7} />
      </div>
      <h2 id="refund-policy-modal-title" className="mb-0 mt-[14px] text-[21px] font-bold leading-[27px] tracking-[-0.025em]">Política de Reembolso</h2>
      <p className="mb-0 mt-1 text-[14px] font-medium leading-[21px] text-zinc-300">Especifique sua política de reembolso abaixo.</p>
      <textarea
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Compartilhe informações sobre quando você oferecerá reembolso aos convidados."
        className="mt-[17px] h-[117px] w-full resize-none rounded-lg border border-white/10 bg-[#151617] p-[14px] text-[16px] font-medium leading-[23px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/40"
      />
      <button type="submit" className="mt-[17px] flex h-[39px] w-full items-center justify-center rounded-lg border-0 bg-white text-[16px] font-medium text-[#171819] transition-colors hover:bg-zinc-100 active:bg-zinc-200">Salvar Alterações</button>
    </motion.form>
  </motion.div>
);

export function CalendarPaymentsPanel({ calendarId, calendarName = 'Fauves', onOpenFauvesPlus }: Props) {
  const keyPrefix = `fauves-calendar-payments-${calendarId || 'default'}`;
  const [stripeMenuOpen, setStripeMenuOpen] = React.useState(false);
  const stripeMenuRef = React.useRef<HTMLDivElement>(null);
  const [salesMenuOpen, setSalesMenuOpen] = React.useState(false);
  const salesMenuRef = React.useRef<HTMLDivElement>(null);
  const [modal, setModal] = React.useState<'coupon' | 'billing' | 'refund' | null>(null);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [billing, setBilling] = React.useState<Billing>({ sellerName: calendarName, address: '', memo: '' });
  const [billingDraft, setBillingDraft] = React.useState<Billing>(billing);
  const [refundPolicy, setRefundPolicy] = React.useState('');
  const [refundDraft, setRefundDraft] = React.useState('');

  React.useEffect(() => {
    try {
      const savedCoupons = JSON.parse(localStorage.getItem(`${keyPrefix}-coupons`) || '[]') as Array<Coupon | { code: string; discount: number }>;
      setCoupons(savedCoupons.map((coupon) => 'discountType' in coupon ? coupon : {
        code: coupon.code,
        limitUses: false,
        discountType: 'percent',
        discountValue: coupon.discount,
      }));
      const savedBilling = JSON.parse(localStorage.getItem(`${keyPrefix}-billing`) || 'null');
      setBilling(savedBilling || { sellerName: calendarName, address: '', memo: '' });
      setRefundPolicy(localStorage.getItem(`${keyPrefix}-refund`) || '');
    } catch { /* storage unavailable */ }
  }, [calendarName, keyPrefix]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!stripeMenuRef.current?.contains(event.target as Node)) setStripeMenuOpen(false);
      if (!salesMenuRef.current?.contains(event.target as Node)) setSalesMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setStripeMenuOpen(false); setSalesMenuOpen(false); setModal(null); }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const secondaryButton = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border-0 bg-white/[0.10] px-3 text-sm font-bold text-zinc-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.15] hover:text-white active:scale-[0.97]';
  const divider = <div className="my-8 h-px bg-white/[0.10]" />;

  const downloadSales = () => {
    const blob = new Blob(['Data,Evento,Comprador,Valor\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historico-de-vendas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateFeeInvoice = () => {
    const escapedCalendarName = `"${calendarName.replace(/"/g, '""')}"`;
    const blob = new Blob([`Calendário,Período,Total de taxas\n${escapedCalendarName},Todo o período,"R$ 0,00"\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fatura-de-taxas.csv';
    link.click();
    URL.revokeObjectURL(url);
    setSalesMenuOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="text-left">
      <section>
        <h2 className="mb-5 text-[20px] font-bold tracking-[-0.02em] text-white">Venda de Ingressos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex min-h-[233px] flex-col overflow-visible rounded-xl border border-white/[0.10] bg-white/[0.055]">
            <div className="flex items-center gap-3 border-b border-white/[0.10] px-[18px] py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#635bff] text-xs font-black text-white">stripe</span>
              <div><h3 className="text-base font-bold text-white">Conta Stripe</h3><span className="inline-flex items-center gap-1 text-sm font-semibold text-green-400"><span className="h-2 w-2 rounded-full bg-green-400" />Ativo</span></div>
            </div>
            <div className="flex flex-1 flex-col justify-between px-[18px] py-3">
              <div><p className="text-sm font-semibold text-zinc-300">Conta conectada: <strong className="text-white">{calendarName}</strong></p><p className="mt-2 text-sm font-semibold text-zinc-300">Sua conta Stripe está ativa e aceitando pagamentos.</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.open('https://dashboard.stripe.com', '_blank', 'noopener,noreferrer')} className={`${secondaryButton} flex-1`}>Abrir Stripe <ArrowUpRight size={14} /></button>
                <div ref={stripeMenuRef} className="relative">
                  <button type="button" onClick={() => setStripeMenuOpen((open) => !open)} aria-label="Ações da conta Stripe" className={`${secondaryButton} w-10 px-0`}><MoreHorizontal size={17} /></button>
                  <AnimatePresence>{stripeMenuOpen && <motion.div initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="absolute bottom-11 right-0 z-30 w-44 origin-bottom-right rounded-xl border border-white/10 bg-[#242526] p-1.5 shadow-2xl"><button type="button" onClick={() => window.open('https://dashboard.stripe.com/settings', '_blank', 'noopener,noreferrer')} className="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/[0.08]">Configurar conta</button><button type="button" className="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10">Desconectar</button></motion.div>}</AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[233px] flex-col justify-between rounded-xl border border-white/[0.10] bg-white/[0.055] p-[18px]">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[['Todo o Tempo', 'R$ 0'], ['Mês Passado', 'R$ 0'], ['Ingressos Vendidos', '0'], ['Taxa da Plataforma', '0%']].map(([label, value]) => <div key={label}><span className="text-sm font-semibold text-zinc-500">{label}</span><strong className="mt-0.5 block text-[21px] text-white">{value}</strong></div>)}
            </div>
            <div><p className="mb-2 text-center text-sm font-semibold text-zinc-500">Isente a taxa da plataforma com o Fauves Plus.</p><button type="button" onClick={onOpenFauvesPlus} className="h-10 w-full rounded-lg border-0 bg-pink-600 text-base font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.99]">Faça upgrade para o Fauves Plus</button></div>
          </div>
        </div>
      </section>

      {divider}

      <section>
        <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-[20px] font-bold text-white">Cupons</h2><p className="mt-1 text-base font-medium text-zinc-300">Crie cupons que podem ser aplicados a qualquer evento gerenciado pelo seu calendário.</p></div><button type="button" onClick={() => setModal('coupon')} className={secondaryButton}><Plus size={15} /> Criar</button></div>
        {coupons.length ? <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.055]">{coupons.map((coupon) => <div key={coupon.code} className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0"><div><strong className="text-white">{coupon.code}</strong><p className="text-sm text-zinc-500">{coupon.discountType === 'free' ? 'Ingresso grátis' : coupon.discountType === 'percent' ? `${coupon.discountValue}% de desconto` : `R$ ${Number(coupon.discountValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de desconto`}{coupon.limitUses && coupon.maxUses ? ` · ${coupon.maxUses} usos` : ''}</p></div><span className="rounded-full bg-green-500/15 px-2 py-1 text-xs font-bold text-green-400">Ativo</span></div>)}</div> : <EmptyRow icon={<Ticket size={19} />} title="Sem Cupons" description="Você não configurou nenhum cupom." />}
      </section>

      {divider}

      <section>
        <h2 className="text-[20px] font-bold text-white">Métodos de Pagamento</h2><p className="mb-5 mt-1 text-base font-medium text-zinc-300">Escolha os métodos de pagamento aceitos para seus eventos e associações.</p>
        <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.055]">
          <div className="flex min-h-[66px] items-center justify-between gap-4 border-b border-white/10 px-4 py-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-base text-white">Cartões</strong><div className="flex gap-1"><span className="rounded bg-blue-700 px-1.5 py-0.5 text-[8px] font-black text-white">VISA</span><span className="rounded bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-yellow-100">MC</span><span className="rounded border border-white/10 bg-zinc-700 px-1.5 py-0.5 text-[8px] font-bold">▣</span><span className="rounded border border-white/10 bg-zinc-700 px-1 py-0.5 text-[8px] font-bold">Pay</span><span className="rounded border border-white/10 bg-zinc-700 px-1 py-0.5 text-[8px] font-bold">G Pay</span></div></div><p className="mt-1 text-sm font-semibold text-zinc-500">Os principais cartões de crédito e débito, Apple Pay e Google Pay são sempre aceitos.</p></div><span className="shrink-0 rounded-full bg-green-500/15 px-3 py-1 text-sm font-bold text-green-400"><Check size={14} className="mr-1 inline" />Ativado</span></div>
          <div className="flex min-h-[66px] items-center justify-between gap-4 border-b border-white/10 px-4 py-3"><div><div className="flex items-center gap-2"><strong className="text-base text-white">PIX</strong><span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-300">PIX</span></div><p className="mt-1 text-sm font-semibold text-zinc-500">Receba pagamentos instantâneos por PIX.</p></div><span className="shrink-0 rounded-full bg-green-500/15 px-3 py-1 text-sm font-bold text-green-400"><Check size={14} className="mr-1 inline" />Ativado</span></div>
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 py-3"><div><div className="flex items-center gap-2"><strong className="text-base text-white">Ritmo</strong><span className="rounded bg-gradient-to-r from-fuchsia-500/25 to-pink-500/25 px-1.5 py-0.5 text-[9px] font-black text-pink-300">R</span></div><p className="mt-1 max-w-[620px] text-sm font-semibold leading-5 text-zinc-500">PIX parcelado: o convidado pagará as parcelas via PIX. As regras de parcelamento serão configuradas quando o Ritmo estiver disponível.</p></div><span className="shrink-0 rounded-full bg-white/[0.08] px-3 py-1 text-sm font-bold text-zinc-400">Em preparação</span></div>
        </div>
      </section>

      {divider}

      <section className="grid gap-8 md:grid-cols-2">
        <div><div className="flex items-center justify-between"><h2 className="text-[20px] font-bold text-white">Faturamento</h2><button type="button" onClick={() => { setBillingDraft(billing); setModal('billing'); }} className={secondaryButton}><PenLine size={14} /> Editar</button></div><p className="mt-1 text-base font-medium leading-6 text-zinc-300">Suas informações de vendedor exibidas nas faturas dos convidados.</p><div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-white/[0.055] p-[18px] text-sm"><div className="grid grid-cols-[130px_1fr]"><span className="font-semibold text-zinc-500">Nome do Vendedor</span><strong>{billing.sellerName || calendarName}</strong></div><div className="grid grid-cols-[130px_1fr]"><span className="font-semibold text-zinc-500">Endereço</span><span className="text-zinc-500">{billing.address || '—'}</span></div><div className="grid grid-cols-[130px_1fr]"><span className="font-semibold text-zinc-500">Memo</span><span className="text-zinc-500">{billing.memo || '—'}</span></div></div></div>
        <div><h2 className="text-[20px] font-bold text-white">Imposto</h2><p className="mt-1 text-base font-medium leading-6 text-zinc-300">Calcule e adicione impostos sobre os preços dos ingressos.</p><div className="mt-5 flex min-h-[61px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3"><span className="text-sm font-semibold text-zinc-400">Atualize para o Fauves Plus para cobrar impostos.</span><button type="button" onClick={onOpenFauvesPlus} className={`${secondaryButton} shrink-0`}>Saiba mais</button></div></div>
      </section>

      {divider}

      <section><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-[20px] font-bold text-white">Política de Reembolso</h2><p className="mt-1 text-base font-medium text-zinc-300">A política de reembolso é exibida nas páginas do evento e na <span className="text-pink-400">página de política de reembolso</span>.</p></div><button type="button" onClick={() => { setRefundDraft(refundPolicy); setModal('refund'); }} className={secondaryButton}><Plus size={15} /> {refundPolicy ? 'Editar' : 'Adicionar'}</button></div>{refundPolicy ? <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4 text-sm font-medium leading-6 text-zinc-300">{refundPolicy}</div> : <EmptyRow icon={<FileText size={19} />} title="Nenhuma Política de Reembolso" description="Informe aos convidados qual é a sua política de reembolso." />}</section>

      {divider}

      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-[20px] font-bold text-white">Histórico de Vendas</h2><div className="flex gap-1.5"><button type="button" onClick={downloadSales} className={secondaryButton}><Download size={15} /> Baixar como CSV</button><div ref={salesMenuRef} className="group relative"><button type="button" onClick={() => setSalesMenuOpen((open) => !open)} aria-label="Ações" aria-expanded={salesMenuOpen} className={`${secondaryButton} w-9 px-0`}><MoreHorizontal size={17} /></button><span className="pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 z-40 -translate-x-1/2 translate-y-1 scale-95 rounded-lg bg-white px-2.5 py-1.5 text-[13px] font-medium leading-none text-zinc-800 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">Ações<span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-white" /></span><AnimatePresence>{salesMenuOpen && <motion.div initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="absolute right-0 top-[42px] z-30 w-[190px] origin-top-right rounded-xl border border-white/10 bg-[#242526] p-1.5 shadow-2xl"><button type="button" onClick={generateFeeInvoice} className="flex h-9 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.08]"><FileText size={16} className="text-zinc-400" />Gerar fatura de taxas</button></motion.div>}</AnimatePresence></div></div></div><EmptyRow icon={<FileText size={19} />} title="Nenhuma Transação" description="Você não realizou nenhuma venda." /></section>

      {divider}

      <section className="pb-4"><div className="mb-4 flex items-center justify-between"><h2 className="text-[20px] font-bold text-white">Histórico de Pagamentos</h2><button type="button" onClick={() => window.open('https://dashboard.stripe.com/payouts', '_blank', 'noopener,noreferrer')} className={secondaryButton}>Gerenciar <ArrowUpRight size={14} /></button></div><EmptyRow icon={<Landmark size={20} />} title="Sem Pagamentos" description="Não há pagamentos associados a este calendário." /></section>

      <CouponModalV2
        open={modal === 'coupon'}
        onClose={() => setModal(null)}
        onCreate={(coupon) => {
          const next = [...coupons.filter((item) => item.code !== coupon.code), coupon];
          setCoupons(next);
          try { localStorage.setItem(`${keyPrefix}-coupons`, JSON.stringify(next)); } catch { /* storage unavailable */ }
        }}
      />

      <AnimatePresence>
        {modal === 'billing' && <BillingModal draft={billingDraft} onChange={setBillingDraft} onClose={() => setModal(null)} onSave={() => { setBilling(billingDraft); try { localStorage.setItem(`${keyPrefix}-billing`, JSON.stringify(billingDraft)); } catch { /* storage unavailable */ } setModal(null); }} />}
        {modal === 'refund' && <RefundPolicyModal value={refundDraft} onChange={setRefundDraft} onClose={() => setModal(null)} onSave={() => { const nextPolicy = refundDraft.trim(); setRefundPolicy(nextPolicy); try { if (nextPolicy) localStorage.setItem(`${keyPrefix}-refund`, nextPolicy); else localStorage.removeItem(`${keyPrefix}-refund`); } catch { /* storage unavailable */ } setModal(null); }} />}
      </AnimatePresence>
    </motion.div>
  );
}
