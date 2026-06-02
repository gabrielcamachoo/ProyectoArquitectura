import { randomUUID } from 'crypto';
import { CourseEntity, Module, Material, EnrollmentEntity } from '../domain/entities';
import { AppDataSource } from './dataSource';

export interface Course {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  totalModules: number;
  maxStudents?: number | null;
  learningObjectives?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  name: string;
  description?: string;
  createdBy: string;
  maxStudents?: number;
  learningObjectives?: string;
}

export interface ModuleDTO {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: 'draft' | 'published' | 'archived';
}

export interface MaterialDTO {
  id: string;
  moduleId: string;
  title: string;
  type: string;
  url: string;
  visibility: string;
}

export class TypeORMCourseRepository {
  private get courseRepo() { return AppDataSource.getRepository(CourseEntity); }
  private get moduleRepo() { return AppDataSource.getRepository(Module); }
  private get materialRepo() { return AppDataSource.getRepository(Material); }
  private get enrollmentRepo() { return AppDataSource.getRepository(EnrollmentEntity); }

  // ============ COURSE METHODS ============
  async createCourse(input: CreateCourseInput): Promise<Course> {
    const entity = this.courseRepo.create({
      id: randomUUID(),
      name: input.name,
      description: input.description || null,
      teacherId: input.createdBy,
      createdBy: input.createdBy,
      status: 'draft',
      maxStudents: input.maxStudents || null,
      learningObjectives: input.learningObjectives || null,
      totalModules: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null
    });
    const saved = await this.courseRepo.save(entity);
    return this.entityToCourse(saved);
  }

