import { Response } from 'express';
import { randomUUID } from 'crypto';
import { TypeORMNotificationRepository, NotificationDTO } from '../repositories/TypeORMNotificationRepository';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../repositories/dataSource';
import { getNotificationService, NotificationChannel } from '../services/notificationService';

interface Notification {
  id: string;
  userId: string;
  type: string;
  content: unknown;
  read: boolean;
  createdAt: string;
}

const notifications = new Map<string, Notification>();
let typeormRepo: TypeORMNotificationRepository | null = null;

const getRepository = (): TypeORMNotificationRepository | null => {
  if (AppDataSource.isInitialized) {
    if (!typeormRepo) {
      typeormRepo = new TypeORMNotificationRepository();
    }
    return typeormRepo;
  }
  return null;
};

export async function createNotificationRecord(input: {
  userId: string;
  type: string;
  content: unknown;
  read?: boolean;
}): Promise<Notification | NotificationDTO> {
  try {
    const repo = getRepository();
    if (repo) {
      return await repo.createNotification({
        userId: input.userId,
        type: input.type,
        content: input.content
      });
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  const notification: Notification = {
    ...input,
    read: input.read ?? false,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };
  notifications.set(notification.id, notification);
  return notification;
}

export const createNotification = async (input: {
  userId: string;
  type: string;
  content: unknown;
  read: boolean;
  channels?: NotificationChannel[];
}) => {
  const service = getNotificationService();
  const channels = input.channels ?? service.resolveChannelsFromEvent(input.type);
  const { notification, deliveries } = await service.deliver(
    { ...input, channels },
    createNotificationRecord
  );
  console.log(JSON.stringify({ event: 'notification-delivered', type: input.type, deliveries, category: 'business_log' }));
  return notification;
};

export const createNotificationHttp = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await createNotification({
      userId: req.body.userId ?? req.userId ?? 'system',
      type: req.body.type ?? 'manual',
      content: req.body.content ?? {},
      read: false,
      channels: req.body.channels
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Notification create error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
};

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const items = await repo.listNotifications(req.params.userId);
      return res.json({ ok: true, items });
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  const items = [...notifications.values()].filter((item) => item.userId === req.params.userId);
  res.json({ ok: true, items });
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    if (repo) {
      const notification = await repo.markRead(req.params.id);
      if (!notification) return res.status(404).json({ error: 'not_found' });
      return res.json(notification);
    }
  } catch (error) {
    console.error('PostgreSQL error:', error);
  }

  const notification = notifications.get(req.params.id);
  if (!notification) return res.status(404).json({ error: 'not_found' });
  const updated = { ...notification, read: true };
  notifications.set(updated.id, updated);
  return res.json(updated);
};
