import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repositories/userRepository';
import { TokenStore } from '../services/tokenStore';
import { authGuard, requireRole, requireSelfOrRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Instantiate dependencies
const userRepository = new UserRepository();
const tokenStore = new TokenStore(process.env.REDIS_URL);
const authService = new AuthService(userRepository, tokenStore);
const controller = new AuthController(authService);

// Middleware
const guard = authGuard(authService);
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 100, // 100 requests per windowMs (Kong también limita, esto es defensivo)
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/auth/register', authLimiter, controller.register);
router.post('/auth/login', authLimiter, controller.login);
router.post('/auth/refresh', authLimiter, controller.refresh);

// Protected routes
router.post('/auth/logout', authLimiter, guard, controller.logout);
router.get('/auth/user', guard, controller.getCurrentUser);

// Ley 1581 endpoints
router.get(
  '/auth/users/:userId/data',
  authLimiter,
  guard,
  requireSelfOrRole('admin'),
  controller.exportData
);
router.delete(
  '/auth/users/:userId',
  authLimiter,
  guard,
  requireSelfOrRole('admin'),
  controller.deleteUser
);

// Admin only
router.get('/auth/users', authLimiter, guard, requireRole('admin'), controller.listUsers);

export default router;
