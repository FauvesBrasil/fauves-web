import React from 'react';

const events = [
  { id:1, date:'18 Oct', title:'Rock Night', badges:['finance-ok','support-ok'] },
  { id:2, date:'20 Oct', title:'Startup Meetup', badges:['finance-pending'] },
  { id:3, date:'25 Oct', title:'Yoga Morning', badges:['support-issue'] },
];

export default function NextEventsTimeline(){
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {events.map(e=> (
          <div key={e.id} className="min-w-[200px] bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-slate-500">{e.date}</div>
            <div className="font-semibold mt-1">{e.title}</div>
            <div className="flex gap-2 mt-2">
              {e.badges.map((b,i)=> <div key={i} className="text-[11px] px-2 py-1 rounded-full bg-slate-100">{b.replace('-', ' ')}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
