import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

type CourseStatus = 'draft' | 'published' | 'archived';
type ModuleStatus = 'draft' | 'published' | 'archived';

interface Course {
	id: string;
	name: string;
	description?: string;
	teacherId?: string;
	status: CourseStatus;
	publishedAt?: string | null;
}

interface Module {
	id: string;
	courseId: string;
	title: string;
	order: number;
	status: ModuleStatus;
}

interface Material {
	id: string;
	moduleId: string;
	title: string;
	type: string;
	url: string;
	visibility: string;
}

const courses = new Map<string, Course>();
const modules = new Map<string, Module[]>();
const materials = new Map<string, Material[]>();

const SEED_COURSE_ID = '00000000-0000-4000-8000-000000000001';

const ensureSeed = () => {
	if (courses.size > 0) return;
	const course: Course = {
		id: SEED_COURSE_ID,
		name: 'Arquitectura de Software',
		description: 'Diseño de sistemas escalables, patrones y microservicios — Pontificia Universidad Javeriana',
		teacherId: 'teacher-demo',
		status: 'published',
		publishedAt: new Date().toISOString()
	};
	courses.set(course.id, course);
	const mod1: Module = { id: randomUUID(), courseId: course.id, title: 'Fundamentos y patrones', order: 1, status: 'published' };
	const mod2: Module = { id: randomUUID(), courseId: course.id, title: 'Microservicios y mensajería', order: 2, status: 'published' };
	modules.set(course.id, [mod1, mod2]);
	materials.set(`${course.id}:${mod1.id}`, [
		{ id: randomUUID(), moduleId: mod1.id, title: 'Introducción a la arquitectura', type: 'video', url: 'https://example.com/mod1-intro', visibility: 'public' },
		{ id: randomUUID(), moduleId: mod1.id, title: 'Patrones GoF — guía PDF', type: 'document', url: 'https://example.com/mod1-pdf', visibility: 'public' }
	]);
	materials.set(`${course.id}:${mod2.id}`, [
		{ id: randomUUID(), moduleId: mod2.id, title: 'RabbitMQ y eventos', type: 'video', url: 'https://example.com/mod2-rmq', visibility: 'public' }
	]);
};

export const listCourses = (_req: Request, res: Response) => {
	ensureSeed();
	res.json({ ok: true, items: [...courses.values()] });
};

export const createCourse = (req: Request, res: Response) => {
	const course: Course = {
		id: randomUUID(),
		name: req.body.name,
		description: req.body.description,
		teacherId: req.body.teacherId,
		status: req.body.status === 'published' ? 'published' : 'draft',
		publishedAt: req.body.status === 'published' ? new Date().toISOString() : null
	};
	courses.set(course.id, course);
	res.status(201).json(course);
};

export const getCourse = (req: Request, res: Response) => {
	const course = courses.get(req.params.id);
	if (!course) return res.status(404).json({ error: 'not_found' });
	return res.json(course);
};

export const updateCourse = (req: Request, res: Response) => {
	const current = courses.get(req.params.id);
	if (!current) return res.status(404).json({ error: 'not_found' });
	const status: CourseStatus = req.body.status ?? current.status;
	const updated = {
		...current,
		...req.body,
		status,
		publishedAt: status === 'published' ? current.publishedAt ?? new Date().toISOString() : current.publishedAt
	};
	courses.set(updated.id, updated);
	return res.json(updated);
};

export const deleteCourse = (req: Request, res: Response) => {
	const current = courses.get(req.params.id);
	if (!current) return res.status(404).json({ error: 'not_found' });
	const archived = { ...current, status: 'archived' as const };
	courses.set(archived.id, archived);
	return res.json(archived);
};

export const listModules = (req: Request, res: Response) => {
	return res.json({ items: modules.get(req.params.id) ?? [] });
};

export const createModule = (req: Request, res: Response) => {
	const module: Module = {
		id: randomUUID(),
		courseId: req.params.id,
		title: req.body.title,
		order: Number(req.body.order ?? (modules.get(req.params.id)?.length ?? 0) + 1),
		status: req.body.status ?? 'draft'
	};
	const current = modules.get(req.params.id) ?? [];
	current.push(module);
	modules.set(req.params.id, current);
	return res.status(201).json(module);
};

export const listMaterials = (req: Request, res: Response) => {
	const key = `${req.params.id}:${req.params.moduleId}`;
	return res.json({ items: materials.get(key) ?? [] });
};

export const createMaterial = (req: Request, res: Response) => {
	const key = `${req.params.id}:${req.params.moduleId}`;
	const material: Material = {
		id: randomUUID(),
		moduleId: req.params.moduleId,
		title: req.body.title,
		type: req.body.type ?? 'document',
		url: req.body.url,
		visibility: req.body.visibility ?? 'private'
	};
	const current = materials.get(key) ?? [];
	current.push(material);
	materials.set(key, current);
	return res.status(201).json(material);
};
