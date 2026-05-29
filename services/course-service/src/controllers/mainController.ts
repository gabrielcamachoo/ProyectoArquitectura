import { Request, Response } from 'express';

export const listCourses = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listCourses' });
export const createCourse = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createCourse' });
export const getCourse = (_req: Request, res: Response) => res.json({ ok: true, operation: 'getCourse' });
export const updateCourse = (_req: Request, res: Response) => res.json({ ok: true, operation: 'updateCourse' });
export const deleteCourse = (_req: Request, res: Response) => res.json({ ok: true, operation: 'deleteCourse' });
export const listModules = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listModules' });
export const createModule = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createModule' });
export const listMaterials = (_req: Request, res: Response) => res.json({ ok: true, operation: 'listMaterials' });
export const createMaterial = (_req: Request, res: Response) => res.json({ ok: true, operation: 'createMaterial' });
