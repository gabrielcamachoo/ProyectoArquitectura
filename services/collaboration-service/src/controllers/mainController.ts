import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface Forum {
	id: string;
	courseId: string;
	title: string;
	status: 'active' | 'archived';
	moderatorId: string;
}

interface ForumPost {
	id: string;
	forumId: string;
	authorId: string;
	content: string;
	createdAt: string;
}

interface StudyGroup {
	id: string;
	courseId: string;
	name: string;
	leaderId: string;
	status: 'active' | 'archived';
}

interface Tutoring {
	id: string;
	tutorId: string;
	tuteeId: string;
	courseId: string;
	scheduledAt: string;
	status: 'scheduled' | 'completed' | 'cancelled';
}

const forums = new Map<string, Forum>();
const forumPosts = new Map<string, ForumPost[]>();
const studyGroups = new Map<string, StudyGroup>();
const tutoringSessions = new Map<string, Tutoring>();

export const listForums = (_req: Request, res: Response) => res.json({ ok: true, items: [...forums.values()] });

export const createForum = (req: Request, res: Response) => {
	const forum: Forum = { id: randomUUID(), courseId: req.body.courseId, title: req.body.title, status: 'active', moderatorId: req.body.moderatorId ?? req.body.authorId ?? 'system' };
	forums.set(forum.id, forum);
	return res.status(201).json(forum);
};

export const listForumPosts = (req: Request, res: Response) => {
	return res.json({ items: forumPosts.get(req.params.id) ?? [] });
};

export const createForumPost = (req: Request, res: Response) => {
	const post: ForumPost = { id: randomUUID(), forumId: req.params.id, authorId: req.body.authorId, content: req.body.content, createdAt: new Date().toISOString() };
	const items = forumPosts.get(req.params.id) ?? [];
	items.push(post);
	forumPosts.set(req.params.id, items);
	return res.status(201).json(post);
};

export const listStudyGroups = (_req: Request, res: Response) => res.json({ ok: true, items: [...studyGroups.values()] });

export const createStudyGroup = (req: Request, res: Response) => {
	const group: StudyGroup = { id: randomUUID(), courseId: req.body.courseId, name: req.body.name, leaderId: req.body.leaderId, status: 'active' };
	studyGroups.set(group.id, group);
	return res.status(201).json(group);
};

export const createTutoring = (req: Request, res: Response) => {
	const tutoring: Tutoring = { id: randomUUID(), tutorId: req.body.tutorId, tuteeId: req.body.tuteeId, courseId: req.body.courseId, scheduledAt: req.body.scheduledAt ?? new Date().toISOString(), status: 'scheduled' };
	tutoringSessions.set(tutoring.id, tutoring);
	return res.status(201).json(tutoring);
};
