import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { RecommendationService } from '../services/recommendationService';

const router = Router();
const service = new RecommendationService(process.env.REDIS_URL);
const controller = new RecommendationController(service);

router.get('/recommendations/student/:studentId', controller.getByStudent);

export { service as recommendationService };
export default router;
