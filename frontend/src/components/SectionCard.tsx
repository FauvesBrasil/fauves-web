import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  padded?: boolean;
  variant?: 'default' | 'muted' | 'outline';
  footer?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  bodyClassName,
  footer,
  padded=true,
  variant='default'
}) => {
  const variantClasses = {
    default: 'bg-white shadow-sm border border-zinc-200',
    muted: 'bg-zinc-50 border border-zinc-200',
    outline: 'bg-transparent border border-zinc-300',
  }[variant];

  return (
    <section className={cn('rounded-xl flex flex-col', variantClasses, className)}>
      {(title || actions || description) && (
        <div className={cn('flex flex-col gap-2 border-b border-zinc-200', padded ? 'px-5 py-4' : 'p-3', headerClassName)}>
          <div className="flex items-start justify-between gap-4">
            {title && <h3 className="text-sm font-semibold text-zinc-900 tracking-wide leading-none mt-0.5">{title}</h3>}
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
          {description && <div className="text-[11px] text-zinc-600 leading-relaxed">{description}</div>}
        </div>
      )}
      <div className={cn('flex-1 min-h-[10px]', padded ? 'p-5' : 'p-3', bodyClassName)}>
        {children}
      </div>
      {footer && (
        <div className={cn('border-t border-zinc-200', padded ? 'px-5 py-3' : 'p-3')}>
          {footer}
        </div>
      )}
    </section>
  );
};
