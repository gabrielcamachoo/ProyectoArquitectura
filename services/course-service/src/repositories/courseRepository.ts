import { TypeORMCourseRepository, Course, CreateCourseInput, ModuleDTO, MaterialDTO } from './TypeORMCourseRepository';
import { AppDataSource } from './dataSource';

/**
 * Hybrid course repository - PostgreSQL primary + in-memory fallback
 */
export class CourseRepository {
  private typeormRepo: TypeORMCourseRepository;
  private inMemoryCourses = new Map<string, Course>();
  private inMemoryModules = new Map<string, ModuleDTO>();
  private inMemoryMaterials = new Map<string, MaterialDTO>();
  private inMemoryEnrollments = new Map<string, Set<string>>(); // studentId -> Set<courseId>

  private get usePostgres(): boolean {
    return AppDataSource.isInitialized;
  }

  constructor() {
    this.typeormRepo = new TypeORMCourseRepository();
  }

  // ============ COURSE METHODS ============
  async createCourse(input: CreateCourseInput): Promise<Course> {
    if (this.usePostgres) {
      return this.typeormRepo.createCourse(input);
    }

    const course: Course = {
      id: this.generateId(),
      name: input.name,
      description: input.description || null,
      createdBy: input.createdBy,
      status: 'draft',
      totalModules: 0,
      maxStudents: input.maxStudents || null,
      learningObjectives: input.learningObjectives || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.inMemoryCourses.set(course.id, course);
    return course;
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getCourse(id);
    }
    return this.inMemoryCourses.get(id) || null;
  }

  // ============ ENROLLMENT METHODS ============
  async enrollStudent(courseId: string, studentId: string): Promise<void> {
    if (this.usePostgres) {
      return this.typeormRepo.enrollStudent(courseId, studentId);
    }
    if (!this.inMemoryEnrollments.has(studentId)) {
      this.inMemoryEnrollments.set(studentId, new Set());
    }
    this.inMemoryEnrollments.get(studentId)!.add(courseId);
  }

  async listStudentCourses(studentId: string): Promise<Course[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listStudentCourses(studentId);
    }
    const courseIds = this.inMemoryEnrollments.get(studentId) || new Set();
    const courses: Course[] = [];
    for (const cid of courseIds) {
      const c = this.inMemoryCourses.get(cid);
      if (c) courses.push(c);
    }
    return courses;
  }

  async listCourses(filter?: { status?: string; createdBy?: string }): Promise<Course[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listCourses(filter);
    }

    let courses = Array.from(this.inMemoryCourses.values());
    
    if (filter?.status) {
      courses = courses.filter(c => c.status === filter.status);
    }
    if (filter?.createdBy) {
      courses = courses.filter(c => c.createdBy === filter.createdBy);
    }

    return courses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateCourse(id: string, data: { name?: string; description?: string; maxStudents?: number; learningObjectives?: string; updatedBy?: string }): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.updateCourse(id, data);
    }

    const course = this.inMemoryCourses.get(id);
    if (!course) return null;

    if (data.name) course.name = data.name;
    if (data.description !== undefined) course.description = data.description;
    if (data.maxStudents !== undefined) course.maxStudents = data.maxStudents;
    if (data.learningObjectives !== undefined) course.learningObjectives = data.learningObjectives;

    course.updatedAt = new Date();
    return course;
  }

  async publishCourse(id: string, publishedBy: string): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.publishCourse(id, publishedBy);
    }

    const course = this.inMemoryCourses.get(id);
    if (!course) return null;

    course.status = 'published';
    course.updatedAt = new Date();
    return course;
  }

  async archiveCourse(id: string, archivedBy: string): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.archiveCourse(id, archivedBy);
    }

    const course = this.inMemoryCourses.get(id);
    if (!course) return null;

    course.status = 'archived';
    course.updatedAt = new Date();
    return course;
  }

  async deleteCourse(id: string): Promise<boolean> {
    if (this.usePostgres) {
      return this.typeormRepo.deleteCourse(id);
    }

    this.inMemoryCourses.delete(id);
    return true;
  }

  // ============ MODULE METHODS ============
  async createModule(courseId: string, data: { title: string; order: number; createdBy: string }): Promise<ModuleDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createModule(courseId, data);
    }

    const module: ModuleDTO = {
      id: this.generateId(),
      courseId,
      title: data.title,
      order: data.order,
      status: 'draft'
    };

    this.inMemoryModules.set(module.id, module);

    // Update course totalModules
    const course = this.inMemoryCourses.get(courseId);
    if (course) {
      course.totalModules = (course.totalModules || 0) + 1;
    }

    return module;
  }

  async getModule(moduleId: string): Promise<ModuleDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getModule(moduleId);
    }
    return this.inMemoryModules.get(moduleId) || null;
  }

  async listModulesByCourse(courseId: string): Promise<ModuleDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listModulesByCourse(courseId);
    }

    const modules = Array.from(this.inMemoryModules.values())
      .filter(m => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    return modules;
  }

  async updateModule(moduleId: string, data: { title?: string; order?: number; status?: string; updatedBy?: string }): Promise<ModuleDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.updateModule(moduleId, data);
    }

    const module = this.inMemoryModules.get(moduleId);
    if (!module) return null;

    if (data.title) module.title = data.title;
    if (data.order !== undefined) module.order = data.order;
    if (data.status) module.status = data.status as any;

    return module;
  }

  async deleteModule(moduleId: string): Promise<boolean> {
    if (this.usePostgres) {
      return this.typeormRepo.deleteModule(moduleId);
    }

    this.inMemoryModules.delete(moduleId);
    return true;
  }

  // ============ MATERIAL METHODS ============
  async createMaterial(moduleId: string, data: { title: string; type: string; url: string; visibility?: string; createdBy: string }): Promise<MaterialDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createMaterial(moduleId, data);
    }

    const material: MaterialDTO = {
      id: this.generateId(),
      moduleId,
      title: data.title,
      type: data.type,
      url: data.url,
      visibility: data.visibility || 'private'
    };

    this.inMemoryMaterials.set(material.id, material);
    return material;
  }

  async getMaterial(materialId: string): Promise<MaterialDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getMaterial(materialId);
    }
    return this.inMemoryMaterials.get(materialId) || null;
  }

  async listMaterialsByModule(moduleId: string): Promise<MaterialDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listMaterialsByModule(moduleId);
    }

    return Array.from(this.inMemoryMaterials.values())
      .filter(m => m.moduleId === moduleId);
  }

  async updateMaterial(materialId: string, data: { title?: string; type?: string; url?: string; visibility?: string; updatedBy?: string }): Promise<MaterialDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.updateMaterial(materialId, data);
    }

    const material = this.inMemoryMaterials.get(materialId);
    if (!material) return null;

    if (data.title) material.title = data.title;
    if (data.type) material.type = data.type;
    if (data.url) material.url = data.url;
    if (data.visibility) material.visibility = data.visibility;

    return material;
  }

  async deleteMaterial(materialId: string): Promise<boolean> {
    if (this.usePostgres) {
      return this.typeormRepo.deleteMaterial(materialId);
    }

    this.inMemoryMaterials.delete(materialId);
    return true;
  }

  // ============ HELPERS ============
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Singleton instance
let repositoryInstance: CourseRepository | null = null;

export function getCourseRepository(): CourseRepository {
  if (!repositoryInstance) {
    repositoryInstance = new CourseRepository();
  }
  return repositoryInstance;
}
