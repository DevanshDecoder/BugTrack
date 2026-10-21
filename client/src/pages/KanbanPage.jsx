import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import api from '../api/axios';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { LoadingSpinner, EmptyState, Button } from '../components/common/Button';
import { Search, FolderPlus, Plus, RefreshCw } from 'lucide-react';

export const KanbanPage = ({
  onSelectIssue,
  onOpenNewIssue,
  onOpenNewProject,
  refreshTrigger,
}) => {
  const { currentProject, loadingProjects, usersList, canRaiseIssue } = useProject();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick filters for the board
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const fetchIssues = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const res = await api.get('/issues', {
        params: { projectId: currentProject._id },
      });
      setIssues(res.data.data || []);
    } catch (err) {
      console.error('Failed to load board issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchIssues();
    }
  }, [currentProject, refreshTrigger]);

  // Client-side quick filter on board
  const filteredIssues = issues.filter((issue) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = issue.title?.toLowerCase().includes(q);
      const matchKey = issue.issueKey?.toLowerCase().includes(q);
      if (!matchTitle && !matchKey) return false;
    }
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) {
      return false;
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && issue.assignee) return false;
      if (
        assigneeFilter !== 'unassigned' &&
        issue.assignee?._id !== assigneeFilter &&
        issue.assignee !== assigneeFilter
      ) {
        return false;
      }
    }
    return true;
  });

  const projectMembers = currentProject?.members || [];
  const selectableUsers =
    projectMembers.length > 0
      ? projectMembers.map((m) => m.user)
      : usersList;

  if (loadingProjects) {
    return <LoadingSpinner label="Loading workspace..." />;
  }

  if (!currentProject) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderPlus}
          title="No Project Selected"
          description="Create your first project or select an existing one to use the Kanban sprint board."
          actionText="Create Project"
          onAction={onOpenNewProject}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kanban Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag issues between columns to update status in real-time for{' '}
            <span className="font-semibold text-slate-700">
              {currentProject.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchIssues}
          >
            Refresh
          </Button>
          {canRaiseIssue && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onOpenNewIssue}
            >
              New Issue
            </Button>
          )}
        </div>
      </div>

      {/* Board Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter cards..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[150px] truncate"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {selectableUsers.map((u) => {
              const uId = u?._id || u;
              const uName = u?.name || 'Member';
              return (
                <option key={uId} value={uId}>
                  {uName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-slate-700 font-bold">{filteredIssues.length}</span> cards
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <LoadingSpinner label="Loading Kanban board..." />
      ) : (
        <KanbanBoard
          issues={filteredIssues}
          setIssues={setIssues}
          onSelectIssue={onSelectIssue}
          onOpenNewIssue={onOpenNewIssue}
        />
      )}
    </div>
  );
};
