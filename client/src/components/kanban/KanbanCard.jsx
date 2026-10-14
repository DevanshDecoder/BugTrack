import React from 'react';
import { PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Calendar, Tag, MoveRight } from 'lucide-react';

export const KanbanCard = ({ issue, onSelectIssue, onStatusChange, onDragStart }) => {
  const nextStatusMap = {
    Open: 'In Progress',
    'In Progress': 'Resolved',
    Resolved: 'Closed',
    Closed: 'Open',
  };

  const handleNextStatus = (e) => {
    e.stopPropagation();
    const next = nextStatusMap[issue.status];
    if (next && onStatusChange) {
      onStatusChange(issue._id, next);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onClick={() => onSelectIssue(issue)}
      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-150 cursor-grab active:cursor-grabbing group select-none space-y-2.5"
    >
      {/* Top row: Key and Priority */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
          {issue.issueKey}
        </span>
        <PriorityBadge priority={issue.priority} size="xs" />
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
        {issue.title}
      </h4>

      {/* Tags */}
      {issue.tags && issue.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {issue.tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
            >
              #{t}
            </span>
          ))}
          {issue.tags.length > 2 && (
            <span className="text-[10px] text-slate-400">
              +{issue.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer: Assignee & Quick Move */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        {issue.assignee ? (
          <div className="flex items-center gap-1.5" title={`Assigned to ${issue.assignee.name}`}>
            <Avatar user={issue.assignee} size="xs" />
            <span className="text-[11px] font-medium text-slate-600 truncate max-w-[90px]">
              {issue.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
        )}

        {/* Quick Shift Button */}
        <button
          onClick={handleNextStatus}
          title={`Move to ${nextStatusMap[issue.status]}`}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
        >
          <MoveRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
