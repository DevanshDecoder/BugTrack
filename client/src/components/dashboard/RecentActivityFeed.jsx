import React from 'react';
import { Avatar } from '../common/Avatar';
import { Clock, Activity as ActivityIcon } from 'lucide-react';

export const RecentActivityFeed = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
        <ActivityIcon className="w-6 h-6 text-slate-300" />
        No recent activity logged for this project yet
      </div>
    );
  }

  return (
    <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
      {activities.map((act) => (
        <div
          key={act._id}
          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100/90 text-xs hover:border-slate-200 transition"
        >
          <Avatar user={act.actor} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-slate-900 truncate">
                {act.actor?.name || 'Someone'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(act.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {act.issue && (
              <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                {act.issue.issueKey}
              </span>
            )}

            <p className="text-slate-600 mt-1 capitalize text-[11px] leading-snug">
              {act.details || `Performed ${act.action.replace('_', ' ')}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
