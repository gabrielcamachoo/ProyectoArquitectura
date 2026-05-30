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

const ensureSeed = () => {
	if (forums.size > 0) return;
	const forum: Forum = {
		id: randomUUID(),
		courseId: '00000000-0000-4000-8000-000000000001',
		title: 'Foro general — Arquitectura de Software',
		status: 'active',
		moderatorId: 'teacher-demo'
	};
	forums.set(forum.id, forum);
	forumPosts.set(forum.id, [
		{
			id: randomUUID(),
			forumId: forum.id,
			authorId: 'teacher-demo',
			content: 'Bienvenidos al foro del curso. Compartan dudas sobre microservicios y el proyecto integrador.',
			createdAt: new Date().toISOString()
		}
	]);
};

export const listForums = (_req: Request, res: Response) => {
	ensureSeed();
	res.json({ ok: true, items: [...forums.values()] });
};

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

export const listTutoring = (req: Request, res: Response) => {
	const { userId, role } = req.query;
	let items = [...tutoringSessions.values()];
	if (userId && role === 'tutor') items = items.filter((t) => t.tutorId === userId);
	else if (userId && role === 'tutee') items = items.filter((t) => t.tuteeId === userId);
	else if (userId) items = items.filter((t) => t.tutorId === userId || t.tuteeId === userId);
	return res.json({ ok: true, items });
};

export const createTutoring = (req: Request, res: Response) => {
	const tutoring: Tutoring = { id: randomUUID(), tutorId: req.body.tutorId, tuteeId: req.body.tuteeId, courseId: req.body.courseId, scheduledAt: req.body.scheduledAt ?? new Date().toISOString(), status: 'scheduled' };
	tutoringSessions.set(tutoring.id, tutoring);
	return res.status(201).json(tutoring);
};

export const updateTutoringStatus = (req: Request, res: Response) => {
	const session = tutoringSessions.get(req.params.id);
	if (!session) return res.status(404).json({ error: 'not_found' });
	const status = req.body.status as Tutoring['status'];
	if (!['scheduled', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
	const updated = { ...session, status };
	tutoringSessions.set(updated.id, updated);
	return res.json(updated);
};
