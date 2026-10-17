import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';
import { recordActivity } from '../utils/activityLogger.js';

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private (Admin, Developer, Reporter)
export const createIssue = async (req, res, next) => {
  try {
    const { title, description, priority, status, assignee, dueDate, tags } = req.body;
    const project = req.project;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Issue title is required' });
    }

    // Atomically increment issueCounter for sequential issueKey (e.g., BUG-1, BUG-2)
    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $inc: { issueCounter: 1 } },
      { new: true }
    );

    const issueKey = `${updatedProject.key}-${updatedProject.issueCounter}`;

    const issue = await Issue.create({
      issueKey,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'Medium',
      status: status || 'Open',
      project: project._id,
      reporter: req.user._id,
      assignee: assignee || null,
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : [],
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'name key');

    // Record activity
    await recordActivity({
      issueId: issue._id,
      projectId: project._id,
      actorId: req.user._id,
      action: 'created',
      details: `Created issue ${issueKey}: "${issue.title}"`,
    });

    res.status(201).json({
      success: true,
      data: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get issues with filtering, searching, and sorting
// @route   GET /api/issues
// @access  Private
export const getIssues = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, reporter, search, sort } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const query = { project: projectId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (assignee) {
      if (assignee === 'unassigned') {
        query.assignee = null;
      } else {
        query.assignee = assignee;
      }
    }

    if (reporter) {
      query.reporter = reporter;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { issueKey: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'priority') {
      // Handled or default sort
      sortOption = { priority: 1, createdAt: -1 };
    }
    if (sort === 'updated') sortOption = { updatedAt: -1 };

    const issues = await Issue.find(query)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'name key')
      .sort(sortOption);

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Private
export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'name key members owner');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue details
// @route   PUT /api/issues/:id
// @access  Private (Admin, Developer)
export const updateIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Role check: Only Admin and Developer can edit issue details
    if (!['Admin', 'Developer'].includes(req.projectRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Project Admins and Developers can update issue details',
      });
    }

    const { title, description, priority, status, assignee, dueDate, tags } = req.body;

    // Track changes for activity log
    const changes = [];

    if (status && status !== issue.status) {
      changes.push({
        action: 'status_changed',
        field: 'status',
        oldValue: issue.status,
        newValue: status,
        details: `changed status from ${issue.status} to ${status}`,
      });
      issue.status = status;
    }

    if (priority && priority !== issue.priority) {
      changes.push({
        action: 'priority_changed',
        field: 'priority',
        oldValue: issue.priority,
        newValue: priority,
        details: `changed priority from ${issue.priority} to ${priority}`,
      });
      issue.priority = priority;
    }

    if (assignee !== undefined) {
      const oldAssigneeId = issue.assignee ? issue.assignee.toString() : 'None';
      const newAssigneeId = assignee ? assignee.toString() : 'None';

      if (oldAssigneeId !== newAssigneeId) {
        let newAssigneeName = 'Unassigned';
        if (assignee) {
          const userObj = await User.findById(assignee);
          if (userObj) newAssigneeName = userObj.name;
        }

        changes.push({
          action: 'assigned',
          field: 'assignee',
          oldValue: oldAssigneeId,
          newValue: newAssigneeId,
          details: `assigned issue to ${newAssigneeName}`,
        });
        issue.assignee = assignee || null;
      }
    }

    if (title && title !== issue.title) {
      issue.title = title.trim();
    }

    if (description !== undefined && description !== issue.description) {
      issue.description = description.trim();
    }

    if (dueDate !== undefined) {
      issue.dueDate = dueDate || null;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      issue.tags = tags;
    }

    await issue.save();

    // Log all activities
    for (const c of changes) {
      await recordActivity({
        issueId: issue._id,
        projectId: issue.project,
        actorId: req.user._id,
        action: c.action,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        details: c.details,
      });
    }

    if (changes.length === 0) {
      await recordActivity({
        issueId: issue._id,
        projectId: issue.project,
        actorId: req.user._id,
        action: 'updated',
        details: 'Updated issue details',
      });
    }

    const updatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'name key');

    res.json({
      success: true,
      data: updatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick status change (ideal for Kanban drag & drop)
// @route   PATCH /api/issues/:id/status
// @access  Private (Admin, Developer)
export const updateIssueStatus = async (req, res, next) => {
  try {
    if (!['Admin', 'Developer'].includes(req.projectRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Project Admins and Developers can update issue status',
      });
    }

    const { status } = req.body;
    if (!status || !['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const oldStatus = issue.status;
    if (oldStatus === status) {
      return res.json({ success: true, data: issue });
    }

    issue.status = status;
    await issue.save();

    await recordActivity({
      issueId: issue._id,
      projectId: issue.project,
      actorId: req.user._id,
      action: 'status_changed',
      field: 'status',
      oldValue: oldStatus,
      newValue: status,
      details: `moved status from ${oldStatus} to ${status}`,
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'name key');

    res.json({
      success: true,
      data: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an issue
// @route   DELETE /api/issues/:id
// @access  Private (Admin only)
export const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (req.projectRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Project Admins can delete issues',
      });
    }

    await Comment.deleteMany({ issue: issue._id });
    await Activity.deleteMany({ issue: issue._id });
    await Issue.findByIdAndDelete(issue._id);

    res.json({
      success: true,
      message: `Issue ${issue.issueKey} removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};
