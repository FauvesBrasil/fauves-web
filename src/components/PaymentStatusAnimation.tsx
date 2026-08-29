import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, QrCode, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentAnimationStatus = 'processing' | 'pix-waiting' | 'success' | 'declined';

interface PaymentStatusAnimationProps {
  status: PaymentAnimationStatus;
  method?: 'card' | 'pix';
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

const CONFETTI = [
  { x: -62, y: -42, color: '#6366f1', rotate: -28 },
  { x: -76, y: 8, color: '#f97316', rotate: 24 },
  { x: -45, y: 54, color: '#14b8a6', rotate: 52 },
  { x: 54, y: -48, color: '#f59e0b', rotate: 34 },
  { x: 76, y: 2, color: '#8b5cf6', rotate: -42 },
  { x: 48, y: 56, color: '#22c55e', rotate: 18 },
];

const COPY: Record<PaymentAnimationStatus, { title: string; description: string }> = {
  processing: {
    title: 'Processando pagamento',
    description: 'Estamos confirmando os dados com segurança. Isso leva só alguns segundos.',
  },
  'pix-waiting': {
    title: 'Aguardando seu Pix',
    description: 'Assim que o banco confirmar, seus ingressos serão liberados automaticamente.',
  },
  success: {
    title: 'Pagamento aprovado!',
    description: 'Tudo certo — seus ingressos já estão sendo preparados.',
  },
  declined: {
    title: 'Pagamento não aprovado',
    description: 'Nada foi cobrado. Confira os dados ou tente outra forma de pagamento.',
  },
};

function StatusVisual({ status, method, compact }: Pick<PaymentStatusAnimationProps, 'status' | 'method' | 'compact'>) {
  const reduceMotion = useReducedMotion();
  const size = compact ? 76 : 184;
  const centerSize = compact ? 48 : 92;
  const iconSize = compact ? 23 : 38;
  const isWaiting = status === 'processing' || status === 'pix-waiting';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <motion.div
        className={cn(
          'absolute inset-[8%] rounded-full blur-2xl',
          status === 'success' && 'bg-emerald-300/30 dark:bg-emerald-500/20',
          status === 'declined' && 'bg-rose-300/30 dark:bg-rose-500/20',
          isWaiting && 'bg-indigo-300/30 dark:bg-indigo-500/20',
        )}
        animate={reduceMotion ? undefined : { scale: [0.82, 1.08, 0.82], opacity: [0.35, 0.8, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {isWaiting && (
        <>
          {[0, 1].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-[9%] rounded-full border border-indigo-300/70 dark:border-indigo-500/40"
              initial={{ scale: 0.58, opacity: 0 }}
              animate={reduceMotion ? { opacity: 0.5 } : { scale: [0.58, 1.06], opacity: [0, 0.7, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: ring * 1.1, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="absolute inset-[4%] rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-400/70"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      <motion.div
        className={cn(
          'absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30%] border shadow-xl backdrop-blur-sm',
          isWaiting && 'border-indigo-100 bg-white text-indigo-600 shadow-indigo-200/60 dark:border-indigo-900 dark:bg-[#171721] dark:text-indigo-400 dark:shadow-none',
          status === 'success' && 'border-emerald-200 bg-emerald-500 text-white shadow-emerald-200/70 dark:border-emerald-500 dark:shadow-none',
          status === 'declined' && 'border-rose-200 bg-white text-rose-500 shadow-rose-200/70 dark:border-rose-900 dark:bg-[#211719] dark:shadow-none',
        )}
        style={{ width: centerSize, height: centerSize }}
        initial={{ scale: 0.68, opacity: 0, rotate: status === 'declined' ? -8 : 0 }}
        animate={status === 'declined' && !reduceMotion
          ? { scale: 1, opacity: 1, x: [0, -5, 5, -3, 3, 0], rotate: 0 }
          : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        {status === 'processing' && (
          method === 'pix' ? <QrCode size={iconSize} strokeWidth={1.8} /> : <CreditCard size={iconSize} strokeWidth={1.8} />
        )}

        {status === 'pix-waiting' && (
          <div className="relative overflow-hidden rounded-md">
            <QrCode size={iconSize} strokeWidth={1.8} />
            <motion.span
              className="absolute inset-x-0 h-px bg-indigo-500 shadow-[0_0_6px_2px_rgba(99,102,241,0.45)]"
              animate={reduceMotion ? { top: '50%' } : { top: ['8%', '88%', '8%'] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        {status === 'success' && (
          <svg viewBox="0 0 52 52" width={iconSize + 8} height={iconSize + 8} fill="none">
            <motion.path
              d="M14 27.5 22 35l16-18"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.55, ease: 'easeOut' }}
            />
          </svg>
        )}

        {status === 'declined' && (
          <svg viewBox="0 0 52 52" width={iconSize + 8} height={iconSize + 8} fill="none">
            <motion.path
              d="m17 17 18 18M35 17 17 35"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.16, duration: reduceMotion ? 0 : 0.45 }}
            />
          </svg>
        )}
      </motion.div>

      {!compact && isWaiting && (
        <motion.div
          className="absolute bottom-[9%] right-[8%] grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-orange-500 shadow-lg dark:border-[#2b2b35] dark:bg-[#20202a]"
          animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Ticket size={23} strokeWidth={1.8} />
        </motion.div>
      )}

      {!compact && status === 'success' && CONFETTI.map((piece, index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-full"
          style={{ backgroundColor: piece.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: piece.x, y: piece.y, rotate: piece.rotate, scale: 1, opacity: [0, 1, 1, 0] }}
          transition={{ delay: reduceMotion ? 0 : 0.25 + index * 0.035, duration: reduceMotion ? 0 : 1.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function PaymentStatusAnimation({
  status,
  method = 'card',
  title,
  description,
  compact = false,
  className,
}: PaymentStatusAnimationProps) {
  const content = COPY[status];

  return (
    <motion.section
      className={cn(
        compact
          ? 'flex items-center gap-3 text-left'
          : 'mx-auto flex w-full max-w-md flex-col items-center px-5 py-8 text-center',
        className,
      )}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      aria-busy={status === 'processing' || status === 'pix-waiting'}
    >
      <StatusVisual status={status} method={method} compact={compact} />
      <div className={compact ? 'min-w-0' : 'mt-5'}>
        <h2 className={cn(
          'font-bold tracking-tight text-indigo-950 dark:text-white',
          compact ? 'text-sm' : 'text-2xl',
        )}>
          {title || content.title}
        </h2>
        <p className={cn(
          'text-slate-500 dark:text-slate-400',
          compact ? 'mt-0.5 text-xs leading-5' : 'mt-2 text-sm leading-6',
        )}>
          {description || content.description}
        </p>
      </div>
    </motion.section>
  );
}
