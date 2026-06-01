import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getCollaborationService } from '../services/collaborationService';

const service = getCollaborationService();

const handleError = (res: Response, error: unknown) => {
  const message = (error as Error).message;
  if (message === 'invalid_status' || message === 'content_required' || message === 'topic_required') {
    return res.status(400).json({ error: message });
  }
  if (message.includes('_required')) {
    return res.status(400).json({ error: message });
  }
  console.error('Collaboration error:', error);
  return res.status(500).json({ error: 'internal_error' });
};

export const listForums = async (_req: AuthRequest, res: Response) => {
  try {
    const items = await service.listForums();
    res.json({ ok: true, items });
  } catch (error) {
    handleError(res, error);
  }
};

export const createForum = async (req: AuthRequest, res: Response) => {
  try {
    const forum = await service.createForum({
      courseId: req.body.courseId,
      title: req.body.title,
      moderatorId: req.body.moderatorId ?? req.userId ?? 'system'
    });
    res.status(201).json(forum);
  } catch (error) {
    handleError(res, error);
  }
};

export const listForumPosts = async (req: AuthRequest, res: Response) => {
  try {
    const items = await service.listForumPosts(req.params.id);
    res.json({ items });
  } catch (error) {
    handleError(res, error);
  }
};

export const createForumPost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await service.createForumPost(req.params.id, {
      authorId: req.body.authorId ?? req.userId ?? 'anonymous',
      content: req.body.content
    });
    res.status(201).json(post);
  } catch (error) {
    handleError(res, error);
  }
};

export const listStudyGroups = async (_req: AuthRequest, res: Response) => {
  try {
    const items = await service.listStudyGroups();
    res.json({ ok: true, items });
  } catch (error) {
    handleError(res, error);
  }
};

export const createStudyGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await service.createStudyGroup({
      courseId: req.body.courseId,
      name: req.body.name,
      leaderId: req.body.leaderId ?? req.userId ?? 'system'
    });
    res.status(201).json(group);
  } catch (error) {
    handleError(res, error);
  }
};

export const listTutoring = async (req: AuthRequest, res: Response) => {
  try {
    const items = await service.listTutoring(req.query.userId as string, req.query.role as string);
    res.json({ ok: true, items });
  } catch (error) {
    handleError(res, error);
  }
};

export const createTutoring = async (req: AuthRequest, res: Response) => {
  try {
    const tutoring = await service.createTutoring({
      tutorId: req.body.tutorId,
      tuteeId: req.body.tuteeId,
      courseId: req.body.courseId,
      topic: req.body.topic,
      scheduledAt: req.body.scheduledAt
    });
    res.status(201).json(tutoring);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateTutoringStatus = async (req: AuthRequest, res: Response) => {
  try {
    const tutoring = await service.updateTutoringStatus(req.params.id, req.body.status);
    if (!tutoring) return res.status(404).json({ error: 'not_found' });
    res.json(tutoring);
  } catch (error) {
    handleError(res, error);
  }
};

export const matchTutoringByTopic = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = String(req.query.courseId ?? '');
    const topic = String(req.query.topic ?? '');
    const items = await service.matchTutorsByTopic(courseId, topic);
    res.json({ ok: true, items });
  } catch (error) {
    handleError(res, error);
  }
};
