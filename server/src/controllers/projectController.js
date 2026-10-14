import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';
import { getUserProjectRole } from '../middleware/projectRoleMiddleware.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { name, key, description } = req.body;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message: 'Project name and key are required',
      });
    }

    const cleanKey = key.trim().toUpperCase();
    const existingProject = await Project.findOne({ key: cleanKey });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: `Project key '${cleanKey}' is already taken. Please choose another prefix.`,
      });
    }

    const creatorRole = req.body.ownerRole || req.user.role || 'Admin';

    const project = await Project.create({
      name: name.trim(),
      key: cleanKey,
      description: description ? description.trim() : '',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: creatorRole,
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects user belongs to
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    const formatted = projects.map((proj) => {
      const role = getUserProjectRole(proj, userId);
      return {
        ...proj.toObject(),
        currentUserRole: role,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:projectId
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const role = getUserProjectRole(project, req.user._id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        currentUserRole: role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:projectId
// @access  Private (Admin only)
export const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = req.project; // Attached by requireProjectMember

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project and its issues
// @route   DELETE /api/projects/:projectId
// @access  Private (Owner / Admin only)
export const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;

    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString() && req.projectRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete this project',
      });
    }

    // Cascade delete issues, comments, activities
    const issues = await Issue.find({ project: project._id });
    const issueIds = issues.map((i) => i._id);

    await Comment.deleteMany({ issue: { $in: issueIds } });
    await Activity.deleteMany({ project: project._id });
    await Issue.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({
      success: true,
      message: 'Project and all related issues removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:projectId/members
// @access  Private (Admin only)
export const addProjectMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = req.project;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const memberRole = role && ['Admin', 'Developer', 'Reporter'].includes(role) ? role : 'Developer';

    // Check if already a member
    const alreadyMember = project.members.some(
      (m) => m.user && m.user.toString() === userId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    project.members.push({
      user: userId,
      role: memberRole,
    });

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project member's role
// @route   PUT /api/projects/:projectId/members/:userId
// @access  Private (Admin only)
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const project = req.project;

    if (!role || !['Admin', 'Developer', 'Reporter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid role is required' });
    }

    const member = project.members.find(
      (m) => (m.user?._id || m.user)?.toString() === userId.toString()
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in project' });
    }

    member.role = role;
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Admin only)
export const removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;

    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner from the project',
      });
    }

    project.members = project.members.filter(
      (m) => m.user && m.user.toString() !== userId.toString()
    );

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
