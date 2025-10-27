import React from 'react';

interface Props { title: string; value: string; hint?: string }

export const DashboardCard: React.FC<Props> = ({ title, value, hint }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
      <div className="text-xs font-semibold text-slate-600">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
        {hint && <div className="text-sm text-teal-500 font-semibold">{hint}</div>}
      </div>
    </div>
  );
};

export default DashboardCard;
