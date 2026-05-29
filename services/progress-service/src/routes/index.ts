import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/progress/student/:studentId/course/:courseId', controller.courseProgress);
router.get('/progress/student/:studentId', controller.studentProgress);

export default router;
