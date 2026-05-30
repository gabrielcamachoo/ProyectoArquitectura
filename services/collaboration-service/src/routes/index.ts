import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/forums', controller.listForums);
router.post('/forums', controller.createForum);
router.get('/forums/:id/posts', controller.listForumPosts);
router.post('/forums/:id/posts', controller.createForumPost);
router.get('/study-groups', controller.listStudyGroups);
router.post('/study-groups', controller.createStudyGroup);
router.get('/tutoring', controller.listTutoring);
router.post('/tutoring', controller.createTutoring);
router.put('/tutoring/:id/status', controller.updateTutoringStatus);

export default router;
