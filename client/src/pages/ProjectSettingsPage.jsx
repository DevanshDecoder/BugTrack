import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Avatar } from '../components/common/Avatar';
import { RoleBadge } from '../components/common/Badge';
import { Button, LoadingSpinner, EmptyState } from '../components/common/Button';
import {
  Users,
  Shield,
  Trash2,
  UserPlus,
  Save,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';

export const ProjectSettingsPage = ({ onOpenNewProject }) => {
  const {
    currentProject,
    loadingProjects,
    fetchProjects,
    currentRole,
    isAdmin,
    usersList,
    switchRole,
  } = useProject();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState({ text: '', type: '' });

  // Add member state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name || '');
      setDescription(currentProject.description || '');
      setDetailsMsg({ text: '', type: '' });
      setMemberError('');
    }
  }, [currentProject]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      setSavingDetails(true);
      setDetailsMsg({ text: '', type: '' });
      await api.put(`/projects/${currentProject._id}`, {
        name: name.trim(),
        description: description.trim(),
      });
      await fetchProjects();
      setDetailsMsg({ text: 'Project settings updated successfully', type: 'success' });
    } catch (err) {
      setDetailsMsg({
        text: err.response?.data?.message || 'Failed to update project',
        type: 'error',
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setAddingMember(true);
      setMemberError('');
      await api.post(`/projects/${currentProject._id}/members`, {
        userId: selectedUserId,
        role: newMemberRole,
      });
      await fetchProjects();
      setSelectedUserId('');
      setNewMemberRole('Developer');
    } catch (err) {
      setMemberError(
        err.response?.data?.message || 'Failed to add user to project'
      );
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    if (!isAdmin) return;
    try {
      const uId = (user?._id || user?.id)?.toString();
      if (uId === targetUserId.toString()) {
        switchRole(newRole);
      }
      await api.put(`/projects/${currentProject._id}/members/${targetUserId}`, {
        role: newRole,
      });
      await fetchProjects();
    } catch (err) {
      console.warn('Backend role update warning:', err.message);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!isAdmin) return;
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${currentProject._id}/members/${targetUserId}`);
      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!isAdmin) return;
    const confirmPrompt = window.prompt(
      `To permanently delete "${currentProject.name}" and all its issues, type "${currentProject.key}" to confirm:`
    );
    if (confirmPrompt !== currentProject.key) {
      if (confirmPrompt !== null) alert('Confirmation key does not match.');
      return;
    }

    try {
      await api.delete(`/projects/${currentProject._id}`);
      await fetchProjects();
      alert('Project deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loadingProjects) {
    return <LoadingSpinner label="Loading settings..." />;
  }

  if (!currentProject) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderPlus}
          title="No Project Selected"
          description="Create or select a project to configure team roles and settings."
          actionText="Create Project"
          onAction={onOpenNewProject}
        />
      </div>
    );
  }

  // Filter available users who are NOT yet members
  const memberUserIds = (currentProject.members || []).map((m) =>
    (m.user?._id || m.user)?.toString()
  );
  const eligibleUsersToAdd = usersList.filter(
    (u) => !memberUserIds.includes(u._id.toString())
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Project Settings & Team Members
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage workspace settings, member roles (Admin, Developer, Reporter), and permissions.
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">General Information</h3>
            <p className="text-xs text-slate-400">Workspace name and description</p>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
            Prefix: {currentProject.key}
          </span>
        </div>

        {detailsMsg.text && (
          <div
            className={`p-3 text-xs rounded-xl ${
              detailsMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {detailsMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                loading={savingDetails}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Team Members & RBAC */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Team Membership & Roles</h3>
            <p className="text-xs text-slate-400">
              Control permissions: Admins manage projects, Developers resolve issues, Reporters file bugs.
            </p>
          </div>
        </div>

        {/* Add Member Bar (Admin only) */}
        {isAdmin && (
          <form
            onSubmit={handleAddMember}
            className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Invite or Add Team Member
            </h4>

            {memberError && (
              <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {memberError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a user to add...</option>
                {eligibleUsersToAdd.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Developer">Developer</option>
                <option value="Reporter">Reporter</option>
                <option value="Admin">Admin</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedUserId}
                loading={addingMember}
              >
                Add Member
              </Button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="divide-y divide-slate-100">
          {(currentProject.members || []).map((m, idx) => {
            const memberUser = m.user;
            if (!memberUser) return null;
            const isOwner =
              currentProject.owner?._id === memberUser._id ||
              currentProject.owner === memberUser._id;

            return (
              <div
                key={memberUser._id || idx}
                className="flex items-center justify-between py-3.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={memberUser} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {memberUser.name}
                      </span>
                      {isOwner && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {memberUser.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <select
                      value={m.role || 'Developer'}
                      onChange={(e) =>
                        handleRoleChange(memberUser._id, e.target.value)
                      }
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Developer">Developer</option>
                      <option value="Reporter">Reporter</option>
                    </select>
                  )}

                  <RoleBadge role={m.role || 'Developer'} />

                  {isAdmin && !isOwner && (
                    <button
                      onClick={() => handleRemoveMember(memberUser._id)}
                      title="Remove member"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone (Admin Only) */}
      {isAdmin && (
        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/80 space-y-3">
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Danger Zone
          </h3>
          <p className="text-xs text-rose-700">
            Permanently delete this project along with all associated tickets, discussions, and audit logs. This action cannot be reversed.
          </p>
          <div className="pt-2">
            <Button variant="danger" size="sm" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
