import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { RecommendationService } from '../services/recommendationService';
import { authGuard, requireSelfOrRole } from '../middleware/auth';

const router = Router();
const service = new RecommendationService(process.env.REDIS_URL);
const controller = new RecommendationController(service);

// Recommendations - students can see their own, teachers/admins can see anyone's
router.get('/recommendations/student/:studentId', authGuard, requireSelfOrRole('teacher', 'admin'), controller.getByStudent);
router.get('/recommendations/metrics', authGuard, requireSelfOrRole('teacher', 'admin'), controller.getMetrics);

export { service as recommendationService };
export default router;
