import { Response } from 'express';
import { getCourseService, CourseService } from '../services/courseService';
import { AuthRequest } from '../middleware/auth';

export class CourseController {
  private service: CourseService;

  constructor() {
    this.service = getCourseService();
  }

  /**
   * POST /courses
   * Create new course (teacher only)
   */
  async createCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, maxStudents, learningObjectives } = req.body;
      const createdBy = req.userId; // From authGuard

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const course = await this.service.createCourse({
        name,
        description,
        createdBy,
        maxStudents,
        learningObjectives
      });

      res.status(201).json({
        id: course.id,
        name: course.name,
        description: course.description,
        status: course.status,
        totalModules: course.totalModules,
        createdAt: course.createdAt,
        createdBy: course.createdBy
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'course_name_required': 400,
        'course_name_too_long': 400,
        'course_description_too_long': 400,
        'invalid_max_students': 400,
        'creator_id_required': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /courses
   * List courses - filter by status and/or created_by
   */
  async listCourses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, createdBy } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (createdBy) filters.createdBy = createdBy;

      const courses = await this.service.listCourses(filters);

      res.status(200).json({
        courses: courses.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          totalModules: c.totalModules,
          createdBy: c.createdBy,
          createdAt: c.createdAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /courses/enrolled
   * List courses a student is enrolled in
   */
  async listEnrolledCourses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.userId;
      if (!studentId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const courses = await this.service.listStudentCourses(studentId);

      res.status(200).json({
        courses: courses.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          totalModules: c.totalModules,
          createdBy: c.createdBy,
          createdAt: c.createdAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /courses/:courseId/enroll
   * Enroll a student in a course
   */
  async enrollStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.courseId;
      const studentId = req.userId;

      if (!studentId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      await this.service.enrollStudent(courseId, studentId);
      
      // Notify the student
      fetch('http://notification-service:3000/notifications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify({
          userId: studentId,
          type: 'course_enrollment',
          content: { message: 'Te has inscrito exitosamente al curso.' }
        })
      }).catch(err => console.error('Error notifying student:', err));

      res.status(200).json({ ok: true });
    } catch (error: any) {
      const statusCode = error.message === 'course_not_found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /courses/:courseId
   * Get course details with modules and materials
   */
  async getCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const course = await this.service.getCourse(courseId);
      if (!course) {
        res.status(404).json({ error: 'course_not_found' });
        return;
      }
      const modules = await this.service.getModules(courseId);

      // Fetch materials for each module
      const modulesWithMaterials = await Promise.all(
        modules.map(async (m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          status: m.status,
          materials: await this.service.getMaterials(m.id)
        }))
      );

      res.status(200).json({
        id: course.id,
        name: course.name,
        description: course.description,
        status: course.status,
        totalModules: course.totalModules,
        maxStudents: course.maxStudents,
        learningObjectives: course.learningObjectives,
        createdBy: course.createdBy,
        createdAt: course.createdAt,
        modules: modulesWithMaterials
      });
    } catch (error: any) {
      const statusCode = error.message === 'course_not_found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * PUT /courses/:courseId
   * Update course (owner or admin only)
   */
  async updateCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { name, description, maxStudents, learningObjectives } = req.body;
      const updatedBy = req.userId;

      if (!updatedBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const course = await this.service.updateCourse(courseId, {
        name,
        description,
        maxStudents,
        learningObjectives,
        updatedBy
      });

      res.status(200).json({
        id: course.id,
        name: course.name,
        description: course.description,
        status: course.status,
        updatedAt: course.updatedAt
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'course_not_found': 404,
        'course_name_too_long': 400,
        'course_description_too_long': 400,
        'invalid_max_students': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /courses/:courseId/publish
   * Publish course (teacher owner only)
   */
  async publishCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const publishedBy = req.userId;

      if (!publishedBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const course = await this.service.publishCourse(courseId, publishedBy);

      res.status(200).json({
        id: course.id,
        name: course.name,
        status: course.status,
        publishedAt: course.createdAt
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'course_not_found': 404,
        'only_draft_courses_can_publish': 400,
        'publish_failed': 500
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /courses/:courseId/modules
   * Add module to course (teacher owner only)
   */
  async addModule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { title, order } = req.body;
      const createdBy = req.userId;

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const module = await this.service.addModule(courseId, {
        title,
        order,
        createdBy
      });

      res.status(201).json({
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        order: module.order,
        status: module.status
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'course_not_found': 404,
        'module_title_required': 400,
        'module_title_too_long': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /courses/:courseId/modules
   * Get all modules for a course
   */
  async getModules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const modules = await this.service.getModules(courseId);

      res.status(200).json({
        modules: modules.map(m => ({
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          order: m.order,
          status: m.status
        }))
      });
    } catch (error: any) {
      const statusCode = error.message === 'course_not_found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /courses/:courseId/modules/:moduleId/materials
   * Add material to module
   */
  async addMaterial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId, moduleId } = req.params;
      const { title, type, url, visibility } = req.body;
      const createdBy = req.userId;

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const material = await this.service.addMaterial(moduleId, {
        title,
        type,
        url,
        visibility,
        createdBy
      });

      res.status(201).json({
        id: material.id,
        moduleId: material.moduleId,
        title: material.title,
        type: material.type,
        url: material.url,
        visibility: material.visibility
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'module_not_found': 404,
        'material_title_required': 400,
        'material_title_too_long': 400,
        'material_type_required': 400,
        'material_type_invalid': 400,
        'material_url_required': 400,
        'material_url_invalid': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /courses/:courseId/modules/:moduleId/materials
   * Get materials for a module
   */
  async getMaterials(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId, moduleId } = req.params;

      const materials = await this.service.getMaterials(moduleId);

      res.status(200).json({
        materials: materials.map(m => ({
          id: m.id,
          moduleId: m.moduleId,
          title: m.title,
          type: m.type,
          url: m.url,
          visibility: m.visibility
        }))
      });
    } catch (error: any) {
      const statusCode = error.message === 'module_not_found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
}
