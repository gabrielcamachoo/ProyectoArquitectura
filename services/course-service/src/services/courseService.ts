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
   */
  async listCourses(filters?: {
    status?: 'draft' | 'published' | 'archived';
    createdBy?: string;
  }): Promise<Course[]> {
    return this.repo.listCourses(filters);
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
      description: input.description?.trim(),
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
   * Publish a course (only draft courses can be published)
   * Changes status from draft → published
   */
  async publishCourse(courseId: string, publishedBy: string): Promise<Course> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    if (course.status !== 'draft') {
      throw new Error('only_draft_courses_can_publish');
    }

    const published = await this.repo.publishCourse(courseId, publishedBy);
    if (!published) {
      throw new Error('publish_failed');
    }

    console.log(`[CourseService] Course published: ${courseId}`);
    return published;
  }

  /**
   * Archive a course
   */
  async archiveCourse(courseId: string, archivedBy: string): Promise<Course> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    const archived = await this.repo.archiveCourse(courseId, archivedBy);
    if (!archived) {
      throw new Error('archive_failed');
    }

    console.log(`[CourseService] Course archived: ${courseId}`);
    return archived;
  }

  // ============ MODULE SERVICE METHODS ============

  /**
   * Add module to course
   */
  async addModule(courseId: string, input: {
    title: string;
    order?: number;
    createdBy: string;
  }): Promise<ModuleDTO> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('module_title_required');
    }

    if (input.title.length > 255) {
      throw new Error('module_title_too_long');
    }

    // Auto-increment order if not provided
    const modules = await this.repo.listModulesByCourse(courseId);
    const nextOrder = input.order || (modules.length + 1);

    const module = await this.repo.createModule(courseId, {
      title: input.title.trim(),
      order: nextOrder,
      createdBy: input.createdBy
    });

    console.log(`[CourseService] Module created: ${module.id} in course ${courseId}`);
    return module;
  }

  /**
   * Get modules for a course
   */
  async getModules(courseId: string): Promise<ModuleDTO[]> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    const course = await this.repo.getCourse(courseId);
    if (!course) {
      throw new Error('course_not_found');
    }

    return this.repo.listModulesByCourse(courseId);
  }

  /**
   * Update module
   */
  async updateModule(moduleId: string, input: {
    title?: string;
    order?: number;
    status?: 'draft' | 'published' | 'archived';
    updatedBy: string;
  }): Promise<ModuleDTO> {
    if (!moduleId) {
      throw new Error('module_id_required');
    }

    const module = await this.repo.getModule(moduleId);
    if (!module) {
      throw new Error('module_not_found');
    }

    if (input.title && input.title.length > 255) {
      throw new Error('module_title_too_long');
    }

    const updated = await this.repo.updateModule(moduleId, {
      title: input.title?.trim(),
      order: input.order,
      status: input.status,
      updatedBy: input.updatedBy
    });

    if (!updated) {
      throw new Error('module_update_failed');
    }

    console.log(`[CourseService] Module updated: ${moduleId}`);
    return updated;
  }

  /**
   * Delete module and all its materials
   */
  async deleteModule(moduleId: string): Promise<boolean> {
    if (!moduleId) {
      throw new Error('module_id_required');
    }

    const module = await this.repo.getModule(moduleId);
    if (!module) {
      throw new Error('module_not_found');
    }

    const result = await this.repo.deleteModule(moduleId);
    console.log(`[CourseService] Module deleted: ${moduleId}`);
    return result;
  }

  // ============ MATERIAL SERVICE METHODS ============

  /**
   * Add material to module
   */
  async addMaterial(moduleId: string, input: {
    title: string;
    type: string; // 'video' | 'pdf' | 'quiz' | 'document'
    url: string;
    visibility?: 'private' | 'public';
    createdBy: string;
  }): Promise<MaterialDTO> {
    if (!moduleId) {
      throw new Error('module_id_required');
    }

    const module = await this.repo.getModule(moduleId);
    if (!module) {
      throw new Error('module_not_found');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('material_title_required');
    }

    if (input.title.length > 255) {
      throw new Error('material_title_too_long');
    }

    if (!input.type) {
      throw new Error('material_type_required');
    }

    if (!input.url) {
      throw new Error('material_url_required');
    }

    try {
      new URL(input.url);
    } catch {
      throw new Error('material_url_invalid');
    }

    const validTypes = ['video', 'pdf', 'quiz', 'document', 'image', 'audio', 'link'];
    if (!validTypes.includes(input.type)) {
      throw new Error(`material_type_invalid. Valid types: ${validTypes.join(', ')}`);
    }

    const material = await this.repo.createMaterial(moduleId, {
      title: input.title.trim(),
      type: input.type,
      url: input.url,
      visibility: input.visibility || 'private',
      createdBy: input.createdBy
    });

    console.log(`[CourseService] Material created: ${material.id} in module ${moduleId}`);
    return material;
  }

  /**
   * Get materials for a module
   */
  async getMaterials(moduleId: string): Promise<MaterialDTO[]> {
    if (!moduleId) {
      throw new Error('module_id_required');
    }

    const module = await this.repo.getModule(moduleId);
    if (!module) {
      throw new Error('module_not_found');
    }

    return this.repo.listMaterialsByModule(moduleId);
  }

  /**
   * Update material
   */
  async updateMaterial(materialId: string, input: {
    title?: string;
    type?: string;
    url?: string;
    visibility?: 'private' | 'public';
    updatedBy: string;
  }): Promise<MaterialDTO> {
    if (!materialId) {
      throw new Error('material_id_required');
    }

    const material = await this.repo.getMaterial(materialId);
    if (!material) {
      throw new Error('material_not_found');
    }

    if (input.url) {
      try {
        new URL(input.url);
      } catch {
        throw new Error('material_url_invalid');
      }
    }

    const updated = await this.repo.updateMaterial(materialId, {
      title: input.title?.trim(),
      type: input.type,
      url: input.url,
      visibility: input.visibility,
      updatedBy: input.updatedBy
    });

    if (!updated) {
      throw new Error('material_update_failed');
    }

    console.log(`[CourseService] Material updated: ${materialId}`);
    return updated;
  }

  /**
   * Delete material
   */
  async deleteMaterial(materialId: string): Promise<boolean> {
    if (!materialId) {
      throw new Error('material_id_required');
    }

    const material = await this.repo.getMaterial(materialId);
    if (!material) {
      throw new Error('material_not_found');
    }

    const result = await this.repo.deleteMaterial(materialId);
    console.log(`[CourseService] Material deleted: ${materialId}`);
    return result;
  }
}

// Singleton instance
let serviceInstance: CourseService | null = null;

export function getCourseService(): CourseService {
  if (!serviceInstance) {
    serviceInstance = new CourseService();
  }
  return serviceInstance;
}
