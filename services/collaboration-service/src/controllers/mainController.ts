import { Request, Response } from 'express';

export const listForums = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listForums' });
export const createForum = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createForum' });
export const listForumPosts = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listForumPosts' });
export const createForumPost = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createForumPost' });
export const listStudyGroups = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listStudyGroups' });
export const createStudyGroup = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createStudyGroup' });
export const createTutoring = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createTutoring' });
