import { getCourseRepository, CourseRepository } from '../repositories/courseRepository';
import { Course, CreateCourseInput, ModuleDTO, MaterialDTO } from '../repositories/TypeORMCourseRepository';

/**
 * CourseService - Business logic for course management
 * Handles validations, Ley 1581 compliance, audit trails
 */
export class CourseService {
  private repo: CourseRepository;

  constructor() {
    this.repo = getCourseRepository();
  }

  // ============ COURSE SERVICE METHODS ============

  /**
   * Create a new course
   * @throws Error if validation fails
   */
  async createCourse(input: {
    name: string;
    description?: string;
    createdBy: string;
    maxStudents?: number;
    learningObjectives?: string;
  }): Promise<Course> {
    // Validations
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('course_name_required');
    }

    if (input.name.length > 255) {
      throw new Error('course_name_too_long');
    }

    if (input.description && input.description.length > 5000) {
      throw new Error('course_description_too_long');
    }

    if (input.maxStudents && input.maxStudents < 1) {
      throw new Error('invalid_max_students');
    }

    if (!input.createdBy) {
      throw new Error('creator_id_required');
    }

    const courseInput: CreateCourseInput = {
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      createdBy: input.createdBy,
      maxStudents: input.maxStudents,
      learningObjectives: input.learningObjectives
    };

    const course = await this.repo.createCourse(courseInput);
    console.log(`[CourseService] Course created: ${course.id} by ${input.createdBy}`);
    return course;
  }

  /**
   * Get course by ID with all details (modules, materials)
   */
  async getCourse(courseId: string): Promise<Course | null> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    return course;
  }

  /**
   * List courses - filter by status and/or teacher
   * Returns paginated results
   */
  async listCourses(
    filters?: { status?: 'draft' | 'published' | 'archived'; createdBy?: string },
    page?: number,
    limit?: number
  ): Promise<{ courses: Course[]; total: number }> {
    const allCourses = await this.repo.listCourses(filters);
    
    // If pagination is requested
    if (page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCourses = allCourses.slice(startIndex, endIndex);
      
      return {
        courses: paginatedCourses,
        total: allCourses.length
      };
    }
    
    // Return all courses if no pagination
    return {
      courses: allCourses,
      total: allCourses.length
    };
  }

  /**
   * Update course details
   * Only owner or admin can update
   */
  async updateCourse(courseId: string, input: {
    name?: string;
    description?: string;
    maxStudents?: number;
    learningObjectives?: string;
    updatedBy: string;
  }): Promise<Course> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    if (input.name && input.name.length > 255) {
      throw new Error('course_name_too_long');
    }

    if (input.description && input.description.length > 5000) {
      throw new Error('course_description_too_long');
    }

    if (input.maxStudents && input.maxStudents < 1) {
      throw new Error('invalid_max_students');
    }

    const updated = await this.repo.updateCourse(courseId, {
      name: input.name?.trim(),
      description: input.description || undefined,
      maxStudents: input.maxStudents,
      learningObjectives: input.learningObjectives,
      updatedBy: input.updatedBy
    });

    if (!updated) {
      throw new Error('update_failed');
    }

    console.log(`[CourseService] Course updated: ${courseId} by ${input.updatedBy}`);
    return updated;
  }

  /**
   * Publish course - changes status to 'published'
   * Only owner or admin can publish
   */
  async publishCourse(courseId: string, publishedBy: string): Promise<Course> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    if (!publishedBy) {
      throw new Error('publisher_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    // Can only publish if status is 'draft'
    if (course.status !== 'draft') {
      throw new Error('course_not_draft');
    }

    const published = await this.repo.publishCourse(courseId, publishedBy);
    if (!published) {
      throw new Error('publish_failed');
    }

    console.log(`[CourseService] Course published: ${courseId} by ${publishedBy}`);
    return published;
  }

  // ============ MODULE SERVICE METHODS ============

  /**
   * Get all modules for a course
   */
  async getModules(courseId: string): Promise<ModuleDTO[]> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    return this.repo.getModules(courseId);
  }

  /**
   * Add module to course
   */
  async addModule(courseId: string, moduleData: {
    title: string;
    description?: string;
    order?: number;
  }, createdBy: string): Promise<ModuleDTO> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    if (!moduleData.title || moduleData.title.trim().length === 0) {
      throw new Error('module_title_required');
    }

    return this.repo.addModule(courseId, moduleData, createdBy);
  }

  // ============ MATERIAL SERVICE METHODS ============

  /**
   * Get all materials for a module
   */
  async getMaterials(courseId: string, moduleId: string): Promise<MaterialDTO[]> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    if (!moduleId) {
      throw new Error('module_id_required');
    }

    return this.repo.getMaterials(courseId, moduleId);
  }

  /**
   * Add material to module
   */
  async addMaterial(courseId: string, moduleId: string, materialData: {
    title: string;
    type: 'video' | 'document' | 'quiz' | 'assignment';
    content: string;
    url?: string;
  }, createdBy: string): Promise<MaterialDTO> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    if (!moduleId) {
      throw new Error('module_id_required');
    }

    if (!materialData.title || materialData.title.trim().length === 0) {
      throw new Error('material_title_required');
    }

    if (!materialData.type) {
      throw new Error('material_type_required');
    }

    const validTypes = ['video', 'document', 'quiz', 'assignment'];
    if (!validTypes.includes(materialData.type)) {
      throw new Error('invalid_material_type');
    }

    return this.repo.addMaterial(courseId, moduleId, materialData, createdBy);
  }
}

// Singleton instance
let courseServiceInstance: CourseService | null = null;

export function getCourseService(): CourseService {
  if (!courseServiceInstance) {
    courseServiceInstance = new CourseService();
  }
  return courseServiceInstance;
}

// For testing
export function resetCourseService(): void {
  courseServiceInstance = null;
}
