import Project from '../models/Project.js';
import Issue from '../models/Issue.js';

/**
 * Helper to determine a user's role in a project
 * Valid roles: Admin, Developer, Reporter
 */
export const getUserProjectRole = (project, userId, userGlobalRole = null) => {
  if (!project || !userId) return null;
  const uId = userId.toString();

  // 1. Check members array first to respect assigned/updated role (even for owner)
  if (Array.isArray(project.members)) {
    const member = project.members.find((m) => {
      const mId = (m.user?._id || m.user)?.toString();
      return mId === uId;
    });

    if (member && member.role) {
      return member.role;
    }
  }

  // 2. If not found in members but is owner or global Admin, fallback to Admin
  const ownerId = (project.owner?._id || project.owner)?.toString();
  if (ownerId && ownerId === uId) {
    return 'Admin';
  }

  if (userGlobalRole === 'Admin') {
    return 'Admin';
  }

  return null;
};

/**
 * Middleware to ensure current user is an authorized member of the project
 * and has one of the allowed roles.
 * @param {Array<string>|string} allowedRoles e.g. ['Admin'], ['Admin', 'Developer', 'Tester'], or [] for any member
 */
export const requireProjectMember = (allowedRoles = []) => {
  // Normalize allowedRoles to an array of valid strings
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : allowedRoles
    ? [allowedRoles]
    : [];

  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId;

      // For issue-level routes, look up the issue FIRST to ensure project context is genuine and untampered
      if (!projectId && (req.params.issueId || req.params.id)) {
        const idToCheck = req.params.issueId || req.params.id;
        const issue = await Issue.findById(idToCheck);
        if (issue) {
          projectId = issue.project;
          req.issue = issue;
        }
      }

      // Fallback to body/query if not an existing resource route (e.g. POST /api/issues)
      if (!projectId) {
        projectId =
          req.body.project ||
          req.body.projectId ||
          req.query.projectId;
      }

      if (!projectId) {
        return res
          .status(400)
          .json({ success: false, message: 'Project context is required' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res
          .status(404)
          .json({ success: false, message: 'Project not found' });
      }

      const role = getUserProjectRole(project, req.user._id, req.user.role);

      if (!role) {
        const isCommentRoute = req.originalUrl && req.originalUrl.includes('comments');
        const message = isCommentRoute
          ? 'Access denied: Conversations and comments for this project are private to the project team and Admins.'
          : 'Access denied: You are not a member of this project';
        return res.status(403).json({
          success: false,
          message,
        });
      }

      // If specific roles are required, ensure the user's role is in the allowed list
      if (rolesArray.length > 0 && !rolesArray.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role '${role}' lacks permission for this action (Requires: ${rolesArray.join(
            ', '
          )})`,
        });
      }

      // Attach project and role to request
      req.project = project;
      req.projectRole = role;
      return next();
    } catch (error) {
      console.error('[Project Role Middleware Error]', error);
      return res
        .status(500)
        .json({ success: false, message: 'Failed to verify project access' });
    }
  };
};
