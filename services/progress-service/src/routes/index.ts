import { Router } from 'express';
import * as controller from '../controllers/mainController';
import { authGuard, requireSelfOrRole } from '../middleware/auth';

const router = Router();

// Progress endpoints - students can see their own, teachers/admins can see anyone's
router.get('/progress/student/:studentId/course/:courseId', authGuard, requireSelfOrRole('teacher', 'admin'), controller.courseProgress);
router.get('/progress/student/:studentId', authGuard, requireSelfOrRole('teacher', 'admin'), controller.studentProgress);

export default router;
