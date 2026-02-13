import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface MultiStateButtonProps {
  onClick: () => Promise<void>;
  idleText?: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit' | 'reset';
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

export const MultiStateButton: React.FC<MultiStateButtonProps> = ({
  onClick,
  idleText = 'Confirmar',
  loadingText = 'Carregando...',
  successText = 'Sucesso!',
  errorText = 'Erro',
  className = '',
  disabled = false,
  variant = 'primary',
  type = 'button',
}) => {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = async () => {
    if (state !== 'idle' || disabled) return;

    setState('loading');
    try {
      await onClick();
      setState('success');
      // Reset to idle after success animation
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('error');
      // Reset to idle after error animation
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const variantStyles = {
    primary: {
      idle: 'bg-brand-primary text-brand-primary-foreground hover:opacity-95',
      loading: 'bg-brand-primary text-brand-primary-foreground',
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
    },
    secondary: {
      idle: 'bg-card border border-border text-card-foreground hover:bg-accent',
      loading: 'bg-card border border-border text-card-foreground',
      success: 'bg-emerald-600 text-white border-emerald-600',
      error: 'bg-red-600 text-white border-red-600',
    },
    danger: {
      idle: 'bg-red-600 text-white hover:bg-red-700',
      loading: 'bg-red-600 text-white',
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-800 text-white',
    },
  };

  const currentStyle = variantStyles[variant][state];

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={state !== 'idle' || disabled}
      className={`
        relative overflow-hidden rounded-full py-3 px-4 font-semibold transition-all duration-300
        ${currentStyle}
        ${state !== 'idle' || disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={state === 'idle' && !disabled ? { scale: 1.02 } : {}}
      whileTap={state === 'idle' && !disabled ? { scale: 0.98 } : {}}
      animate={{
        backgroundColor: state === 'success' ? '#10b981' : state === 'error' ? '#dc2626' : undefined,
        scale: state === 'loading' ? 0.95 : state === 'success' ? 1.05 : state === 'error' ? 1 : 1,
        x: state === 'error' ? [0, -10, 10, -10, 10, 0] : 0,
      }}
      transition={{
        backgroundColor: { duration: 0.3 },
        scale: { duration: 0.3, ease: 'easeInOut' },
        x: { duration: 0.5, ease: 'easeInOut' },
      }}
    >
      <div className="relative flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {idleText}
            </motion.span>
          )}

          {state === 'loading' && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Spinner />
              {loadingText}
            </motion.span>
          )}

          {state === 'success' && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              >
                <Check className="w-5 h-5" />
              </motion.div>
              {successText}
            </motion.span>
          )}

          {state === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
              {errorText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Background pulse effect on success/error */}
      {(state === 'success' || state === 'error') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: state === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(220, 38, 38, 0.3)',
          }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
};
