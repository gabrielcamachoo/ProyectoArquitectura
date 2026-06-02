import { Response } from 'express';
import { AuthRequest } from '@proyecto/shared-core/auth';
import { getCourseService, CourseService } from '../services/courseService';

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
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /courses/:courseId
   * Get course by ID
   */
  async getCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const course = await this.service.getCourse(courseId);

      if (!course) {
        res.status(404).json({ error: 'course_not_found' });
        return;
      }

      res.status(200).json(course);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /courses
   * List all courses with optional filters
   */
  async listCourses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '10' } = req.query;

      const filters: any = {};
      if (status) filters.status = status;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.service.listCourses(filters, pageNum, limitNum);

      res.status(200).json({
        courses: result.courses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * PUT /courses/:courseId
   * Update course (owner or admin only)
   */
  async updateCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const updates = req.body;
      const updatedBy = req.userId;

      if (!updatedBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const course = await this.service.updateCourse(courseId, {
        ...updates,
        updatedBy
      });

      if (!course) {
        res.status(404).json({ error: 'course_not_found' });
        return;
      }

      res.status(200).json(course);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /courses/:courseId/publish
   * Publish course (owner or admin only)
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

      if (!course) {
        res.status(404).json({ error: 'course_not_found' });
        return;
      }

      res.status(200).json({
        message: 'Course published successfully',
        course
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /courses/:courseId/modules
   * Get course modules
   */
  async getModules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const modules = await this.service.getModules(courseId);

      res.status(200).json({ modules });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /courses/:courseId/modules
   * Add module to course
   */
  async addModule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const moduleData = req.body;
      const createdBy = req.userId;

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const module = await this.service.addModule(courseId, moduleData, createdBy);

      res.status(201).json(module);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /courses/:courseId/modules/:moduleId/materials
   * Get module materials
   */
  async getMaterials(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId, moduleId } = req.params;

      const materials = await this.service.getMaterials(courseId, moduleId);

      res.status(200).json({ materials });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /courses/:courseId/modules/:moduleId/materials
   * Add material to module
   */
  async addMaterial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId, moduleId } = req.params;
      const materialData = req.body;
      const createdBy = req.userId;

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const material = await this.service.addMaterial(courseId, moduleId, materialData, createdBy);

      res.status(201).json(material);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }
}
