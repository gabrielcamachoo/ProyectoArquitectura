import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/notifications/user/:userId', controller.listNotifications);
router.put('/notifications/:id/read', controller.markRead);

export default router;
