import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0..100
  colorScheme?: 'indigo' | 'green' | 'orange' | 'red' | 'zinc';
  height?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  striped?: boolean;
  animated?: boolean;
  className?: string;
  labelFormatter?: (value: number) => string;
}

const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-600',
  green: 'bg-emerald-600',
  orange: 'bg-orange-500',
  red: 'bg-red-600',
  zinc: 'bg-zinc-600',
};

const HEIGHT_MAP: Record<string, string> = {
  xs: 'h-1.5',
  sm: 'h-2.5',
  md: 'h-3.5',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  colorScheme='indigo',
  height='sm',
  showLabel=false,
  striped=false,
  animated=false,
  className,
  labelFormatter = v => `${Math.round(v)}%`
}) => {
  const v = Math.max(0, Math.min(100, value));
  const barClasses = [
    COLOR_MAP[colorScheme] || COLOR_MAP.indigo,
    'transition-all duration-500 ease-out rounded-full',
    striped ? 'bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]' : '',
    animated ? 'animate-pulse' : ''
  ].join(' ').trim();
  return (
    <div className={cn('w-full flex flex-col gap-1', className)} aria-label="Progresso" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('w-full bg-zinc-100 rounded-full overflow-hidden', HEIGHT_MAP[height])}>
        <div className={barClasses} style={{ width: v + '%' }} />
      </div>
      {showLabel && <span className="text-[10px] font-medium text-zinc-600">{labelFormatter(v)}</span>}
    </div>
  );
};
