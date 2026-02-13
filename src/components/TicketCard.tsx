import React from 'react';
import { Pencil, Trash, MoreHorizontal, FileText, Link2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type TicketCardProps = {
  title: string;
  subtitle?: string;
  price?: number | string;
  status?: string | null;
  sold?: string;
  isSoldOut?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreviewPdf?: () => void;
  onCopyPrivateLink?: () => void;
  onDuplicate?: () => void;
  onMarkAsSold?: () => void;
  children?: React.ReactNode;
  compact?: boolean;
};

const TicketCard: React.FC<TicketCardProps> = ({ title, subtitle, price, status, sold, isSoldOut, onEdit, onDelete, onPreviewPdf, onCopyPrivateLink, onDuplicate, onMarkAsSold, children, compact }) => {
  return (
    <div className={`w-full rounded-lg ${compact ? 'p-4' : 'p-6'} shadow-sm transition-colors bg-white dark:bg-[#1f1f1f] border border-transparent dark:border-transparent`}>
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="text-[18px] font-semibold text-indigo-950 dark:text-white">{title}</div>
            {/** Esgotado badge */}
            {isSoldOut && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-[#2A2AD7] text-white border border-[#2A2AD7]">
                Esgotado
              </span>
            )}
          </div>
          {subtitle && <div className="text-sm text-slate-500 dark:text-slate-300">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-4">
          {price !== undefined && (
            <div className="text-[#EF4118] font-semibold text-sm dark:text-white">{typeof price === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price) : price}</div>
          )}
          {sold && <div className="text-sm text-slate-500 dark:text-slate-300">{sold}</div>}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Ações" title="Ações" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"><MoreHorizontal className="w-4 h-4 text-slate-700 dark:text-slate-200" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => onPreviewPdf && onPreviewPdf()} className="flex items-center gap-2"><FileText className="w-4 h-4" /> Pré-visualizar em PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onCopyPrivateLink && onCopyPrivateLink()} className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Copiar link privado</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit && onEdit()} className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete && onDelete()} className="flex items-center gap-2 text-red-600"><Trash className="w-4 h-4" /> Deletar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default TicketCard;
