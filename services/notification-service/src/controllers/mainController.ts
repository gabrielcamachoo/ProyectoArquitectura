import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface Notification {
	id: string;
	userId: string;
	type: string;
	content: unknown;
	read: boolean;
	createdAt: string;
}

const notifications = new Map<string, Notification>();

export const createNotification = (input: Omit<Notification, 'id' | 'createdAt'>) => {
	const notification: Notification = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
	notifications.set(notification.id, notification);
	return notification;
};

export const listNotifications = (req: Request, res: Response) => {
	const items = [...notifications.values()].filter((item) => item.userId === req.params.userId);
	res.json({ ok: true, items });
};

export const markRead = (req: Request, res: Response) => {
	const notification = notifications.get(req.params.id);
	if (!notification) return res.status(404).json({ error: 'not_found' });
	const updated = { ...notification, read: true };
	notifications.set(updated.id, updated);
	return res.json(updated);
};
