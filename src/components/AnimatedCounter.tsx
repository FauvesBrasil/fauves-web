import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, className = '' }) => {
  const digits = value.toString().split('');

  return (
    <div className={`inline-flex ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {digits.map((digit, index) => (
          <motion.span
            key={`${index}-${digit}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
              mass: 0.5,
            }}
            className="inline-block tabular-nums"
            style={{ display: 'inline-block', minWidth: '0.6em' }}
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};
