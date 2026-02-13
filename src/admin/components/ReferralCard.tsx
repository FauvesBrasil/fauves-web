import React from 'react';
export default function ReferralCard() {
  const referrals = [
    { name: 'Robert Fox', date: '23 May', status: 'Pending', value: '$109.03' },
    { name: 'Anna Peterson', date: '18 May', status: 'Completed', value: '$109.03' },
    { name: 'Anna Peterson', date: '14 May', status: 'Pending', value: '$109.03' },
    { name: 'Anna Peterson', date: '3 May', status: 'Completed', value: '$109.03' },
  ];
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h4 className="mt-0">Earnings by Referral</h4>
      <div className="flex items-center gap-2 mb-2">
        <input className="flex-1 p-2 border border-slate-100 rounded" defaultValue={'https://example.com/ref/1044'} />
        <button className="px-3 py-2 bg-slate-100 rounded">Copy</button>
      </div>
      <div className="mb-2">
        <span className="text-xs mr-2">SaaS</span>
        <span className="text-xs mr-2">Ecommerce</span>
        <span className="text-xs mr-2">Pharmacy</span>
        <span className="text-xs">AI</span>
      </div>
      <ul className="list-none p-0 m-0">
        {referrals.map((r,i)=>(
          <li key={i} className={`flex justify-between items-center py-2 ${i<referrals.length-1 ? 'border-b border-slate-100' : ''}`}>
            <span>{r.name}</span>
            <span className="opacity-70">{r.date}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${r.status==='Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{r.status}</span>
            <span className="font-semibold">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}