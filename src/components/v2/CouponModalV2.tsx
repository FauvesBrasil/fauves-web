import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, DollarSign, Gift, Percent, X } from 'lucide-react';
import { FauvesSwitch } from './FauvesSwitch';

export type CouponDraft = {
  code: string;
  limitUses: boolean;
  maxUses?: number;
  discountType: 'free' | 'percent' | 'amount';
  discountValue?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (coupon: CouponDraft) => void;
  description?: string;
};

const randomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export function CouponModalV2({ open, onClose, onCreate, description = 'Crie um cupom que pode ser aplicado a qualquer evento gerenciado por este calendário.' }: Props) {
  const [code, setCode] = React.useState('');
  const [limitUses, setLimitUses] = React.useState(false);
  const [maxUses, setMaxUses] = React.useState('1');
  const [discountType, setDiscountType] = React.useState<CouponDraft['discountType']>('free');
  const [discountValue, setDiscountValue] = React.useState('10');
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setCode(randomCode());
    setLimitUses(false);
    setMaxUses('1');
    setDiscountType('free');
    setDiscountValue('10');
    setDiscountOpen(false);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setDiscountOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (discountOpen) setDiscountOpen(false);
      else onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [discountOpen, onClose, open]);

  const labels = { free: 'Grátis', percent: 'Porcentagem de Desconto', amount: 'Valor de Desconto' };
  const icon = discountType === 'free' ? <Gift size={16} /> : discountType === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />;
  const valid = code.trim().length > 0 && (!limitUses || Number(maxUses) > 0) && (discountType === 'free' || Number(discountValue) > 0);

  return (
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/65 p-3 font-sans backdrop-blur-[2px]">
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ type: 'spring', stiffness: 340, damping: 29 }} onMouseDown={(event) => event.stopPropagation()} className="relative w-full max-w-[342px] rounded-[20px] border border-white/[0.04] bg-[#1c1d1e] p-5 text-left text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-[14px] top-[14px] grid h-7 w-7 place-items-center rounded-full border-0 bg-white/10 p-0 text-zinc-400 transition-colors hover:bg-white/15 hover:text-white"><X size={16} /></button>
          <div className="mb-[14px] grid h-14 w-14 place-items-center rounded-full bg-white/10 text-zinc-300"><svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="7" width="20" height="21" rx="3" /><path d="M10 4v6M20 4v6M9 16h.01M21 20h.01M12 23l8-9" strokeLinecap="round" /></svg></div>
          <h2 className="text-[21px] font-bold leading-[26px] tracking-[-0.02em]">Criar Cupom</h2>
          <p className="mb-0 mt-1.5 text-[14px] font-medium leading-[21px] text-zinc-300">{description}</p>
          <input autoFocus value={code} maxLength={24} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} className="mt-3 h-[38px] w-full rounded-lg border border-white/10 bg-[#151617] px-3.5 font-mono text-[16px] font-semibold uppercase tracking-wide text-white outline-none focus:border-white/40" />

          <div className="mt-[17px] flex min-h-6 items-center justify-between gap-4"><span className="text-[16px] font-semibold">Usos Limitados</span><FauvesSwitch checked={limitUses} onCheckedChange={setLimitUses} label="Usos limitados" /></div>
          <AnimatePresence initial={false}>{limitUses && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 38 }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex items-center justify-between overflow-hidden rounded-lg border border-white/10 bg-[#151617] px-3.5"><span className="text-[14px] font-semibold text-zinc-400">Usos Totais</span><input type="number" min="1" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} className="w-20 border-0 bg-transparent text-right text-[16px] font-semibold text-white outline-none" /></motion.div>}</AnimatePresence>

          <div ref={dropdownRef} className="relative mt-[17px]">
            <button type="button" onClick={() => setDiscountOpen((value) => !value)} className="flex h-[38px] w-full items-center justify-between rounded-lg border-0 bg-white/10 px-3.5 text-[15px] font-semibold text-zinc-300"><span className="flex items-center gap-2 text-zinc-300">{icon}{labels[discountType]}</span><ChevronDown size={16} className="text-zinc-500" /></button>
            <AnimatePresence>{discountOpen && <motion.div initial={{ opacity: 0, scale: 0.96, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }} transition={{ duration: 0.14 }} className="absolute bottom-[45px] left-0 right-0 z-30 origin-bottom rounded-lg border border-white/10 bg-[#292a2b] p-1.5 shadow-2xl">{(['free', 'percent', 'amount'] as const).map((type) => <button key={type} type="button" onClick={() => { setDiscountType(type); setDiscountOpen(false); }} className="flex h-9 w-full items-center justify-between rounded-md border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-zinc-200 hover:bg-white/[0.06]"><span>{labels[type]}</span>{discountType === type && <Check size={16} />}</button>)}</motion.div>}</AnimatePresence>
          </div>

          {discountType !== 'free' && <div className="mt-[17px] flex items-center justify-between gap-3"><label className="text-[14px] font-semibold text-zinc-300">{discountType === 'percent' ? 'Porcentagem de Desconto' : 'Valor do Desconto'}</label><div className="flex h-[38px] w-[139px] overflow-hidden rounded-lg border border-white/10 bg-[#151617]"><input type="number" min="1" max={discountType === 'percent' ? 100 : undefined} value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent px-3 text-right text-[16px] font-semibold text-white outline-none" /><span className="grid min-w-11 place-items-center bg-white/10 px-2 text-[14px] font-semibold text-zinc-300">{discountType === 'percent' ? '%' : 'BRL'}</span></div></div>}

          <button type="button" disabled={!valid} onClick={() => { onCreate({ code, limitUses, maxUses: limitUses ? Number(maxUses) : undefined, discountType, discountValue: discountType === 'free' ? undefined : Number(discountValue) }); onClose(); }} className="mt-[17px] flex h-[38px] w-full items-center justify-center rounded-lg border-0 bg-white text-[16px] font-medium text-[#131517] hover:bg-zinc-100 disabled:opacity-40">Criar</button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}
