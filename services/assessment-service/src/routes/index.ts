import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/evaluations', controller.listEvaluations);
router.post('/evaluations', controller.createEvaluation);
router.get('/evaluations/:id', controller.getEvaluation);
router.post('/evaluations/:id/attempts', controller.startAttempt);
router.put('/attempts/:id/submit', controller.submitAttempt);
router.put('/attempts/:id/grade', controller.gradeAttempt);

export default router;
