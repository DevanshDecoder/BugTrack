import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useProject } from '../../context/ProjectContext';
import api from '../../api/axios';

const COLUMNS = [
  { status: 'Open', title: 'Open', colorAccent: 'bg-blue-500' },
  { status: 'In Progress', title: 'In Progress', colorAccent: 'bg-amber-500' },
  { status: 'Resolved', title: 'Resolved', colorAccent: 'bg-emerald-500' },
  { status: 'Closed', title: 'Closed', colorAccent: 'bg-slate-400' },
];

export const KanbanBoard = ({
  issues,
  setIssues,
  onSelectIssue,
  onOpenNewIssue,
}) => {
  const { canChangeStatus, validateStatusTransition } = useProject();

  const handleDragStart = (e, issue) => {
    if (!canChangeStatus) return;
    e.dataTransfer.setData('text/plain', issue._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStatusChange = async (issueId, newStatus) => {
    if (!canChangeStatus) {
      alert('You do not have permission to update issue status');
      return;
    }

    const targetIssue = issues.find((i) => i._id === issueId);
    if (targetIssue && validateStatusTransition) {
      const val = validateStatusTransition(targetIssue.status, newStatus);
      if (!val.allowed) {
        alert(val.message);
        return;
      }
    }

    const previousIssues = [...issues];

    // Optimistic local update
    setIssues((prev) =>
      prev.map((i) => (i._id === issueId ? { ...i, status: newStatus } : i))
    );

    try {
      await api.patch(`/issues/${issueId}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status on server:', err);
      // Revert if error
      setIssues(previousIssues);
      alert(err.response?.data?.message || 'Could not update status. Check permissions or network.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status);
        return (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            colorAccent={col.colorAccent}
            issues={colIssues}
            onSelectIssue={onSelectIssue}
            onStatusChange={handleStatusChange}
            onDragStart={handleDragStart}
            onDropIssue={handleStatusChange}
            onOpenNewIssue={onOpenNewIssue}
          />
        );
      })}
    </div>
  );
};
