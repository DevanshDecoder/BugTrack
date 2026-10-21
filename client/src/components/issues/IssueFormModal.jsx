import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import api from '../../api/axios';

export const IssueFormModal = ({
  isOpen,
  onClose,
  issueToEdit = null,
  onIssueSaved,
}) => {
  const {
    currentProject,
    usersList,
    canAssignIssue,
    canRaiseIssue,
    isDeveloper,
    isReporter,
    isTester,
    validateStatusTransition,
  } = useProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (issueToEdit) {
      setTitle(issueToEdit.title || '');
      setDescription(issueToEdit.description || '');
      setPriority(issueToEdit.priority || 'Medium');
      setStatus(issueToEdit.status || 'Open');
      setAssignee(issueToEdit.assignee?._id || issueToEdit.assignee || '');
      setDueDate(
        issueToEdit.dueDate ? issueToEdit.dueDate.split('T')[0] : ''
      );
      setTags(issueToEdit.tags ? issueToEdit.tags.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('Open');
      setAssignee('');
      setDueDate('');
      setTags('');
    }
    setError('');
  }, [issueToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assignee: assignee || null,
        dueDate: dueDate || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        projectId: currentProject._id,
      };

      let res;
      if (issueToEdit) {
        res = await api.put(`/issues/${issueToEdit._id}`, payload);
      } else {
        res = await api.post('/issues', payload);
      }

      onIssueSaved(res.data.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to save issue. Please check inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Only project members or all users
  const projectMembers = currentProject?.members || [];
  const selectableUsers =
    projectMembers.length > 0
      ? projectMembers.map((m) => m.user)
      : usersList;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={issueToEdit ? `Edit Issue: ${issueToEdit.issueKey}` : 'Create New Issue'}
      subtitle={`Project: ${currentProject?.name} (${currentProject?.key})`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memory leak during WebSocket reconnection"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, stack traces, expected vs actual behavior..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              disabled={isReporter || (isTester && issueToEdit?.status !== 'Resolved')}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed" disabled={isDeveloper}>
                {isDeveloper ? 'Closed (Tester verified)' : 'Closed'}
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignee
              {!canAssignIssue && (
                <span className="text-[10px] text-slate-400 font-normal"> (Admin / Reporter only)</span>
              )}
            </label>
            <select
              value={assignee}
              disabled={!canAssignIssue}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">Unassigned</option>
              {selectableUsers.map((u) => {
                const uId = u?._id || u;
                const uName = u?.name || 'Team Member';
                return (
                  <option key={uId} value={uId}>
                    {uName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
            </input>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. backend, auth, ui"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {issueToEdit ? 'Save Changes' : 'Create Issue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
