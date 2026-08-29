import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaPix } from 'react-icons/fa6';
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

const COPY: Record<PaymentAnimationStatus, { title: string; description: string }> = {
  processing: {
    title: 'Processando pagamento...',
    description: 'Espera só um pouquinho, já já termino!',
  },
  'pix-waiting': {
    title: 'Aguardando seu PIX',
    description: 'Escaneie o QR Code ou use o Pix Copia e Cola.',
  },
  success: {
    title: 'Pagamento confirmado!',
    description: 'Obrigado. Estamos ansiosos para te ver!',
  },
  declined: {
    title: 'Ops! Algum problema aconteceu',
    description: 'O seu pagamento não deu certo ainda, que tal tentar mais uma vez?',
  },
};

const CONFETTI = [
  { x: -48, y: -33, color: '#7357ff', size: 7 },
  { x: -62, y: -4, color: '#ff5a36', size: 6 },
  { x: -48, y: 32, color: '#36c98f', size: 7 },
  { x: -24, y: 52, color: '#ffbd3d', size: 5 },
  { x: 22, y: -52, color: '#ef4118', size: 6 },
  { x: 51, y: -31, color: '#38a9ff', size: 7 },
  { x: 63, y: 4, color: '#ab65ff', size: 6 },
  { x: 47, y: 36, color: '#ff7d3d', size: 7 },
  { x: 19, y: 54, color: '#44d477', size: 5 },
];

function ProcessingDots({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full bg-white"
          animate={reducedMotion ? undefined : { y: [0, -5, 0], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 0.72, repeat: Infinity, delay: dot * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function StatusVisual({ status, compact }: Pick<PaymentStatusAnimationProps, 'status' | 'compact'>) {
  const reducedMotion = Boolean(useReducedMotion());
  const frameSize = compact ? 58 : 82;
  const orbSize = compact ? 44 : 70;
  const iconSize = compact ? 20 : 30;
  const isPix = status === 'pix-waiting';

  return (
    <div className="relative shrink-0" style={{ width: frameSize, height: frameSize }} aria-hidden="true">
      {isPix && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-r-[#2a2ad7] border-t-[#2a2ad7]"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {status === 'success' && CONFETTI.map((piece, index) => (
        <motion.span
          key={`${piece.x}-${piece.y}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: piece.size, height: piece.size, backgroundColor: piece.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={reducedMotion
            ? { opacity: 0 }
            : { x: piece.x, y: piece.y, scale: [0, 1, 0.8], opacity: [0, 1, 1, 0] }}
          transition={{ delay: 0.34 + index * 0.025, duration: 0.82, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className={cn(
          'absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-white',
          (status === 'processing' || isPix) && 'border-white/25 bg-[#2a2c2e]',
          status === 'declined' && 'border-red-300/25 bg-[#3b2020] text-[#ff2929]',
        )}
        style={{ width: orbSize, height: orbSize }}
        initial={reducedMotion ? false : {
          scale: 0.72,
          opacity: 0,
          backgroundColor: status === 'success' ? '#2a2c2e' : undefined,
        }}
        animate={status === 'success'
          ? { scale: 1, opacity: 1, backgroundColor: '#183d21', borderColor: 'rgba(126,255,116,.28)' }
          : status === 'declined' && !reducedMotion
            ? { scale: 1, opacity: 1, x: [0, -4, 4, -2, 2, 0] }
            : { scale: 1, opacity: 1 }}
        transition={status === 'success'
          ? { duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }
          : { type: 'spring', stiffness: 310, damping: 22 }}
      >
        {status === 'processing' && <ProcessingDots reducedMotion={reducedMotion} />}

        {isPix && (
          <motion.span
            initial={reducedMotion ? false : { opacity: 0, scale: 0.7, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.12, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <FaPix size={iconSize} />
          </motion.span>
        )}

        {status === 'success' && (
          <svg viewBox="0 0 52 52" width={iconSize + 10} height={iconSize + 10} fill="none">
            <motion.path
              d="M13 27.5 21.5 36 39 17"
              stroke="#50f126"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.18, duration: reducedMotion ? 0 : 0.48, ease: 'easeOut' }}
            />
          </svg>
        )}

        {status === 'declined' && (
          <svg viewBox="0 0 52 52" width={iconSize + 9} height={iconSize + 9} fill="none">
            <motion.path
              d="m17 17 18 18M35 17 17 35"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.16, duration: reducedMotion ? 0 : 0.38 }}
            />
          </svg>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentStatusAnimation({
  status,
  title,
  description,
  compact = false,
  className,
}: PaymentStatusAnimationProps) {
  const content = COPY[status];
  const reducedMotion = Boolean(useReducedMotion());
  const isPix = status === 'pix-waiting';

  return (
    <motion.section
      className={cn(
        compact
          ? 'flex items-center gap-3 text-left'
          : 'mx-auto flex w-full max-w-xl flex-col items-center px-4 py-7 text-center',
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.985, filter: 'blur(3px)' }}
      transition={{ duration: reducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      aria-busy={status === 'processing' || isPix}
    >
      <StatusVisual status={status} compact={compact} />
      <div className={compact ? 'min-w-0' : 'mt-3.5'}>
        <motion.h2
          className={cn(
            'font-semibold tracking-[-0.025em] text-slate-950 dark:text-white',
            compact ? 'text-sm' : 'text-[26px] leading-tight max-sm:text-[22px]',
          )}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : isPix ? 0.16 : 0.1, duration: reducedMotion ? 0 : 0.3 }}
        >
          {title || content.title}
        </motion.h2>
        <motion.p
          className={cn(
            'font-normal text-slate-500 dark:text-slate-300',
            compact ? 'mt-0.5 text-xs leading-5' : 'mt-3 text-base leading-6 max-sm:text-sm',
          )}
          initial={reducedMotion ? false : { opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : isPix ? 0.3 : 0.18, duration: reducedMotion ? 0 : 0.3 }}
        >
          {description || content.description}
        </motion.p>
      </div>
    </motion.section>
  );
}
