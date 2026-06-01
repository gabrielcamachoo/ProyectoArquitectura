import { Router } from 'express';
import * as controller from '../controllers/mainController';
import { authGuard, requireSelfOrRole } from '../middleware/auth';

const router = Router();

// Notification endpoints - users can see their own, admins can see anyone's
router.post('/notifications', authGuard, controller.createNotificationHttp);
router.get('/notifications/user/:userId', authGuard, requireSelfOrRole('admin'), controller.listNotifications);
// Alias for demo script contract
router.get('/notifications/student/:userId', authGuard, requireSelfOrRole('admin'), controller.listNotifications);
router.put('/notifications/:id/read', authGuard, controller.markRead);

export default router;
