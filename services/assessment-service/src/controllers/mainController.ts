import { Response } from 'express';
import { randomUUID } from 'crypto';
import { publishEvaluationCompleted } from '../messaging/publisher';
import { TypeORMAssessmentRepository, Evaluation, AttemptDTO } from '../repositories/TypeORMAssessmentRepository';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../repositories/dataSource';

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'graded' | 'annulled';

interface Evaluation {
  id: string;
  courseId: string;
  title: string;
  type: string;
  weight: number;
  deadline?: string;
}

interface Attempt {
  id: string;
  evaluationId: string;
  studentId: string;
  courseId?: string;
  status: AttemptStatus;
  submittedAt?: string;
  score?: number;
}

// In-memory storage
const evaluations = new Map<string, Evaluation>();
const attempts = new Map<string, Attempt>();

let typeormRepo: TypeORMAssessmentRepository | null = null;
let usePostgres = false;

const getRepository = (): TypeORMAssessmentRepository | null => {
  if (!usePostgres && AppDataSource.isInitialized) {
    if (!typeormRepo) {
      typeormRepo = new TypeORMAssessmentRepository();
    }
    return typeormRepo;
  }
  return null;
};

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

const ensureSeed = () => {
  if (evaluations.size > 0) return;
  const evaluation: Evaluation = {
    id: randomUUID(),
    courseId: SEED_COURSE,
    title: 'Parcial 1 — Arquitectura de microservicios',
    type: 'quiz',
    weight: 30,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString()
  };
  evaluations.set(evaluation.id, evaluation);
};

export const listEvaluations = async (_req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const items = await repo.getEvaluations();
      return res.json({ items });
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  ensureSeed();
  res.json({ items: [...evaluations.values()] });
};

export const createEvaluation = async (req: AuthRequest, res: Response) => {
  const data = {
    courseId: req.body.courseId,
    title: req.body.title,
    type: req.body.type,
    weight: Number(req.body.weight ?? 0),
    deadline: req.body.deadline
  };

  try {
    const repo = getRepository();
    if (repo) {
      const evaluation = await repo.createEvaluation(data);
      return res.status(201).json(evaluation);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const evaluation: Evaluation = { id: randomUUID(), ...data };
  evaluations.set(evaluation.id, evaluation);
  return res.status(201).json(evaluation);
};

export const getEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const evaluation = await repo.getEvaluation(req.params.id);
      if (!evaluation) return res.status(404).json({ error: 'not_found' });
      return res.json(evaluation);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const evaluation = evaluations.get(req.params.id);
  if (!evaluation) return res.status(404).json({ error: 'not_found' });
  return res.json(evaluation);
};

export const startAttempt = async (req: AuthRequest, res: Response) => {
  const studentId = req.body.studentId ?? req.userId ?? 'student-demo';

  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.startAttempt({
        evaluationId: req.params.id,
        studentId,
        courseId: req.body.courseId ?? SEED_COURSE
      });
      return res.status(201).json(attempt);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  if (!evaluations.has(req.params.id)) {
    evaluations.set(req.params.id, {
      id: req.params.id,
      courseId: req.body.courseId ?? SEED_COURSE,
      title: req.body.title ?? 'evaluation',
      type: req.body.type ?? 'quiz',
      weight: Number(req.body.weight ?? 0),
      deadline: req.body.deadline
    });
  }
  const attempt: Attempt = {
    id: randomUUID(),
    evaluationId: req.params.id,
    studentId,
    courseId: req.body.courseId ?? SEED_COURSE,
    status: 'in_progress'
  };
  attempts.set(attempt.id, attempt);
  res.status(201).json(attempt);
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.submitAttempt(req.params.id);
      if (!attempt) return res.status(409).json({ error: 'invalid_state' });
      return res.json(attempt);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'in_progress') return res.status(409).json({ error: 'invalid_state' });
  const updated = { ...attempt, status: 'submitted' as const, submittedAt: new Date().toISOString() };
  attempts.set(updated.id, updated);
  return res.json(updated);
};

const emitEvaluationCompleted = async (attempt: Attempt, score: number) => {
  const evaluation = evaluations.get(attempt.evaluationId);
  if (!evaluation) return;
  await publishEvaluationCompleted({
    version: 'v1',
    student_id: attempt.studentId,
    evaluation_id: attempt.evaluationId,
    course_id: attempt.courseId ?? evaluation.courseId,
    score,
    submitted_at: attempt.submittedAt ?? new Date().toISOString()
  });
};

export const gradeAttempt = async (req: AuthRequest, res: Response) => {
  const score = Number(req.body.score ?? 0);

  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.gradeAttempt(req.params.id, score);
      if (!attempt) return res.status(409).json({ error: 'invalid_state' });
      
      // Emit event asynchronously (don't wait)
      emitEvaluationCompleted(
        {
          id: attempt.id,
          evaluationId: attempt.evaluationId,
          studentId: attempt.studentId,
          courseId: attempt.courseId,
          status: attempt.status as AttemptStatus,
          submittedAt: attempt.submittedAt,
          score: attempt.score
        },
        score
      ).catch((err) => console.error('Event publish error:', err));

      return res.json(attempt);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'submitted') return res.status(409).json({ error: 'invalid_state' });
  const updated = { ...attempt, status: 'graded' as const, score };
  attempts.set(updated.id, updated);
  
  // Emit event asynchronously (don't wait)
  emitEvaluationCompleted(updated, score).catch((err) => console.error('Event publish error:', err));

  return res.json(updated);
};
    student_id: attempt.studentId,
    evaluation_id: attempt.evaluationId,
    course_id: evaluation.courseId,
    score,
    submitted_at: attempt.submittedAt ?? new Date().toISOString()
  });
};

export const gradeAttempt = async (req: Request, res: Response) => {
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'submitted') return res.status(409).json({ error: 'invalid_state' });
  const score = Number(req.body.score ?? 0);
  const updated = { ...attempt, status: 'graded' as const, score };
  attempts.set(updated.id, updated);
  await emitEvaluationCompleted(updated, score);
  return res.json(updated);
};
