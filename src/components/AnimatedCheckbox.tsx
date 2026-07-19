import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface AnimatedCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string | React.ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

const checkVariants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
    scale: 0.8,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    scale: 1,
  },
};

const boxVariants = {
  unchecked: {
    scale: 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderColor: 'rgb(203, 213, 225)',
  },
  checked: {
    scale: [1, 0.95, 1.05, 1],
    backgroundColor: 'rgb(99, 102, 241)',
    borderColor: 'rgb(99, 102, 241)',
  },
};

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  id,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="group relative cursor-pointer"
      >
        <motion.div
          className="relative w-5 h-5 rounded border-2 flex items-center justify-center"
          variants={boxVariants}
          initial={false}
          animate={checked ? 'checked' : 'unchecked'}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <Checkbox.Indicator forceMount>
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              initial={false}
              animate={checked ? 'checked' : 'unchecked'}
            >
              <motion.path
                d="M5 10.5L8.5 14L15 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                }}
              />
            </motion.svg>
          </Checkbox.Indicator>
        </motion.div>
      </Checkbox.Root>

      {label && (
        <label
          htmlFor={id}
          className={`text-sm ${
            disabled ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground cursor-pointer'
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};
