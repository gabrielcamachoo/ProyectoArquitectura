import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repositories/userRepository';
import { TokenStore } from '../services/tokenStore';
import { authGuard, requireRole } from '../middleware/auth';

const router = Router();
const authService = new AuthService(new UserRepository(), new TokenStore(process.env.REDIS_URL));
const controller = new AuthController(authService);
const guard = authGuard(authService);

router.post('/auth/register', controller.register);
router.post('/auth/login', controller.login);
router.post('/auth/refresh', controller.refresh);
router.post('/auth/logout', guard, controller.logout);
router.get('/users/:id/data', guard, requireRole('admin'), controller.exportData);
router.delete('/users/:id', guard, requireRole('admin'), controller.suppress);

export default router;
