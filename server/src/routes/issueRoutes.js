import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
} from '../controllers/issueController.js';
import {
  addComment,
  getComments,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectMember } from '../middleware/projectRoleMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(requireProjectMember(['Admin', 'Developer', 'Reporter']), createIssue)
  .get(requireProjectMember(), getIssues);

router
  .route('/:id')
  .get(getIssueById)
  .put(requireProjectMember(['Admin', 'Developer', 'Reporter']), updateIssue)
  .delete(requireProjectMember(['Admin', 'Reporter']), deleteIssue);

router
  .route('/:id/status')
  .patch(requireProjectMember(['Admin', 'Developer']), updateIssueStatus);

// Nested comments for issues
router
  .route('/:issueId/comments')
  .post(requireProjectMember(), addComment)
  .get(requireProjectMember(), getComments);

router
  .route('/:issueId/comments/:commentId')
  .delete(requireProjectMember(), deleteComment);

export default router;
