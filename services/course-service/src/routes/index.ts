import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authGuard, requireRole } from '@proyecto/shared-core/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new CourseController();

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});

// ============ COURSE ENDPOINTS ============

// GET /courses - List all courses (public, optional filter by status)
router.get('/courses', limiter, controller.listCourses.bind(controller));

// GET /courses/:courseId - Get course details (public)
router.get('/courses/:courseId', limiter, controller.getCourse.bind(controller));

// POST /courses - Create course (teacher/admin only)
router.post('/courses', limiter, authGuard, requireRole('teacher', 'admin'), controller.createCourse.bind(controller));

// PUT /courses/:courseId - Update course (owner or admin only)
router.put('/courses/:courseId', limiter, authGuard, requireRole('teacher', 'admin'), controller.updateCourse.bind(controller));

// POST /courses/:courseId/publish - Publish course (owner or admin only)
router.post('/courses/:courseId/publish', limiter, authGuard, requireRole('teacher', 'admin'), controller.publishCourse.bind(controller));

// ============ MODULE ENDPOINTS ============

// GET /courses/:courseId/modules - List modules (public)
router.get('/courses/:courseId/modules', limiter, controller.getModules.bind(controller));

// POST /courses/:courseId/modules - Add module (owner or admin only)
router.post('/courses/:courseId/modules', limiter, authGuard, requireRole('teacher', 'admin'), controller.addModule.bind(controller));

// ============ MATERIAL ENDPOINTS ============

// GET /courses/:courseId/modules/:moduleId/materials - List materials (public)
router.get('/courses/:courseId/modules/:moduleId/materials', limiter, controller.getMaterials.bind(controller));

// POST /courses/:courseId/modules/:moduleId/materials - Add material (owner or admin only)
router.post('/courses/:courseId/modules/:moduleId/materials', limiter, authGuard, requireRole('teacher', 'admin'), controller.addMaterial.bind(controller));

export default router;
