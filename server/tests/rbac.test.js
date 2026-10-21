import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { getUserProjectRole, requireProjectMember } from '../src/middleware/projectRoleMiddleware.js';
import { createIssue, updateIssue, updateIssueStatus } from '../src/controllers/issueController.js';
import Project from '../src/models/Project.js';
import Issue from '../src/models/Issue.js';

vi.mock('../src/utils/activityLogger.js', () => ({
  recordActivity: vi.fn().mockResolvedValue(true),
}));

describe('Project Role RBAC Middleware Suite', () => {
  const adminId = new mongoose.Types.ObjectId();
  const developerId = new mongoose.Types.ObjectId();
  const testerId = new mongoose.Types.ObjectId();
  const reporterId = new mongoose.Types.ObjectId();
  const outsiderId = new mongoose.Types.ObjectId();
  const globalAdminId = new mongoose.Types.ObjectId();
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
      { user: testerId, role: 'Tester' },
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

    it('should correctly identify Tester role', () => {
      const role = getUserProjectRole(mockProject, testerId);
      expect(role).toBe('Tester');
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

    it('should fallback to Admin if user has global Admin role', () => {
      const role = getUserProjectRole(mockProject, globalAdminId, 'Admin');
      expect(role).toBe('Admin');
    });

    it('should return null for non-members without global Admin role', () => {
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
        user: { _id: outsiderId, role: 'Developer' },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']);
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

    it('should block non-members on comment routes with private conversation message', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: outsiderId, role: 'Developer' },
        originalUrl: `/api/issues/${issueId}/comments`,
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied: Conversations and comments for this project are private to the project team and Admins.',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow global Admin even if not listed in project members', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: globalAdminId, role: 'Admin' },
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
    });

    it('should block Developer from Admin-only actions with 403 Forbidden', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: developerId, role: 'Developer' },
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

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Role 'Developer' lacks permission for this action"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should block Reporter from Developer/Tester/Admin status actions with 403 Forbidden', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: reporterId, role: 'Reporter' },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Tester']);
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

    it('should allow Tester to proceed on routes accepting Tester role', async () => {
      vi.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { projectId: projectId.toString() },
        user: { _id: testerId, role: 'Tester' },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Tester']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.projectRole).toBe('Tester');
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
        user: { _id: developerId, role: 'Developer' },
        body: {},
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireProjectMember(['Admin', 'Developer', 'Tester']);
      await middleware(req, res, next);

      expect(Issue.findById).toHaveBeenCalledWith(issueId.toString());
      expect(Project.findById).toHaveBeenCalledWith(projectId);
      expect(next).toHaveBeenCalled();
      expect(req.issue).toEqual(mockIssue);
      expect(req.projectRole).toBe('Developer');
    });
  });

  describe('Issue Workflow & Verification Rules', () => {
    it('createIssue should reject assignment if requester is not Admin or Reporter', async () => {
      const req = {
        body: {
          title: 'Bug in checkout',
          assignee: developerId.toString(),
        },
        project: mockProject,
        projectRole: 'Developer',
        user: { _id: developerId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await createIssue(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Only Admins and Reporters can assign team members'),
        })
      );
    });

    it('updateIssueStatus should prevent Developer from closing issues directly', async () => {
      const mockIssue = {
        _id: issueId,
        project: projectId,
        status: 'Resolved',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);

      const req = {
        params: { id: issueId.toString() },
        body: { status: 'Closed' },
        projectRole: 'Developer',
        user: { _id: developerId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await updateIssueStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Developers cannot close issues directly'),
        })
      );
    });

    it('updateIssueStatus should prevent Tester from changing issues that are not Resolved', async () => {
      const mockIssue = {
        _id: issueId,
        project: projectId,
        status: 'In Progress',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);

      const req = {
        params: { id: issueId.toString() },
        body: { status: 'Closed' },
        projectRole: 'Tester',
        user: { _id: testerId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await updateIssueStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Testers can only verify issues that are currently 'Resolved'"),
        })
      );
    });

    it('updateIssueStatus should allow Tester to verify and close Resolved issues', async () => {
      const mockIssue = {
        _id: issueId,
        project: projectId,
        status: 'Resolved',
        save: vi.fn().mockResolvedValue(true),
      };
      const populatedMock = {
        _id: issueId,
        status: 'Closed',
      };
      const queryMock = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve) => resolve(populatedMock),
      };

      vi.spyOn(Issue, 'findById')
        .mockResolvedValueOnce(mockIssue)
        .mockReturnValueOnce(queryMock);

      const req = {
        params: { id: issueId.toString() },
        body: { status: 'Closed' },
        projectRole: 'Tester',
        user: { _id: testerId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await updateIssueStatus(req, res, next);

      expect(mockIssue.status).toBe('Closed');
      expect(mockIssue.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: populatedMock,
        })
      );
    });
  });
});
