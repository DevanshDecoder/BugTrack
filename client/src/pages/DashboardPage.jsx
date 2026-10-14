import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import api from '../api/axios';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusDistributionChart } from '../components/dashboard/StatusDistributionChart';
import { PriorityDistributionChart } from '../components/dashboard/PriorityDistributionChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import { WorkloadChart } from '../components/dashboard/WorkloadChart';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { LoadingSpinner, EmptyState, Button } from '../components/common/Button';
import {
  ListTodo,
  CircleDot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage = ({ onOpenNewIssue, onOpenNewProject }) => {
  const { currentProject, loadingProjects } = useProject();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/analytics/project/${currentProject._id}`);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load project dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchAnalytics();
    }
  }, [currentProject]);

  if (loadingProjects) {
    return <LoadingSpinner label="Loading workspace..." />;
  }

  if (!currentProject) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderPlus}
          title="No Project Selected"
          description="Create your first project or select an existing one to view real-time metrics and issue analytics."
          actionText="Create Project"
          onAction={onOpenNewProject}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner label="Crunching project metrics & charts..." />;
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        {error || 'Unable to load analytics'}
      </div>
    );
  }

  const {
    summary,
    statusDistribution,
    priorityDistribution,
    teamWorkload,
    trends,
    recentActivities,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Header with Project info & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Project Overview & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time health, priority allocation, and sprint throughput for{' '}
            <span className="font-semibold text-slate-700">
              {currentProject.name}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={FolderPlus}
            onClick={onOpenNewProject}
          >
            + New Project
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchAnalytics}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewIssue}
          >
            + Create Issue
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          title="Total Issues"
          value={summary.total}
          icon={ListTodo}
          color="indigo"
        />
        <MetricCard
          title="Open"
          value={summary.open}
          icon={CircleDot}
          color="indigo"
        />
        <MetricCard
          title="In Progress"
          value={summary.inProgress}
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Resolved"
          value={summary.resolved + summary.closed}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Critical Alerts"
          value={summary.critical}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Row 2: Status Breakdown & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Distribution
            </h3>
            <p className="text-[11px] text-slate-400">
              Current lifecycle distribution across all active tickets
            </p>
          </div>
          <StatusDistributionChart data={statusDistribution} />
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Priority Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">
              Issue severity breakdown across Low, Medium, High, and Critical
            </p>
          </div>
          <PriorityDistributionChart data={priorityDistribution} />
        </div>
      </div>

      {/* Row 3: Trends & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Date-based Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              7-Day Velocity & Trends
            </h3>
            <p className="text-[11px] text-slate-400">
              Volume of newly created vs resolved issues over the past week
            </p>
          </div>
          <TrendChart data={trends} />
        </div>

        {/* Team Workload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Team Workload
            </h3>
            <p className="text-[11px] text-slate-400">
              Active open tasks vs completed items assigned per developer
            </p>
          </div>
          <WorkloadChart data={teamWorkload} />
        </div>
      </div>

      {/* Row 4: Recent Activity Stream */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Activity & Audit Trail
          </h3>
          <p className="text-[11px] text-slate-400">
            Chronological audit feed of status updates, reassignments, and comments
          </p>
        </div>
        <RecentActivityFeed activities={recentActivities} />
      </div>
    </div>
  );
};
