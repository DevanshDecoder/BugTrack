import Project from '../models/Project.js';
import Issue from '../models/Issue.js';

/**
 * Helper to determine a user's role in a project
 */
export const getUserProjectRole = (project, userId) => {
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

  // 2. If not found in members but is owner, fallback to Admin
  const ownerId = (project.owner?._id || project.owner)?.toString();
  if (ownerId && ownerId === uId) {
    return 'Admin';
  }

  return null;
};

/**
 * Middleware to ensure current user is an authorized member of the project
 * @param {Array<string>} allowedRoles e.g. ['Admin', 'Developer'] or [] for any member
 */
export const requireProjectMember = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      let projectId =
        req.params.projectId ||
        req.body.project ||
        req.body.projectId ||
        req.query.projectId;

      // If no projectId found directly, check if issueId is present
      if (!projectId && (req.params.issueId || req.params.id)) {
        const idToCheck = req.params.issueId || req.params.id;
        const issue = await Issue.findById(idToCheck);
        if (issue) {
          projectId = issue.project;
          req.issue = issue;
        }
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

      const role = getUserProjectRole(project, req.user._id);

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this project',
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role '${role}' lacks permission for this action (Requires: ${allowedRoles.join(
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
