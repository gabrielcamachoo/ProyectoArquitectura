import { Router } from 'express';
import * as controller from '../controllers/mainController';

const router = Router();
router.get('/courses', controller.listCourses);
router.post('/courses', controller.createCourse);
router.get('/courses/:id', controller.getCourse);
router.put('/courses/:id', controller.updateCourse);
router.delete('/courses/:id', controller.deleteCourse);
router.get('/courses/:id/modules', controller.listModules);
router.post('/courses/:id/modules', controller.createModule);
router.get('/courses/:id/modules/:moduleId/materials', controller.listMaterials);
router.post('/courses/:id/modules/:moduleId/materials', controller.createMaterial);

export default router;
