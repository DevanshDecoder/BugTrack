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

// Issue collection endpoints
router
  .route('/')
  .post(requireProjectMember(['Admin', 'Developer', 'Reporter']), createIssue)
  .get(requireProjectMember(['Admin', 'Developer', 'Reporter']), getIssues);

// Single issue endpoints with strict RBAC:
// - View: Admin, Developer, Reporter
// - Edit details: Admin, Developer only (Reporters cannot edit)
// - Delete: Admin only (Developers & Reporters cannot delete)
router
  .route('/:id')
  .get(requireProjectMember(['Admin', 'Developer', 'Reporter']), getIssueById)
  .put(requireProjectMember(['Admin', 'Developer']), updateIssue)
  .delete(requireProjectMember(['Admin']), deleteIssue);

// Status transition (Kanban): Admin and Developer only
router
  .route('/:id/status')
  .patch(requireProjectMember(['Admin', 'Developer']), updateIssueStatus);

// Nested comments for issues (All project members can discuss)
router
  .route('/:issueId/comments')
  .post(requireProjectMember(['Admin', 'Developer', 'Reporter']), addComment)
  .get(requireProjectMember(['Admin', 'Developer', 'Reporter']), getComments);

router
  .route('/:issueId/comments/:commentId')
  .delete(requireProjectMember(['Admin', 'Developer', 'Reporter']), deleteComment);

export default router;
