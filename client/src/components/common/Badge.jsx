import React from 'react';

export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const config = {
    Low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    Medium: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    High: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    Critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
      dot: 'bg-rose-600',
    },
  }[priority] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const config = {
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Closed: 'bg-slate-100 text-slate-600 border-slate-200',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${config} ${sizeClasses}`}
    >
      {status}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const config = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Developer: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Tester: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Reporter: 'bg-teal-100 text-teal-700 border-teal-200',
    Viewer: 'bg-slate-100 text-slate-500 border-slate-200',
  }[role] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config}`}
    >
      {role}
    </span>
  );
};
