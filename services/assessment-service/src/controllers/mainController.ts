import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

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
  status: AttemptStatus;
  submittedAt?: string;
  score?: number;
}

const evaluations = new Map<string, Evaluation>();
const attempts = new Map<string, Attempt>();

export const listEvaluations = (_req: Request, res: Response) => res.json({ items: [...evaluations.values()] });

export const createEvaluation = (req: Request, res: Response) => {
  const evaluation: Evaluation = {
    id: randomUUID(),
    courseId: req.body.courseId,
    title: req.body.title,
    type: req.body.type,
    weight: Number(req.body.weight ?? 0),
    deadline: req.body.deadline
  };
  evaluations.set(evaluation.id, evaluation);
  return res.status(201).json(evaluation);
};

export const getEvaluation = (req: Request, res: Response) => {
  const evaluation = evaluations.get(req.params.id);
  if (!evaluation) return res.status(404).json({ error: 'not_found' });
  return res.json(evaluation);
};

export const startAttempt = (req: Request, res: Response) => {
  if (!evaluations.has(req.params.id)) {
    evaluations.set(req.params.id, {
      id: req.params.id,
      courseId: req.body.courseId ?? 'course-seeded',
      title: req.body.title ?? 'evaluation',
      type: req.body.type ?? 'quiz',
      weight: Number(req.body.weight ?? 0),
      deadline: req.body.deadline
    });
  }
  const attempt: Attempt = {
    id: randomUUID(),
    evaluationId: req.params.id,
    studentId: req.body.studentId,
    status: 'in_progress'
  };
  attempts.set(attempt.id, attempt);
  res.status(201).json(attempt);
};

export const submitAttempt = (req: Request, res: Response) => {
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'in_progress') return res.status(409).json({ error: 'invalid_state' });
  const updated = { ...attempt, status: 'submitted' as const, submittedAt: new Date().toISOString() };
  attempts.set(updated.id, updated);
  return res.json(updated);
};

export const gradeAttempt = (req: Request, res: Response) => {
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'submitted') return res.status(409).json({ error: 'invalid_state' });
  const updated = { ...attempt, status: 'graded' as const, score: Number(req.body.score ?? 0) };
  attempts.set(updated.id, updated);
  return res.json(updated);
};
