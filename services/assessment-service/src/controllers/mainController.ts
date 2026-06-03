import { Response } from 'express';
import { randomUUID } from 'crypto';
import { publishEvaluationCompleted } from '../messaging/publisher';
import { getAssessmentRepository, AssessmentRepository } from '../repositories/assessmentRepository';
import { EvaluationDTO, AttemptDTO, EvaluationType } from '../repositories/TypeORMAssessmentRepository';
import { AuthRequest } from '../middleware/auth';

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

// In-memory storage fallback
const evaluations = new Map<string, Evaluation>();
const attempts = new Map<string, Attempt>();

let repository: AssessmentRepository | null = null;

const getRepository = (): AssessmentRepository | null => {
  if (!repository) {
    repository = getAssessmentRepository();
  }
  return repository;
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
      const items = await repo.listEvaluationsByCourse(SEED_COURSE);
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
    courseId: req.body.courseId ?? SEED_COURSE,
    title: req.body.title ?? 'Untitled Evaluation',
    type: (req.body.type ?? 'quiz') as EvaluationType,
    weight: Number(req.body.weight ?? 0),
    deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
    createdBy: req.userId ?? 'system'
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
  const evaluation: Evaluation = {
    id: randomUUID(),
    courseId: data.courseId,
    title: data.title,
    type: data.type,
    weight: data.weight,
    deadline: data.deadline?.toISOString()
  };
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
  const courseId = req.body.courseId ?? SEED_COURSE;
  const evaluationId = req.params.id;

  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.createAttempt({
        evaluationId,
        studentId,
        courseId
      });
      const started = await repo.startAttempt(attempt.id);
      return res.status(201).json(started);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  // Fallback to in-memory
  if (!evaluations.has(evaluationId)) {
    evaluations.set(evaluationId, {
      id: evaluationId,
      courseId,
      title: req.body.title ?? 'evaluation',
      type: req.body.type ?? 'quiz',
      weight: Number(req.body.weight ?? 0),
      deadline: req.body.deadline
    });
  }
  const attempt: Attempt = {
    id: randomUUID(),
    evaluationId,
    studentId,
    courseId,
    status: 'in_progress'
  };
  attempts.set(attempt.id, attempt);
  res.status(201).json(attempt);
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.submitAttempt(req.params.id, req.body.answers ?? {});
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
  const repo = getRepository();
  let totalPoints = 100;
  let passThreshold = 60;
  let courseId = attempt.courseId ?? SEED_COURSE;

  if (repo) {
    const evaluation = await repo.getEvaluation(attempt.evaluationId);
    if (evaluation) {
      totalPoints = evaluation.totalPoints;
      passThreshold = evaluation.passThreshold;
      courseId = evaluation.courseId;
    }
  } else {
    const evaluation = evaluations.get(attempt.evaluationId);
    if (evaluation) {
      courseId = evaluation.courseId;
    }
  }

  await publishEvaluationCompleted({
    event: 'evaluacion.completada.v1',
    studentId: attempt.studentId,
    assessmentId: attempt.evaluationId,
    courseId,
    score,
    totalPoints,
    passThreshold
  });
};

export const gradeAttempt = async (req: AuthRequest, res: Response) => {
  const score = Number(req.body.score ?? 0);

  try {
    const repo = getRepository();
    if (repo) {
      const attempt = await repo.updateAttemptScore(req.params.id, score, score >= 60);
      if (!attempt) return res.status(409).json({ error: 'invalid_state' });
      const marked = await repo.markAttemptAsGraded(req.params.id);
      if (!marked) return res.status(409).json({ error: 'invalid_state' });

      // Emit event asynchronously (don't wait)
      emitEvaluationCompleted(
        {
          id: marked.id,
          evaluationId: marked.evaluationId,
          studentId: marked.studentId,
          courseId: marked.courseId,
          status: marked.status as AttemptStatus,
          submittedAt: marked.submittedAt?.toISOString(),
          score: marked.score ?? score
        },
        score
      ).catch((err) => console.error('Event publish error:', err));

      return res.json(marked);
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
