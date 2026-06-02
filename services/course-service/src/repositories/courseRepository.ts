import { TypeORMCourseRepository, Course, CreateCourseInput, ModuleDTO, MaterialDTO } from './TypeORMCourseRepository';

/**
 * Hybrid course repository - PostgreSQL primary + in-memory fallback
 */
export class CourseRepository {
  private typeormRepo: TypeORMCourseRepository;
  private inMemoryCourses = new Map<string, Course>();
  private inMemoryModules = new Map<string, ModuleDTO>();
  private inMemoryMaterials = new Map<string, MaterialDTO>();
  private usePostgres = false;

  constructor() {
    this.typeormRepo = new TypeORMCourseRepository();
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Test connection
      await this.typeormRepo.listCourses();
      this.usePostgres = true;
      console.log('[CourseRepository] PostgreSQL connected');
    } catch (error) {
      this.usePostgres = false;
      console.warn('[CourseRepository] PostgreSQL unavailable, using in-memory storage');
    }
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

  async getCourse(courseId: string): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getCourse(courseId);
    }
    return this.inMemoryCourses.get(courseId) || null;
  }

  async listCourses(filters?: {
    status?: 'draft' | 'published' | 'archived';
    createdBy?: string;
  }): Promise<Course[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listCourses(filters);
    }

    let courses = Array.from(this.inMemoryCourses.values());

    if (filters?.status) {
      courses = courses.filter(c => c.status === filters.status);
    }

    if (filters?.createdBy) {
      courses = courses.filter(c => c.createdBy === filters.createdBy);
    }

    return courses;
  }

  async updateCourse(courseId: string, data: { name?: string; description?: string | null; maxStudents?: number; learningObjectives?: string; updatedBy: string }): Promise<Course | null> {
    if (this.usePostgres) {
      // Convert null to undefined for TypeORM
      const typeormData: any = { ...data };
      if (typeormData.description === null) {
        delete typeormData.description;
      }
      return this.typeormRepo.updateCourse(courseId, typeormData);
    }

    const course = this.inMemoryCourses.get(courseId);
    if (!course) return null;

    if (data.name) course.name = data.name;
    if (data.description !== undefined) course.description = data.description;
    if (data.maxStudents !== undefined) course.maxStudents = data.maxStudents;
    if (data.learningObjectives !== undefined) course.learningObjectives = data.learningObjectives;
    course.updatedAt = new Date();

    return course;
  }

  async publishCourse(courseId: string, publishedBy: string): Promise<Course | null> {
    if (this.usePostgres) {
      return this.typeormRepo.publishCourse(courseId, publishedBy);
    }

    const course = this.inMemoryCourses.get(courseId);
    if (!course) return null;

    course.status = 'published';
    course.updatedAt = new Date();

    return course;
  }

  // ============ MODULE METHODS ============
  async getModules(courseId: string): Promise<ModuleDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listModulesByCourse(courseId);
    }

    return Array.from(this.inMemoryModules.values())
      .filter(m => m.courseId === courseId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async addModule(courseId: string, data: { title: string; description?: string; order?: number }, createdBy: string): Promise<ModuleDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createModule(courseId, { 
        title: data.title, 
        order: data.order || 0, 
        createdBy 
      });
    }

    const module: ModuleDTO = {
      id: this.generateId(),
      courseId,
      title: data.title,
      order: data.order || 0,
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

  // ============ MATERIAL METHODS ============
  async getMaterials(courseId: string, moduleId: string): Promise<MaterialDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listMaterialsByModule(moduleId);
    }

    return Array.from(this.inMemoryMaterials.values())
      .filter(m => m.moduleId === moduleId);
  }

  async addMaterial(courseId: string, moduleId: string, data: {
    title: string;
    type: 'video' | 'document' | 'quiz' | 'assignment';
    content: string;
    url?: string;
  }, createdBy: string): Promise<MaterialDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createMaterial(moduleId, {
        title: data.title,
        type: data.type,
        url: data.url || '',
        visibility: 'public',
        createdBy
      });
    }

    const material: MaterialDTO = {
      id: this.generateId(),
      moduleId,
      title: data.title,
      type: data.type,
      url: data.url || '',
      visibility: 'public'
    };

    this.inMemoryMaterials.set(material.id, material);

    return material;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Singleton instance
let courseRepositoryInstance: CourseRepository | null = null;

export function getCourseRepository(): CourseRepository {
  if (!courseRepositoryInstance) {
    courseRepositoryInstance = new CourseRepository();
  }
  return courseRepositoryInstance;
}
