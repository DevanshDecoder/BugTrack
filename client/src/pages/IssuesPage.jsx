import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import api from '../api/axios';
import { IssueFilters } from '../components/issues/IssueFilters';
import { IssueTable } from '../components/issues/IssueTable';
import { LoadingSpinner, EmptyState, Button } from '../components/common/Button';
import { FolderPlus, Plus, RefreshCw } from 'lucide-react';

export const IssuesPage = ({
  onSelectIssue,
  onOpenNewIssue,
  onOpenNewProject,
  refreshTrigger,
}) => {
  const { currentProject, loadingProjects, canRaiseIssue } = useProject();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const fetchIssues = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const params = {
        projectId: currentProject._id,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assigneeFilter !== 'all') params.assignee = assigneeFilter;

      const res = await api.get('/issues', { params });
      setIssues(res.data.data || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchIssues();
    }
  }, [
    currentProject,
    search,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    refreshTrigger,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  if (loadingProjects) {
    return <LoadingSpinner label="Loading workspace..." />;
  }

  if (!currentProject) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderPlus}
          title="No Project Selected"
          description="Create your first project or select an existing one to manage tickets."
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
            Issues & Backlog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full searchable issue repository for{' '}
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

      {/* Filters Toolbar */}
      <IssueFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        onReset={handleResetFilters}
      />

      {/* Issues Table */}
      {loading ? (
        <LoadingSpinner label="Fetching issues..." />
      ) : (
        <IssueTable
          issues={issues}
          onSelectIssue={onSelectIssue}
          onOpenNewIssue={onOpenNewIssue}
        />
      )}
    </div>
  );
};
