import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import pixPaymentStatus from '@/assets/pix-payment-status.svg';

export type PaymentAnimationStatus = 'processing' | 'pix-waiting' | 'success' | 'declined';

interface PaymentStatusAnimationProps {
  status: PaymentAnimationStatus;
  method?: 'card' | 'pix';
  title?: string;
  description?: string;
  compact?: boolean;
  darkSurface?: boolean;
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
    <span className="flex h-2 items-center gap-[5px]" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-2 w-2 rounded-full bg-white"
          animate={reducedMotion ? undefined : { y: [0, -4, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.72, repeat: Infinity, delay: dot * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function StatusVisual({ status, compact }: Pick<PaymentStatusAnimationProps, 'status' | 'compact'>) {
  const reducedMotion = Boolean(useReducedMotion());
  const isPix = status === 'pix-waiting';
  const designSize = isPix ? 81 : 70;
  const scale = compact ? 0.7 : 1;
  const renderedSize = designSize * scale;
  const glassColor = status === 'success'
    ? 'rgba(74,189,61,.20)'
    : status === 'declined'
      ? 'rgba(211,31,31,.20)'
      : 'rgba(255,255,255,.10)';

  return (
    <div className="relative shrink-0" style={{ width: renderedSize, height: renderedSize }} aria-hidden="true">
      <div className="absolute left-0 top-0" style={{ width: designSize, height: designSize, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {status === 'success' && CONFETTI.map((piece, index) => (
          <motion.span
            key={`${piece.x}-${piece.y}`}
            className="absolute left-[35px] top-[35px] rounded-full"
            style={{ width: piece.size, height: piece.size, backgroundColor: piece.color }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 0 } : { x: piece.x, y: piece.y, scale: [0, 1, 0.8], opacity: [0, 1, 1, 0] }}
            transition={{ delay: 0.34 + index * 0.025, duration: 0.82, ease: 'easeOut' }}
          />
        ))}

        {isPix ? (
          <>
            <motion.div
              className="absolute left-0 top-[11px] h-[70px] w-[70px] rounded-full border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_12px_28px_rgba(0,0,0,.18)] backdrop-blur-[18px]"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.78 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            />
            <motion.img
              src={pixPaymentStatus}
              alt=""
              className="absolute inset-0 h-[81px] w-[81px]"
              style={{ clipPath: 'circle(35px at 35px 46px)', transformOrigin: '35px 46px' }}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.78 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            />
            <motion.img
              src={pixPaymentStatus}
              alt=""
              className="absolute inset-0 h-[81px] w-[81px]"
              style={{
                transformOrigin: '35px 46px',
                maskImage: 'radial-gradient(circle at 35px 46px, transparent 0 36px, #000 37px 49px, transparent 50px)',
                WebkitMaskImage: 'radial-gradient(circle at 35px 46px, transparent 0 36px, #000 37px 49px, transparent 50px)',
              }}
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 1.55, repeat: Infinity, ease: 'linear' }}
            />
          </>
        ) : (
          <motion.div
            className="absolute inset-0 grid h-[70px] w-[70px] place-items-center rounded-full border border-white/[.14] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_12px_28px_rgba(0,0,0,.16)] backdrop-blur-[18px]"
            style={{ backgroundColor: glassColor }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.74 }}
            animate={status === 'declined' && !reducedMotion
              ? { opacity: 1, scale: 1, x: [0, -4, 4, -2, 2, 0] }
              : { opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 310, damping: 22 }}
          >
            {status === 'processing' && <ProcessingDots reducedMotion={reducedMotion} />}
            {status === 'success' && (
              <svg viewBox="0 0 35.5 25.5" width="35.5" height="25.5" fill="none">
                <motion.path
                  d="M3 12.5004L13 22.5L32.5 3"
                  stroke="#37FF00"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.18, duration: reducedMotion ? 0 : 0.48, ease: 'easeOut' }}
                />
              </svg>
            )}
            {status === 'declined' && (
              <svg viewBox="0 0 25.5 25.5" width="25.5" height="25.5" fill="none">
                <motion.path d="M3 22.5L22.5 3" stroke="#FF0000" strokeWidth="6" strokeLinecap="round" initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: reducedMotion ? 0 : 0.12, duration: reducedMotion ? 0 : 0.34 }} />
                <motion.path d="M3 3L22.5 22.5" stroke="#FF0000" strokeWidth="6" strokeLinecap="round" initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: reducedMotion ? 0 : 0.2, duration: reducedMotion ? 0 : 0.34 }} />
              </svg>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusAnimation({
  status,
  title,
  description,
  compact = false,
  darkSurface = false,
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
          : 'mx-auto flex w-full max-w-xl flex-col items-center text-center',
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
      <div className={compact ? 'min-w-0' : 'mt-6'}>
        <motion.h2
          className={cn(
            'font-semibold tracking-[-0.025em]',
            darkSurface ? 'text-white' : 'text-slate-950 dark:text-white',
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
            'font-normal',
            darkSurface ? 'text-[#d0d2d7]' : 'text-slate-500 dark:text-slate-300',
            compact ? 'mt-0.5 text-xs leading-5' : 'mt-5 text-base leading-6 max-sm:text-sm',
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
