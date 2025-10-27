import React from 'react';

const rows = [
  { id:1, name:'Studio A', value:'R$ 42.200', delta: +12 },
  { id:2, name:'Tech Hub', value:'R$ 12.100', delta: -3 },
  { id:3, name:'Zen Club', value:'R$ 8.340', delta: +5 },
];

export default function OrganizerRanking(){
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r=> (
        <div key={r.id} className="flex justify-between items-center p-2 rounded-md bg-white border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center font-semibold">{r.id}</div>
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-slate-500">Organizador</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-extrabold">{r.value}</div>
            <div className={r.delta >= 0 ? 'text-emerald-500 font-semibold text-sm' : 'text-rose-500 font-semibold text-sm'}>{r.delta>=0?`+${r.delta}%`:`${r.delta}%`}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
