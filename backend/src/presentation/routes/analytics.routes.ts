import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { Role } from '../../domain/enums';

const router = Router();

// All routes require authentication and ADMIN/MANAGER role
router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.MANAGER));

/**
 * @swagger
 * /api/analytics/overdue:
 *   get:
 *     summary: Get overdue tasks count per user (ADMIN/MANAGER only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue tasks analytics retrieved successfully
 */
router.get('/overdue', analyticsController.getOverdueTasks);

/**
 * @swagger
 * /api/analytics/completion:
 *   get:
 *     summary: Get average completion time (ADMIN/MANAGER only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completion time analytics retrieved successfully
 */
router.get('/completion', analyticsController.getAverageCompletionTime);

export default router;
