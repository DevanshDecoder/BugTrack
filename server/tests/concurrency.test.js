import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Issue from '../src/models/Issue.js';
import { updateIssue, updateIssueStatus } from '../src/controllers/issueController.js';

vi.mock('../src/utils/activityLogger.js', () => ({
  recordActivity: vi.fn().mockResolvedValue(true),
}));

describe('Optimistic Concurrency Control (OCC) & Conflict Resolution Suite', () => {
  const adminId = new mongoose.Types.ObjectId();
  const developerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const issueId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1: Update with matching version succeeds and allows sequential modification', async () => {
    const mockIssue = {
      _id: issueId,
      project: projectId,
      title: 'Initial Title',
      status: 'Open',
      __v: 0,
      save: vi.fn().mockResolvedValue(true),
    };

    const populatedMock = {
      _id: issueId,
      title: 'Updated Title',
      status: 'Open',
      __v: 1,
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
      body: { title: 'Updated Title', version: 0 },
      projectRole: 'Developer',
      user: { _id: developerId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await updateIssue(req, res, next);

    expect(mockIssue.title).toBe('Updated Title');
    expect(mockIssue.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: populatedMock,
      })
    );
  });

  it('Scenario 2: Concurrent update with stale version is rejected with HTTP 409 Conflict', async () => {
    // Current database document is already at version 1 (due to another user saving first)
    const mockIssue = {
      _id: issueId,
      project: projectId,
      title: 'Current DB Title',
      status: 'Open',
      __v: 1,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);

    // Stale client sending version 0
    const req = {
      params: { id: issueId.toString() },
      body: { title: 'Overwriting Title', version: 0 },
      projectRole: 'Developer',
      user: { _id: developerId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await updateIssue(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        conflict: true,
        currentVersion: 1,
        message: expect.stringContaining('Conflict detected: This issue was modified by another user'),
      })
    );
    expect(mockIssue.save).not.toHaveBeenCalled();
  });

  it('Scenario 3: Concurrent status transition conflict on Kanban board is intercepted with 409', async () => {
    // Server has advanced to __v: 2
    const mockIssue = {
      _id: issueId,
      project: projectId,
      status: 'In Progress',
      __v: 2,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);

    // Second developer drags card using stale version 1
    const req = {
      params: { id: issueId.toString() },
      body: { status: 'Resolved', version: 1 },
      projectRole: 'Developer',
      user: { _id: developerId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await updateIssueStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        conflict: true,
        currentVersion: 2,
        message: expect.stringContaining('Conflict detected'),
      })
    );
    expect(mockIssue.save).not.toHaveBeenCalled();
  });

  it('Scenario 4: Native Mongoose VersionError during save is handled as HTTP 409 Conflict', async () => {
    const versionError = new Error('No matching document found for id');
    versionError.name = 'VersionError';

    const mockIssue = {
      _id: issueId,
      project: projectId,
      status: 'Open',
      __v: 0,
      save: vi.fn().mockRejectedValue(versionError),
    };

    vi.spyOn(Issue, 'findById').mockResolvedValue(mockIssue);

    const req = {
      params: { id: issueId.toString() },
      body: { status: 'In Progress' },
      projectRole: 'Developer',
      user: { _id: developerId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await updateIssueStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        conflict: true,
        message: expect.stringContaining('Concurrent update detected'),
      })
    );
  });

  it('Scenario 5: Conflict recovery workflow allows updated version to persist without data loss', async () => {
    // Step 1: Client refreshes issue after conflict and obtains version 2
    const freshIssue = {
      _id: issueId,
      project: projectId,
      title: 'Current DB Title',
      status: 'In Progress',
      __v: 2,
      save: vi.fn().mockResolvedValue(true),
    };

    const resolvedMock = {
      _id: issueId,
      title: 'Current DB Title',
      status: 'Resolved',
      __v: 3,
    };

    const queryMock = {
      populate: vi.fn().mockReturnThis(),
      then: (resolve) => resolve(resolvedMock),
    };

    vi.spyOn(Issue, 'findById')
      .mockResolvedValueOnce(freshIssue)
      .mockReturnValueOnce(queryMock);

    // Step 2: Client resubmits with current version 2
    const req = {
      params: { id: issueId.toString() },
      body: { status: 'Resolved', version: 2 },
      projectRole: 'Developer',
      user: { _id: developerId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await updateIssueStatus(req, res, next);

    expect(freshIssue.status).toBe('Resolved');
    expect(freshIssue.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: resolvedMock,
      })
    );
  });
});
