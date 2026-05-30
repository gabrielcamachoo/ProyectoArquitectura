import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repositories/userRepository';
import { TokenStore } from '../services/tokenStore';
import { authGuard, requireRole, requireSelfOrRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const authService = new AuthService(new UserRepository(), new TokenStore(process.env.REDIS_URL));
const controller = new AuthController(authService);
const guard = authGuard(authService);
const authLimiter = rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });

router.post('/auth/register', authLimiter, controller.register);
router.post('/auth/login', authLimiter, controller.login);
router.post('/auth/refresh', authLimiter, controller.refresh);
router.post('/auth/logout', authLimiter, guard, controller.logout);
router.get('/users', authLimiter, guard, requireRole('admin'), controller.listUsers);
router.get('/users/:id/data', authLimiter, guard, requireSelfOrRole('admin'), controller.exportData);
router.delete('/users/:id', authLimiter, guard, requireSelfOrRole('admin'), controller.suppress);

export default router;
