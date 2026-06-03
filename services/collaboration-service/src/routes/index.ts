import { Router } from 'express';
import * as controller from '../controllers/mainController';
import { authGuard } from '../middleware/auth';

const router = Router();

// All collaboration endpoints require authentication
router.get('/forums', authGuard, controller.listForums);
router.post('/forums', authGuard, controller.createForum);
router.get('/forums/:id/posts', authGuard, controller.listForumPosts);
router.post('/forums/:id/posts', authGuard, controller.createForumPost);
router.get('/study-groups', authGuard, controller.listStudyGroups);
router.post('/study-groups', authGuard, controller.createStudyGroup);
router.get('/tutoring', authGuard, controller.listTutoring);
router.post('/tutoring', authGuard, controller.createTutoring);
router.get('/tutoring/match', authGuard, controller.matchTutoringByTopic);
router.put('/tutoring/:id/status', authGuard, controller.updateTutoringStatus);

export default router;
