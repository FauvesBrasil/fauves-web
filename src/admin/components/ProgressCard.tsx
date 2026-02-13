import React from 'react';
export default function ProgressCard() {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h4 className="mt-0">Promo Marketing</h4>
      <div className="text-xs mb-2">STARTED ON 28 SEP</div>
      <div className="h-14 bg-rose-100 rounded-md mb-3" />
      <div className="text-sm mb-1">Current Progress</div>
  <div className="h-2 bg-sky-500 rounded-md mb-1 w-[44%]" />
      <div className="text-xs opacity-70">44%</div>
    </div>
  );
}