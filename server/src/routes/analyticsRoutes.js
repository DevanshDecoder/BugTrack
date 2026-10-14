import express from 'express';
import {
  getProjectAnalytics,
  getIssueActivities,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectMember } from '../middleware/projectRoleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', requireProjectMember(), getProjectAnalytics);
router.get('/issues/:issueId/activities', requireProjectMember(), getIssueActivities);

export default router;
