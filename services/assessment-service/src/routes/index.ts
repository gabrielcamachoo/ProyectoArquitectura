import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authGuard, requireRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new AssessmentController();

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});

// ============ EVALUATION ENDPOINTS ============

// GET /courses/:courseId/evaluations - List evaluations (teacher/admin only)
router.get('/courses/:courseId/evaluations', limiter, authGuard, requireRole('teacher', 'admin'), controller.listEvaluations.bind(controller));

// GET /evaluations/:evaluationId - Get evaluation details (teacher/admin)
router.get('/evaluations/:evaluationId', limiter, authGuard, requireRole('teacher', 'admin'), controller.getEvaluation.bind(controller));

// POST /evaluations - Create evaluation (teacher/admin only)
router.post('/evaluations', limiter, authGuard, requireRole('teacher', 'admin'), controller.createEvaluation.bind(controller));

// POST /evaluations/:evaluationId/publish - Publish evaluation (teacher/admin)
router.post('/evaluations/:evaluationId/publish', limiter, authGuard, requireRole('teacher', 'admin'), controller.publishEvaluation.bind(controller));

// ============ ATTEMPT ENDPOINTS ============

// POST /evaluations/:evaluationId/attempts - Create attempt (student only)
router.post('/evaluations/:evaluationId/attempts', limiter, authGuard, requireRole('student'), controller.createAttempt.bind(controller));

// POST /attempts/:attemptId/start - Start attempt (student)
router.post('/attempts/:attemptId/start', limiter, authGuard, requireRole('student'), controller.startAttempt.bind(controller));

// POST /attempts/:attemptId/submit - Submit attempt (student)
router.post('/attempts/:attemptId/submit', limiter, authGuard, requireRole('student'), controller.submitAttempt.bind(controller));

// ============ GRADING ENDPOINTS (CRITICAL <2s DR-01) ============

// POST /attempts/:attemptId/grade - Grade attempt (teacher/admin) - MUST be <2s response
router.post('/attempts/:attemptId/grade', limiter, authGuard, requireRole('teacher', 'admin'), controller.gradeAttempt.bind(controller));

// PUT /grades/:gradeId - Update grade manually (teacher/admin)
router.put('/grades/:gradeId', limiter, authGuard, requireRole('teacher', 'admin'), controller.updateGrade.bind(controller));

export default router;
