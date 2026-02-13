import React from 'react';

interface RankingRow {
  id: string | number;
  name: string;
  value: string;
  delta: number;
}

interface Props {
  data?: RankingRow[];
}

export default function OrganizerRanking({ data = [] }: Props){
  if (data.length === 0) {
    return <div className="text-sm text-slate-500 p-4">Nenhum dado disponível</div>;
  }
  
  return (
    <div className="flex flex-col gap-2">
      {data.map((r, idx) => (
        <div key={r.id} className="flex justify-between items-center p-2 rounded-md bg-white border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center font-semibold">{idx + 1}</div>
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-slate-500">Organizador</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-extrabold">{r.value}</div>
            <div className={r.delta >= 0 ? 'text-emerald-500 font-semibold text-sm' : 'text-rose-500 font-semibold text-sm'}>
              {r.delta >= 0 ? `+${r.delta}%` : `${r.delta}%`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
