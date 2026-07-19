import React from 'react';

interface EventItem {
  id: string;
  title: string;
  status: string;
  date?: string;
  image?: string | null;
}

interface Props {
  data?: EventItem[];
}

const statusClass = (s: string) => ({ 
  healthy: 'bg-emerald-500', 
  attention: 'bg-amber-500', 
  critical: 'bg-rose-500',
  active: 'bg-emerald-500',
  published: 'bg-emerald-500',
  draft: 'bg-slate-400',
  rascunho: 'bg-slate-400',
} as any)[s.toLowerCase()] || 'bg-slate-400';

export default function EventsHighlight({ data = [] }: Props){
  if (data.length === 0) {
    return <div className="text-sm text-slate-500 p-4">Nenhum evento disponível</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map(it => (
        <div key={it.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            {it.image && (
              <img src={it.image} alt={it.title} className="w-12 h-12 rounded-md object-cover" />
            )}
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-slate-500">{it.date || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusClass(it.status)}`} />
              <span className="text-xs text-slate-700 capitalize">{it.status}</span>
            </div>
            <a href={`/admin/events?eventId=${it.id}`} className="text-sm text-sky-600 hover:underline">Ver detalhes</a>
          </div>
        </div>
      ))}
    </div>
  );
}
