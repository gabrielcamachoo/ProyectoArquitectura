import { randomUUID } from 'crypto';
import { Notification } from '../domain/entities';
import { AppDataSource } from './dataSource';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  content: unknown;
  read: boolean;
  createdAt: string;
}

export class TypeORMNotificationRepository {
  private notificationRepo = AppDataSource.getRepository(Notification);

  async createNotification(data: {
    userId: string;
    type: string;
    content: unknown;
  }): Promise<NotificationDTO> {
    const entity = this.notificationRepo.create({
      id: randomUUID(),
      userId: data.userId,
      type: data.type,
      content: data.content as Record<string, any>,
      read: false
    });
    const saved = await this.notificationRepo.save(entity);
    return this.entityToNotification(saved);
  }

  async listNotifications(userId: string): Promise<NotificationDTO[]> {
    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return notifications.map((n) => this.entityToNotification(n));
  }

  async markRead(id: string): Promise<NotificationDTO | null> {
    const notification = await this.notificationRepo.findOneBy({ id });
    if (!notification) return null;

    notification.read = true;
    const saved = await this.notificationRepo.save(notification);
    return this.entityToNotification(saved);
  }

  private entityToNotification(entity: Notification): NotificationDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      content: entity.content,
      read: entity.read,
      createdAt: entity.createdAt.toISOString()
    };
  }
}
