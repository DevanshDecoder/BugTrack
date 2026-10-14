import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, trend, color = 'indigo' }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50/70',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    slate: {
      bg: 'bg-slate-100/70',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
  }[color] || {
    bg: 'bg-indigo-50/70',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
        {trend && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{trend}</p>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-2xl ${colorMap.bg} ${colorMap.text} ${colorMap.border} border flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
