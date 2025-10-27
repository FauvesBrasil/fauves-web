import React from 'react';

const statusClass = (s: string) => ({ healthy: 'bg-emerald-500', attention: 'bg-amber-500', critical: 'bg-rose-500' } as any)[s] || 'bg-slate-400';

export default function EventsHighlight(){
  const items = [
    { id:1, title:'Rock Night', org:'Studio A', status:'healthy', revenue:'R$ 4.200' },
    { id:2, title:'Startup Meetup', org:'Tech Hub', status:'attention', revenue:'R$ 1.120' },
    { id:3, title:'Yoga Morning', org:'Zen Club', status:'critical', revenue:'R$ 320' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {items.map(it=> (
        <div key={it.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div>
            <div className="font-semibold">{it.title}</div>
            <div className="text-xs text-slate-500">{it.org}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusClass(it.status)}`} />
              <span className="text-xs text-slate-700 capitalize">{it.status}</span>
            </div>
            <div className="font-semibold">{it.revenue}</div>
            <a href="#" className="text-sm text-sky-600">Ver detalhes</a>
          </div>
        </div>
      ))}
    </div>
  );
}
