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
  .post(requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']), createIssue)
  .get(getIssues); // Read-only visibility for all authenticated users

// Single issue endpoints:
// - View: All authenticated users
// - Edit details: Admin, Developer, Tester, Reporter (assignee restricted to Admin/Reporter)
// - Delete: Admin only
router
  .route('/:id')
  .get(getIssueById)
  .put(requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']), updateIssue)
  .delete(requireProjectMember(['Admin']), deleteIssue);

// Status transition (Kanban): Admin, Developer, Tester (with verification workflow)
router
  .route('/:id/status')
  .patch(requireProjectMember(['Admin', 'Developer', 'Tester']), updateIssueStatus);

// Nested comments for issues (Visible ONLY to project team members and Admins)
router
  .route('/:issueId/comments')
  .post(requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']), addComment)
  .get(requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']), getComments);

router
  .route('/:issueId/comments/:commentId')
  .delete(requireProjectMember(['Admin', 'Developer', 'Tester', 'Reporter']), deleteComment);

export default router;
