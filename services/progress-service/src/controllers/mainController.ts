import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { TypeORMProgressRepository, ProgressStatus } from '../repositories/TypeORMProgressRepository';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../repositories/dataSource';

interface ProgressRecord {
  id: string;
  studentId: string;
  courseId: string;
  moduleId?: string;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastUpdated: string;
}

const progressStore = new Map<string, ProgressRecord>();
let typeormRepo: TypeORMProgressRepository | null = null;

const getRepository = (): TypeORMProgressRepository | null => {
  if (AppDataSource.isInitialized) {
    if (!typeormRepo) {
      typeormRepo = new TypeORMProgressRepository();
    }
    return typeormRepo;
  }
  return null;
};

const keyFor = (studentId: string, courseId: string, moduleId = 'course') => `${studentId}:${courseId}:${moduleId}`;

export const upsertProgress = async (record: Omit<ProgressRecord, 'id' | 'lastUpdated'>) => {
  try {
    const repo = getRepository();
    if (repo) {
      return await repo.upsertProgress(record);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const value: ProgressRecord = { id: randomUUID(), ...record, lastUpdated: new Date().toISOString() };
  progressStore.set(keyFor(record.studentId, record.courseId, record.moduleId), value);
  return value;
};

export const recordEvaluationCompletion = async (input: { studentId: string; courseId: string; moduleId?: string; score: number }) => {
  try {
    const repo = getRepository();
    if (repo) {
      return await repo.recordEvaluationCompletion(input);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const percentage = Math.min(100, Math.max(0, input.score));
  const value: ProgressRecord = {
    id: randomUUID(),
    studentId: input.studentId,
    courseId: input.courseId,
    moduleId: input.moduleId,
    percentage,
    status: percentage >= 100 ? 'completed' : 'in_progress',
    lastUpdated: new Date().toISOString()
  };
  progressStore.set(keyFor(input.studentId, input.courseId, input.moduleId), value);
  return value;
};

export const courseProgress = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const record = await repo.getCourseProgress(req.params.studentId, req.params.courseId);
      return res.json({ ok: true, item: record });
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const key = keyFor(req.params.studentId, req.params.courseId);
  const record = progressStore.get(key) ?? {
    id: randomUUID(),
    studentId: req.params.studentId,
    courseId: req.params.courseId,
    percentage: 0,
    status: 'not_started' as const,
    lastUpdated: new Date().toISOString()
  };

  if (!progressStore.has(key)) {
    progressStore.set(key, record);
  }

  res.json({ ok: true, item: record });
};

export const studentProgress = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const items = await repo.getStudentProgress(req.params.studentId);
      const overallPercentage = items.length ? Math.round(items.reduce((sum, item) => sum + item.percentage, 0) / items.length) : 0;
      return res.json({ ok: true, items, overallPercentage });
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const items = [...progressStore.values()].filter((item) => item.studentId === req.params.studentId);
  res.json({ ok: true, items, overallPercentage: items.length ? Math.round(items.reduce((sum, item) => sum + item.percentage, 0) / items.length) : 0 });
};
