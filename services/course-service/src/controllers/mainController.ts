import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { TypeORMCourseRepository, Course } from '../repositories/TypeORMCourseRepository';
import { AppDataSource } from '../repositories/dataSource';

type CourseStatus = 'draft' | 'published' | 'archived';
type ModuleStatus = 'draft' | 'published' | 'archived';

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

// In-memory fallback
const inMemoryCourses = new Map<string, Course>();
const inMemoryModules = new Map<string, Module[]>();
const inMemoryMaterials = new Map<string, Material[]>();

let typeormRepo: TypeORMCourseRepository | null = null;
let usePostgres = false;

const getRepository = (): TypeORMCourseRepository | null => {
	if (!usePostgres && AppDataSource.isInitialized) {
		if (!typeormRepo) {
			typeormRepo = new TypeORMCourseRepository();
		}
		return typeormRepo;
	}
	return null;
};

const SEED_COURSE_ID = '00000000-0000-4000-8000-000000000001';

const ensureSeed = () => {
	if (inMemoryCourses.size > 0) return;
	const course: Course = {
		id: SEED_COURSE_ID,
		name: 'Arquitectura de Software',
		description: 'Diseño de sistemas escalables, patrones y microservicios — Pontificia Universidad Javeriana',
		teacherId: 'teacher-demo',
		status: 'published',
		publishedAt: new Date().toISOString()
	};
	inMemoryCourses.set(course.id, course);
	const mod1: Module = { id: randomUUID(), courseId: course.id, title: 'Fundamentos y patrones', order: 1, status: 'published' };
	const mod2: Module = { id: randomUUID(), courseId: course.id, title: 'Microservicios y mensajería', order: 2, status: 'published' };
	inMemoryModules.set(course.id, [mod1, mod2]);
	inMemoryMaterials.set(`${course.id}:${mod1.id}`, [
		{ id: randomUUID(), moduleId: mod1.id, title: 'Introducción a la arquitectura', type: 'video', url: 'https://example.com/mod1-intro', visibility: 'public' },
		{ id: randomUUID(), moduleId: mod1.id, title: 'Patrones GoF — guía PDF', type: 'document', url: 'https://example.com/mod1-pdf', visibility: 'public' }
	]);
	inMemoryMaterials.set(`${course.id}:${mod2.id}`, [
		{ id: randomUUID(), moduleId: mod2.id, title: 'RabbitMQ y eventos', type: 'video', url: 'https://example.com/mod2-rmq', visibility: 'public' }
	]);
};

export const listCourses = async (_req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const items = await repo.getCourses();
			return res.json({ ok: true, items });
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	ensureSeed();
	res.json({ ok: true, items: [...inMemoryCourses.values()] });
};

export const createCourse = async (req: Request, res: Response) => {
	const course: Course = {
		id: randomUUID(),
		name: req.body.name,
		description: req.body.description,
		teacherId: req.body.teacherId,
		status: req.body.status === 'published' ? 'published' : 'draft',
		publishedAt: req.body.status === 'published' ? new Date().toISOString() : null
	};

	try {
		const repo = getRepository();
		if (repo) {
			const created = await repo.createCourse(course);
			return res.status(201).json(created);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	inMemoryCourses.set(course.id, course);
	res.status(201).json(course);
};

export const getCourse = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const course = await repo.getCourse(req.params.id);
			if (!course) return res.status(404).json({ error: 'not_found' });
			return res.json(course);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const course = inMemoryCourses.get(req.params.id);
	if (!course) return res.status(404).json({ error: 'not_found' });
	return res.json(course);
};

export const updateCourse = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const updated = await repo.updateCourse(req.params.id, req.body);
			if (!updated) return res.status(404).json({ error: 'not_found' });
			return res.json(updated);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const current = inMemoryCourses.get(req.params.id);
	if (!current) return res.status(404).json({ error: 'not_found' });
	const status: CourseStatus = req.body.status ?? current.status;
	const updated = {
		...current,
		...req.body,
		status,
		publishedAt: status === 'published' ? current.publishedAt ?? new Date().toISOString() : current.publishedAt
	};
	inMemoryCourses.set(updated.id, updated);
	return res.json(updated);
};

export const deleteCourse = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const deleted = await repo.deleteCourse(req.params.id);
			if (!deleted) return res.status(404).json({ error: 'not_found' });
			return res.json(deleted);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const current = inMemoryCourses.get(req.params.id);
	if (!current) return res.status(404).json({ error: 'not_found' });
	const archived = { ...current, status: 'archived' as const };
	inMemoryCourses.set(archived.id, archived);
	return res.json(archived);
};

export const listModules = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const items = await repo.getModules(req.params.id);
			return res.json({ items });
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	return res.json({ items: inMemoryModules.get(req.params.id) ?? [] });
};

export const createModule = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const module = await repo.createModule(req.params.id, req.body);
			return res.status(201).json(module);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const module: Module = {
		id: randomUUID(),
		courseId: req.params.id,
		title: req.body.title,
		order: Number(req.body.order ?? (inMemoryModules.get(req.params.id)?.length ?? 0) + 1),
		status: req.body.status ?? 'draft'
	};
	const current = inMemoryModules.get(req.params.id) ?? [];
	current.push(module);
	inMemoryModules.set(req.params.id, current);
	return res.status(201).json(module);
};

export const listMaterials = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const items = await repo.getMaterials(req.params.id, req.params.moduleId);
			return res.json({ items });
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const key = `${req.params.id}:${req.params.moduleId}`;
	return res.json({ items: inMemoryMaterials.get(key) ?? [] });
};

export const createMaterial = async (req: Request, res: Response) => {
	try {
		const repo = getRepository();
		if (repo) {
			const material = await repo.createMaterial(req.params.id, req.params.moduleId, req.body);
			return res.status(201).json(material);
		}
	} catch (error) {
		console.error('PostgreSQL error:', error);
	}

	// Fallback to in-memory
	const key = `${req.params.id}:${req.params.moduleId}`;
	const material: Material = {
		id: randomUUID(),
		moduleId: req.params.moduleId,
		title: req.body.title,
		type: req.body.type ?? 'document',
		url: req.body.url,
		visibility: req.body.visibility ?? 'private'
	};
	const current = inMemoryMaterials.get(key) ?? [];
	current.push(material);
	inMemoryMaterials.set(key, current);
	return res.status(201).json(material);
};
