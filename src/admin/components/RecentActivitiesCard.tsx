import React from 'react';
export default function RecentActivitiesCard() {
  const activities = [
    { name: 'Apple Music', date: '2 dias atrás', value: '-$39.40' },
    { name: 'Google Cloud', date: '3 dias atrás', value: '-$39.40' },
    { name: 'Amazon', date: '5 dias atrás', value: '-$39.40' },
  ];
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h4 className="mt-0">Recent Activities</h4>
      <ul className="list-none p-0 m-0">
        {activities.map((a,i)=>(
          <li key={i} className={`flex justify-between items-center py-2 ${i<activities.length-1 ? 'border-b border-slate-100' : ''}`}>
            <span>{a.name}</span>
            <span className="opacity-70">{a.date}</span>
            <span className="font-semibold">{a.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}