import React from 'react';

const colors = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
];

export const Avatar = ({ user, name = '', size = 'md', className = '' }) => {
  const displayName = user?.name || name || 'User';
  const avatarUrl = user?.avatar;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Consistent color based on char codes
  const charCodeSum = displayName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-12 h-12 text-base font-bold',
  }[size] || 'w-8 h-8 text-xs font-semibold';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        title={displayName}
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0 ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      title={displayName}
      className={`${sizeClasses} ${colorClass} rounded-full flex items-center justify-center text-white ring-2 ring-white shadow-sm flex-shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
};
