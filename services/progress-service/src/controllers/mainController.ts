import { Request, Response } from 'express';

interface ProgressRecord {
	studentId: string;
	courseId: string;
	moduleId?: string;
	percentage: number;
	status: 'not_started' | 'in_progress' | 'completed';
	lastUpdated: string;
}

const progressStore = new Map<string, ProgressRecord>();

const keyFor = (studentId: string, courseId: string, moduleId = 'course') => `${studentId}:${courseId}:${moduleId}`;

export const upsertProgress = (record: Omit<ProgressRecord, 'lastUpdated'>) => {
	const value: ProgressRecord = { ...record, lastUpdated: new Date().toISOString() };
	progressStore.set(keyFor(record.studentId, record.courseId, record.moduleId), value);
	return value;
};

export const recordEvaluationCompletion = (input: { studentId: string; courseId: string; moduleId?: string; score: number }) => {
	const percentage = Math.min(100, Math.max(0, input.score));
	return upsertProgress({
		studentId: input.studentId,
		courseId: input.courseId,
		moduleId: input.moduleId,
		percentage,
		status: percentage >= 100 ? 'completed' : 'in_progress'
	});
};

export const courseProgress = (req: Request, res: Response) => {
	const record = progressStore.get(keyFor(req.params.studentId, req.params.courseId)) ?? upsertProgress({ studentId: req.params.studentId, courseId: req.params.courseId, percentage: 0, status: 'not_started' });
	res.json({ ok: true, item: record });
};

export const studentProgress = (req: Request, res: Response) => {
	const items = [...progressStore.values()].filter((item) => item.studentId === req.params.studentId);
	res.json({ ok: true, items, overallPercentage: items.length ? Math.round(items.reduce((sum, item) => sum + item.percentage, 0) / items.length) : 0 });
};
