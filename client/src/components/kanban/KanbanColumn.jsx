import React, { useState } from 'react';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

export const KanbanColumn = ({
  status,
  title,
  issues = [],
  colorAccent,
  onSelectIssue,
  onStatusChange,
  onDragStart,
  onDropIssue,
  onOpenNewIssue,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only deactivate if leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const issueId = e.dataTransfer.getData('text/plain');
    if (issueId && onDropIssue) {
      onDropIssue(issueId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl p-3 transition-colors min-h-[500px] border ${
        isDragOver
          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200'
          : 'bg-slate-100/70 border-slate-200/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorAccent}`} />
          <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            {title}
          </h3>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
            {issues.length}
          </span>
        </div>

        {status === 'Open' && (
          <button
            onClick={onOpenNewIssue}
            title="Create issue in Open"
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 flex-1 kanban-column-scroll overflow-y-auto max-h-[calc(100vh-16rem)]">
        {issues.map((issue) => (
          <KanbanCard
            key={issue._id}
            issue={issue}
            onSelectIssue={onSelectIssue}
            onStatusChange={onStatusChange}
            onDragStart={onDragStart}
          />
        ))}

        {issues.length === 0 && (
          <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 font-medium">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
};