  async getCourse(id: string): Promise<Course | null> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['modules']
    });
    return course ? this.entityToCourse(course) : null;
  }

  async listCourses(filter?: { status?: string; createdBy?: string }): Promise<Course[]> {
    let query = this.courseRepo.createQueryBuilder('course');
    
    if (filter?.status) {
      query = query.where('course.status = :status', { status: filter.status });
    }
    if (filter?.createdBy) {
      query = query.andWhere('course.createdBy = :createdBy', { createdBy: filter.createdBy });
    }

    const courses = await query.orderBy('course.createdAt', 'DESC').getMany();
    return courses.map(c => this.entityToCourse(c));
  }

  async updateCourse(id: string, data: { name?: string; description?: string; maxStudents?: number; learningObjectives?: string; updatedBy?: string }): Promise<Course | null> {
    const course = await this.courseRepo.findOneBy({ id });
    if (!course) return null;

    if (data.name) course.name = data.name;
    if (data.description !== undefined) course.description = data.description;
    if (data.maxStudents !== undefined) course.maxStudents = data.maxStudents;
    if (data.learningObjectives !== undefined) course.learningObjectives = data.learningObjectives;
    if (data.updatedBy) course.updatedBy = data.updatedBy;

    course.updatedAt = new Date();
    const saved = await this.courseRepo.save(course);
    return this.entityToCourse(saved);
  }

  async publishCourse(id: string, publishedBy: string): Promise<Course | null> {
    const course = await this.courseRepo.findOneBy({ id });
    if (!course) return null;

    course.status = 'published';
    course.updatedBy = publishedBy;
    course.updatedAt = new Date();
    const saved = await this.courseRepo.save(course);
    return this.entityToCourse(saved);
  }

  async archiveCourse(id: string, archivedBy: string): Promise<Course | null> {
    const course = await this.courseRepo.findOneBy({ id });
    if (!course) return null;

    course.status = 'archived';
    course.updatedBy = archivedBy;
    course.updatedAt = new Date();
    const saved = await this.courseRepo.save(course);
    return this.entityToCourse(saved);
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.courseRepo.delete(id);
    return true;
  }

  // ============ ENROLLMENT METHODS ============
  async enrollStudent(courseId: string, studentId: string): Promise<void> {
    // Check if already enrolled
    const existing = await this.enrollmentRepo.findOne({
      where: { courseId, studentId }
    });
    if (existing) return; // Already enrolled

    const enrollment = this.enrollmentRepo.create({
      courseId,
      studentId
    });
    await this.enrollmentRepo.save(enrollment);
  }

  async listStudentCourses(studentId: string): Promise<Course[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { studentId },
      relations: ['course']
    });
    
    return enrollments.map(e => this.entityToCourse(e.course));
  }

  // ============ MODULE METHODS ============
  async createModule(courseId: string, data: { title: string; order: number; createdBy: string }): Promise<ModuleDTO> {
    const module = this.moduleRepo.create({
      id: randomUUID(),
      courseId,
      title: data.title,
      order: data.order,
      status: 'draft',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null
    });

    const saved = await this.moduleRepo.save(module);

    // Increment totalModules in course
    const course = await this.courseRepo.findOneBy({ id: courseId });
    if (course) {
      course.totalModules = (course.totalModules || 0) + 1;
      await this.courseRepo.save(course);
    }

    return this.entityToModule(saved);
  }

  async getModule(moduleId: string): Promise<ModuleDTO | null> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['materials']
    });
    return module ? this.entityToModule(module) : null;
  }

  async listModulesByCourse(courseId: string): Promise<ModuleDTO[]> {
    const modules = await this.moduleRepo.find({
      where: { courseId },
      order: { order: 'ASC' }
    });
    return modules.map(m => this.entityToModule(m));
  }

  async updateModule(moduleId: string, data: { title?: string; order?: number; status?: string; updatedBy?: string }): Promise<ModuleDTO | null> {
    const module = await this.moduleRepo.findOneBy({ id: moduleId });
    if (!module) return null;

    if (data.title) module.title = data.title;
    if (data.order !== undefined) module.order = data.order;
    if (data.status) module.status = data.status as any;
    if (data.updatedBy) module.updatedBy = data.updatedBy;

    module.updatedAt = new Date();
    const saved = await this.moduleRepo.save(module);
    return this.entityToModule(saved);
  }

  async deleteModule(moduleId: string): Promise<boolean> {
    await this.moduleRepo.delete(moduleId);
    return true;
  }

  // ============ MATERIAL METHODS ============
  async createMaterial(moduleId: string, data: { title: string; type: string; url: string; visibility?: string; createdBy: string }): Promise<MaterialDTO> {
    const material = this.materialRepo.create({
      id: randomUUID(),
      moduleId,
      title: data.title,
      type: data.type,
      url: data.url,
      visibility: data.visibility || 'private',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null
    });

    const saved = await this.materialRepo.save(material);
    return this.entityToMaterial(saved);
  }

  async getMaterial(materialId: string): Promise<MaterialDTO | null> {
    const material = await this.materialRepo.findOneBy({ id: materialId });
    return material ? this.entityToMaterial(material) : null;
  }

  async listMaterialsByModule(moduleId: string): Promise<MaterialDTO[]> {
    const materials = await this.materialRepo.find({
      where: { moduleId }
    });
    return materials.map(m => this.entityToMaterial(m));
  }

  async updateMaterial(materialId: string, data: { title?: string; type?: string; url?: string; visibility?: string; updatedBy?: string }): Promise<MaterialDTO | null> {
    const material = await this.materialRepo.findOneBy({ id: materialId });
    if (!material) return null;

    if (data.title) material.title = data.title;
    if (data.type) material.type = data.type;
    if (data.url) material.url = data.url;
    if (data.visibility) material.visibility = data.visibility;
    if (data.updatedBy) material.updatedBy = data.updatedBy;

    material.updatedAt = new Date();
    const saved = await this.materialRepo.save(material);
    return this.entityToMaterial(saved);
  }

  async deleteMaterial(materialId: string): Promise<boolean> {
    await this.materialRepo.delete(materialId);
    return true;
  }

  // ============ HELPERS ============
  private entityToCourse(entity: CourseEntity): Course {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdBy: entity.createdBy ?? entity.teacherId ?? '',
      status: entity.status,
      totalModules: entity.totalModules ?? 0,
      maxStudents: entity.maxStudents,
      learningObjectives: entity.learningObjectives,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private entityToModule(entity: Module): ModuleDTO {
    return {
      id: entity.id,
      courseId: entity.courseId,
      title: entity.title,
      order: entity.order,
      status: entity.status
    };
  }

  private entityToMaterial(entity: Material): MaterialDTO {
    return {
      id: entity.id,
      moduleId: entity.moduleId,
      title: entity.title,
      type: entity.type,
      url: entity.url,
      visibility: entity.visibility
    };
  }
}
