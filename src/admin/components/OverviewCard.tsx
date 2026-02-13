import React from 'react';
export default function OverviewCard() {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h3 className="mt-0">Overview</h3>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="font-semibold">18 Front-end Dev</div>
          <div className="h-2 rounded-full bg-amber-200 mt-1" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">23 Growth Teams</div>
          <div className="h-2 rounded-full bg-rose-200 mt-1" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">12 Backend & Database</div>
          <div className="h-2 rounded-full bg-violet-200 mt-1" />
        </div>
      </div>
    </div>
  );
}