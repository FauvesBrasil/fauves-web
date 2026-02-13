import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props { 
  title: string; 
  value: string; 
  icon?: LucideIcon;
  gradient?: string;
  loading?: boolean;
}

export const DashboardCard: React.FC<Props> = ({ title, value, icon: Icon, gradient = 'from-slate-500 to-slate-700', loading }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
          ) : (
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
