import { randomUUID } from 'crypto';
import { IsNull } from 'typeorm';
import { Progress } from '../domain/entities';
import { AppDataSource } from './dataSource';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProgressRecord {
  id: string;
  studentId: string;
  courseId: string;
  moduleId?: string;
  percentage: number;
  status: ProgressStatus;
  lastUpdated: string;
}

export class TypeORMProgressRepository {
  private get progressRepo() { return AppDataSource.getRepository(Progress); }

  async upsertProgress(data: {
    studentId: string;
    courseId: string;
    moduleId?: string;
    percentage: number;
    status: ProgressStatus;
  }): Promise<ProgressRecord> {
    const existing = await this.progressRepo.findOne({
      where: {
        studentId: data.studentId,
        courseId: data.courseId,
        moduleId: data.moduleId || IsNull() as any
      }
    });

    if (existing) {
      existing.percentage = data.percentage;
      existing.status = data.status;
      const saved = await this.progressRepo.save(existing);
      return this.entityToProgress(saved);
    }

    const entity = this.progressRepo.create({
      id: randomUUID(),
      studentId: data.studentId,
      courseId: data.courseId,
      moduleId: data.moduleId || null,
      percentage: data.percentage,
      status: data.status
    });
    const saved = await this.progressRepo.save(entity);
    return this.entityToProgress(saved);
  }

  async recordEvaluationCompletion(data: {
    studentId: string;
    courseId: string;
    moduleId?: string;
    score: number;
  }): Promise<ProgressRecord> {
    const percentage = Math.min(100, Math.max(0, data.score));
    const status: ProgressStatus = percentage >= 100 ? 'completed' : 'in_progress';

    return this.upsertProgress({
      studentId: data.studentId,
      courseId: data.courseId,
      moduleId: data.moduleId,
      percentage,
      status
    });
  }

  async getCourseProgress(studentId: string, courseId: string): Promise<ProgressRecord> {
    const record = await this.progressRepo.findOne({
      where: { studentId, courseId, moduleId: IsNull() as any }
    });

    if (record) {
      return this.entityToProgress(record);
    }

    return this.upsertProgress({
      studentId,
      courseId,
      percentage: 0,
      status: 'not_started'
    });
  }

  async getStudentProgress(studentId: string): Promise<ProgressRecord[]> {
    const records = await this.progressRepo.find({
      where: { studentId }
    });

    return records.map((r) => this.entityToProgress(r));
  }

  private entityToProgress(entity: Progress): ProgressRecord {
    return {
      id: entity.id,
      studentId: entity.studentId,
      courseId: entity.courseId,
      moduleId: entity.moduleId || undefined,
      percentage: Number(entity.percentage),
      status: entity.status,
      lastUpdated: entity.lastUpdated.toISOString()
    };
  }
}
