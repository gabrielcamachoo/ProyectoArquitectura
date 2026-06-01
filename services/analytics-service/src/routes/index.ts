import { Router } from 'express';
import * as controller from '../controllers/mainController';
import { authGuard, requireRole } from '../middleware/auth';

const router = Router();

// Analytics endpoints - only teachers and admins can access
router.get('/analytics/course/:courseId', authGuard, requireRole('teacher', 'admin'), controller.courseAnalytics);
router.get('/analytics/course/:courseId/students', authGuard, requireRole('teacher', 'admin'), controller.courseStudentsAnalytics);

export default router;
