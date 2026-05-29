import { Request, Response } from 'express';

export const listNotifications = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listNotifications' });
export const markRead = (_req: Request, res: Response) => res.json({ ok: true, operation: 'markRead' });
