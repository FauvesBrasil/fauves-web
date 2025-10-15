import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED' | 'EXPIRED' | 'FAILED' | 'PROCESSING';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const STATUS_META: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  PROCESSING: { label: 'Processando', color: 'bg-sky-100 text-sky-800 border-sky-200', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> },
  PAID: { label: 'Pago', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELED: { label: 'Cancelado', color: 'bg-zinc-100 text-zinc-700 border-zinc-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  REFUNDED: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  EXPIRED: { label: 'Expirado', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Falhou', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export const PaymentStatusBadge: React.FC<Props> = ({ status, size='sm', showIcon=true, className }) => {
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <Badge
      className={`border ${meta.color} gap-1 font-medium ${size==='md' ? 'text-[11px] px-3 py-1' : 'text-[10px] px-2.5 py-0.5'} ${className || ''}`.trim()}
      title={meta.label}
    >
      {showIcon && <span>{meta.icon}</span>}
      <span>{meta.label}</span>
    </Badge>
  );
};

// Optional slow spin class
// Add to global CSS if not existing:
// .animate-spin-slow { animation: spin 2s linear infinite; }
