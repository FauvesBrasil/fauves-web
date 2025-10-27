import React from 'react';
export default function AnalyticsCard() {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h4 className="mt-0">Earnings Report</h4>
      <div className="text-2xl font-bold my-2">$821.04</div>
      <div className="h-20 bg-slate-100 rounded-md mt-2" />
      <div className="text-xs mt-2">Increase your earnings by adding more referrals <a className="text-sky-600" href="#">here</a>.</div>
    </div>
  );
}