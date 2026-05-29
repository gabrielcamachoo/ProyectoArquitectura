import { Request, Response } from 'express';

export const courseProgress = (_req: Request, res: Response) => res.json({ ok: true, operation: 'courseProgress' });
export const studentProgress = (_req: Request, res: Response) => res.json({ ok: true, operation: 'studentProgress' });
