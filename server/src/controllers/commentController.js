import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import { recordActivity } from '../utils/activityLogger.js';

// @desc    Add comment to an issue
// @route   POST /api/issues/:issueId/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { body } = req.body;
    const { issueId } = req.params;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const comment = await Comment.create({
      issue: issueId,
      author: req.user._id,
      body: body.trim(),
    });

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name email avatar'
    );

    await recordActivity({
      issueId: issue._id,
      projectId: issue.project,
      actorId: req.user._id,
      action: 'commented',
      details: `commented: "${body.trim().substring(0, 60)}${body.length > 60 ? '...' : ''}"`,
    });

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for an issue
// @route   GET /api/issues/:issueId/comments
// @access  Private
export const getComments = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const comments = await Comment.find({ issue: issueId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/issues/:issueId/comments/:commentId
// @access  Private (Author or Project Admin)
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.projectRole === 'Admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments unless you are a Project Admin',
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
