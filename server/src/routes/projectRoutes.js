import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  updateMemberRole,
  removeProjectMember,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectMember } from '../middleware/projectRoleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createProject).get(getProjects);

router
  .route('/:projectId')
  .get(getProjectById)
  .put(requireProjectMember(['Admin']), updateProject)
  .delete(requireProjectMember(['Admin']), deleteProject);

// Project member management
router
  .route('/:projectId/members')
  .post(requireProjectMember(['Admin']), addProjectMember);

router
  .route('/:projectId/members/:userId')
  .put(requireProjectMember(['Admin']), updateMemberRole)
  .delete(requireProjectMember(['Admin']), removeProjectMember);

export default router;
