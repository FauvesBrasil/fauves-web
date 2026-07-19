import React from 'react';

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function FauvesSwitch({ checked, onCheckedChange, label, disabled = false, className = '' }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative block h-6 w-[38px] min-w-[38px] shrink-0 overflow-hidden rounded-full border-0 p-0 outline-none transition-[background-color,opacity,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-[#4bd05a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-[#4bd05a]' : 'bg-[#626367]'} ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0.5 block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-transform duration-200"
        style={{ transform: `translateX(${checked ? 16 : 2}px)` }}
      />
    </button>
  );
}
