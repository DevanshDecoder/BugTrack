import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { getUserProjectRole, requireProjectMember } from '../src/middleware/projectRoleMiddleware.js';
import Project from '../src/models/Project.js';
import Issue from '../src/models/Issue.js';

describe('Project Role RBAC Middleware Suite', () => {
  const adminId = new mongoose.Types.ObjectId();
  const developerId = new mongoose.Types.ObjectId();
  const reporterId = new mongoose.Types.ObjectId();
  const outsiderId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const issueId = new mongoose.Types.ObjectId();

  const mockProject = {
    _id: projectId,
    name: 'BugTrack Core',
    key: 'BUG',
    owner: adminId,
    members: [
      { user: adminId, role: 'Admin' },
      { user: developerId, role: 'Developer' },
      { user: reporterId, role: 'Reporter' },
    ],
  };

  describe('getUserProjectRole()', () => {
    it('should correctly identify Admin role', () => {
      const role = getUserProjectRole(mockProject, adminId);
      expect(role).toBe('Admin');
    });

    it('should correctly identify Developer role', () => {
      const role = getUserProjectRole(mockProject, developerId);
      expect(role).toBe('Developer');
    });

    it('should correctly identify Reporter role', () => {
      const role = getUserProjectRole(mockProject, reporterId);
      expect(role).toBe('Reporter');
    });

    it('should fallback to Admin if user is owner even if not in members array', () => {
      const projectWithoutOwnerInMembers = {
        _id: projectId,
        owner: adminId,
        members: [],
      };
      const role = getUserProjectRole(projectWithoutOwnerInMembers, adminId);
      expect(role).toBe('Admin');
    });

    it('should return null for non-members', () => {
      const role = getUserProjectRole(mockProject, outsiderId);
      expect(role).toBeNull();
    });

    it('should handle populated user objects inside members correctly', () => {
      const populatedProject = {
        _id: projectId,
        owner: { _id: adminId },
        members: [
          { user: { _id: developerId, name: 'Dev User' }, role: 'Developer' },
        ],
      };
      const role = getUserProjectRole(populatedProject, developerId);
      expect(role).toBe('Developer');
    });
  });

  describe('requireProjectMember() middleware', () => {
    it('should block non-members with 403 Forbidden', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: outsiderId },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Reporter']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied: You are not a member'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should block Developer from Admin-only actions with 403 Forbidden', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: developerId },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      // Admin-only action (e.g. DELETE /api/issues/:id or project member management)
      const middleware = requireProjectMember(['Admin']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Role 'Developer' lacks permission for this action"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should block Reporter from Developer/Admin actions with 403 Forbidden', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: reporterId },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      // Developer/Admin action (e.g. PUT /api/issues/:id or PATCH /api/issues/:id/status)
      const middleware = requireProjectMember(['Admin', 'Developer']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Role 'Reporter' lacks permission for this action"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow Admin to proceed and attach project and role to req', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: adminId },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.projectRole).toBe('Admin');
      expect(req.project).toEqual(mockProject);
    });

    it('should resolve project context from Issue.findById to prevent client project spoofing', async () => {
      const mockIssue = {
        _id: issueId,
        project: projectId,
        title: 'Crash on login',
      };
      vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { id: issueId.toString() },
        user: { _id: developerId },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer']);
      await middleware(req, res, next);

      expect(Issue.findById).toHaveBeenCalledWith(issueId.toString());
      expect(Project.findById).toHaveBeenCalledWith(projectId);
      expect(next).toHaveBeenCalled();
      expect(req.issue).toEqual(mockIssue);
      expect(req.projectRole).toBe('Developer');
    });
  });
});
