import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'graded' | 'annulled';

const attempts = new Map<string, { id: string; evaluationId: string; studentId: string; status: AttemptStatus; submittedAt?: string; score?: number }>();

export const listEvaluations = (_req: Request, res: Response) => res.json({ items: [] });
export const createEvaluation = (req: Request, res: Response) => res.status(201).json({ id: randomUUID(), ...req.body });
export const getEvaluation = (req: Request, res: Response) => res.json({ id: req.params.id, title: 'evaluation' });

export const startAttempt = (req: Request, res: Response) => {
  const id = randomUUID();
  const attempt = { id, evaluationId: req.params.id, studentId: req.body.studentId, status: 'in_progress' as AttemptStatus };
  attempts.set(id, attempt);
  res.status(201).json(attempt);
};

export const submitAttempt = (req: Request, res: Response) => {
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'in_progress') return res.status(409).json({ error: 'invalid_state' });
  attempt.status = 'submitted';
  attempt.submittedAt = new Date().toISOString();
  attempts.set(attempt.id, attempt);
  return res.json(attempt);
};

export const gradeAttempt = (req: Request, res: Response) => {
  const attempt = attempts.get(req.params.id);
  if (!attempt || attempt.status !== 'submitted') return res.status(409).json({ error: 'invalid_state' });
  attempt.status = 'graded';
  attempt.score = Number(req.body.score ?? 0);
  attempts.set(attempt.id, attempt);
  return res.json(attempt);
};
