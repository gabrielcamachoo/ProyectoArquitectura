import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/analytics/course/:courseId', controller.courseAnalytics);
router.get('/analytics/course/:courseId/students', controller.courseStudentsAnalytics);

export default router;
