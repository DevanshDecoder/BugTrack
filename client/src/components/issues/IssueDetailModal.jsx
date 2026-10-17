import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { CommentSection } from './CommentSection';
import { ActivityTimeline } from './ActivityTimeline';
import { useProject } from '../../context/ProjectContext';
import api from '../../api/axios';
import {
  Calendar,
  User,
  Tag,
  Edit2,
  Trash2,
  MessageSquare,
  History,
  CheckCircle2,
} from 'lucide-react';

export const IssueDetailModal = ({
  isOpen,
  onClose,
  issue,
  onIssueUpdated,
  onIssueDeleted,
  onOpenEdit,
}) => {
  const { currentProject, canDeleteIssue, canEditAnyIssue, canChangeStatus, usersList } = useProject();
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  const [updating, setUpdating] = useState(false);

  if (!issue) return null;

  const handleQuickStatusChange = async (newStatus) => {
    if (!canChangeStatus) return;
    try {
      setUpdating(true);
      const res = await api.patch(`/issues/${issue._id}/status`, {
        status: newStatus,
      });
      onIssueUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickPriorityChange = async (newPriority) => {
    if (!canEditAnyIssue) return;
    try {
      setUpdating(true);
      const res = await api.put(`/issues/${issue._id}`, {
        priority: newPriority,
      });
      onIssueUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to update priority:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAssigneeChange = async (newAssigneeId) => {
    if (!canEditAnyIssue) return;
    try {
      setUpdating(true);
      const res = await api.put(`/issues/${issue._id}`, {
        assignee: newAssigneeId || null,
      });
      onIssueUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to update assignee:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteIssue(issue)) return;
    if (!window.confirm(`Are you sure you want to delete ${issue.issueKey}?`)) {
      return;
    }
    try {
      setUpdating(true);
      await api.delete(`/issues/${issue._id}`);
      onIssueDeleted(issue._id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete issue');
    } finally {
      setUpdating(false);
    }
  };

  const projectMembers = currentProject?.members || [];
  const selectableUsers =
    projectMembers.length > 0
      ? projectMembers.map((m) => m.user)
      : usersList;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm font-bold">
            {issue.issueKey}
          </span>
          <span className="truncate">{issue.title}</span>
        </div>
      }
      subtitle={`Created on ${new Date(issue.createdAt).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      })}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Status */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span>Status:</span>
              <select
                value={issue.status}
                disabled={updating || !canChangeStatus}
                onChange={(e) => handleQuickStatusChange(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Quick Priority */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span>Priority:</span>
              <select
                value={issue.priority}
                disabled={updating || !canEditAnyIssue}
                onChange={(e) => handleQuickPriorityChange(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Quick Assignee */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span>Assignee:</span>
              <select
                value={issue.assignee?._id || issue.assignee || ''}
                disabled={updating || !canEditAnyIssue}
                onChange={(e) => handleQuickAssigneeChange(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-1 focus:ring-indigo-500 max-w-[130px] truncate disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Unassigned</option>
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
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {canEditAnyIssue && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  onClose();
                  onOpenEdit(issue);
                }}
              >
                Edit
              </Button>
            )}
            {canDeleteIssue(issue) && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Description & Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description
            </h4>
            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {issue.description || (
                <span className="text-slate-400 italic">No description provided for this issue.</span>
              )}
            </div>

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {issue.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
              Issue Details
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Reporter:</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Avatar user={issue.reporter} size="xs" />
                <span>{issue.reporter?.name || 'Unknown'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assignee:</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Avatar user={issue.assignee} size="xs" />
                <span>{issue.assignee?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Priority:</span>
              <PriorityBadge priority={issue.priority} size="xs" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status:</span>
              <StatusBadge status={issue.status} size="xs" />
            </div>

            {issue.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(issue.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs: Discussion vs Audit Trail */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4 border-b border-slate-200 mb-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'comments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Discussion & Comments
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'activity'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Trail & History
            </button>
          </div>

          {activeTab === 'comments' ? (
            <CommentSection issueId={issue._id} />
          ) : (
            <ActivityTimeline issueId={issue._id} />
          )}
        </div>
      </div>
    </Modal>
  );
};
