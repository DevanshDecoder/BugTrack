import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [usersList, setUsersList] = useState([]);

  // Allow explicit role switching / simulation for testing permissions
  const [activeRoleOverride, setActiveRoleOverride] = useState(() => {
    return localStorage.getItem('bugtrack_active_role') || null;
  });

  const fetchProjects = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects');
      const projectList = res.data.data || [];
      setProjects(projectList);

      // Restore or select first project
      if (projectList.length > 0) {
        const savedId = localStorage.getItem('bugtrack_current_project_id');
        const found = projectList.find((p) => p._id === savedId);
        const selected = found || projectList[0];
        setCurrentProject(selected);
        localStorage.setItem('bugtrack_current_project_id', selected._id);
      } else {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/auth/users');
      setUsersList(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchUsers();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setLoadingProjects(false);
      setActiveRoleOverride(null);
      localStorage.removeItem('bugtrack_active_role');
    }
  }, [isAuthenticated]);

  const selectProject = (project) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('bugtrack_current_project_id', project._id);
    } else {
      localStorage.removeItem('bugtrack_current_project_id');
    }
  };

  // Derive user's active role
  const currentRole = (() => {
    if (activeRoleOverride) {
      return activeRoleOverride;
    }
    if (!user) return 'Viewer';
    if (!currentProject) return user.role || 'Developer';

    const uId = (user._id || user.id)?.toString();

    // 1. Check if member entry exists in current project
    if (Array.isArray(currentProject.members)) {
      const member = currentProject.members.find(
        (m) => (m.user?._id || m.user)?.toString() === uId
      );
      if (member && member.role) {
        return member.role;
      }
    }

    // 2. Fall back to 'Admin' if owner or if user's global system role is Admin
    const ownerId = (currentProject.owner?._id || currentProject.owner)?.toString();
    if (ownerId && ownerId === uId) {
      return 'Admin';
    }

    if (user.role === 'Admin') {
      return 'Admin';
    }

    // 3. User is not in this project's team -> read-only Viewer
    return 'Viewer';
  })();

  // Switch role actively
  const switchRole = async (newRole) => {
    setActiveRoleOverride(newRole);
    localStorage.setItem('bugtrack_active_role', newRole);

    // If current project exists, also try updating project membership role in DB
    if (currentProject && user) {
      const uId = (user._id || user.id)?.toString();
      try {
        await api.put(`/projects/${currentProject._id}/members/${uId}`, {
          role: newRole,
        });
        // Update local currentProject state so UI stays in sync
        setCurrentProject((prev) => {
          if (!prev) return prev;
          const updatedMembers = (prev.members || []).map((m) => {
            const mId = (m.user?._id || m.user)?.toString();
            return mId === uId ? { ...m, role: newRole } : m;
          });
          return { ...prev, members: updatedMembers };
        });
      } catch (err) {
        // If DB update not permitted, role override still functions on frontend
        console.warn('Local role switched to:', newRole);
      }
    }
  };

  const isMember = currentRole !== 'Viewer';
  const isAdmin = currentRole === 'Admin';
  const isDeveloper = currentRole === 'Developer';
  const isTester = currentRole === 'Tester';
  const isReporter = currentRole === 'Reporter';
  const isViewer = currentRole === 'Viewer';

  const canManageProject = isAdmin;
  const canDeleteIssue = (issue) => isAdmin;
  const canRaiseIssue = isMember;
  const canAssignIssue = isAdmin || isReporter;
  const canEditAnyIssue = isMember;
  const canViewComments = isMember || isAdmin;
  const canChangeStatus = isAdmin || isDeveloper || isTester;

  const validateStatusTransition = (oldStatus, newStatus) => {
    if (oldStatus === newStatus) return { allowed: true };
    if (isAdmin) return { allowed: true };

    if (isDeveloper) {
      if (newStatus === 'Closed') {
        return {
          allowed: false,
          message: "Developers cannot close issues directly. When an issue is marked as 'Resolved', it must be verified and closed by a Tester or Admin.",
        };
      }
      return { allowed: true };
    }

    if (isTester) {
      if (oldStatus !== 'Resolved') {
        return {
          allowed: false,
          message: "Testers can only verify issues that are currently 'Resolved' (move to 'Closed' or reopen if verification fails).",
        };
      }
      return { allowed: true };
    }

    if (isReporter) {
      return {
        allowed: false,
        message: 'Reporters can raise and assign issues, but cannot change issue status.',
      };
    }

    return {
      allowed: false,
      message: 'You must be a project member to change issue status.',
    };
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        loadingProjects,
        usersList,
        currentRole,
        activeRoleOverride,
        isMember,
        isAdmin,
        isDeveloper,
        isTester,
        isReporter,
        isViewer,
        canManageProject,
        canDeleteIssue,
        canRaiseIssue,
        canAssignIssue,
        canEditAnyIssue,
        canViewComments,
        canChangeStatus,
        validateStatusTransition,
        fetchProjects,
        fetchUsers,
        selectProject,
        setCurrentProject,
        switchRole,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
