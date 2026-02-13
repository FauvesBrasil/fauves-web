import React from 'react';

interface EventItem {
  id: string;
  title: string;
  date?: string;
  status?: string;
}

interface Props {
  data?: EventItem[];
}

export default function NextEventsTimeline({ data = [] }: Props){
  if (data.length === 0) {
    return <div className="text-sm text-slate-500 p-4">Nenhum evento próximo</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {data.map(e => (
          <div key={e.id} className="min-w-[200px] bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-slate-500">{e.date || '—'}</div>
            <div className="font-semibold mt-1">{e.title}</div>
            {e.status && (
              <div className="flex gap-2 mt-2">
                <div className="text-[11px] px-2 py-1 rounded-full bg-slate-100 capitalize">{e.status}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
