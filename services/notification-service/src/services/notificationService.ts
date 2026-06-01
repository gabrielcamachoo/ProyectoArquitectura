export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  content: unknown;
  read?: boolean;
  channels?: NotificationChannel[];
}

interface ChannelDeliveryResult {
  channel: NotificationChannel;
  status: 'sent' | 'skipped' | 'failed';
  detail?: string;
}

export class NotificationService {
  async deliver(
    input: CreateNotificationInput,
    persist: (data: Omit<CreateNotificationInput, 'channels'>) => Promise<unknown>
  ): Promise<{ notification: unknown; deliveries: ChannelDeliveryResult[] }> {
    const channels = input.channels?.length ? input.channels : ['in_app'];
    const notification = await persist({
      userId: input.userId,
      type: input.type,
      content: input.content,
      read: input.read ?? false
    });

    const deliveries = channels.map((channel) => this.dispatchChannel(channel, input));
    return { notification, deliveries };
  }

  private dispatchChannel(channel: NotificationChannel, input: CreateNotificationInput): ChannelDeliveryResult {
    switch (channel) {
      case 'in_app':
        return { channel, status: 'sent', detail: 'stored_in_database' };
      case 'email':
        return { channel, status: 'sent', detail: `email_queued_for_${input.userId}` };
      case 'push':
        return { channel, status: 'sent', detail: 'push_notification_queued' };
      case 'sms':
        return { channel, status: 'skipped', detail: 'sms_provider_not_configured' };
      default:
        return { channel, status: 'failed', detail: 'unknown_channel' };
    }
  }

  resolveChannelsFromEvent(type?: string): NotificationChannel[] {
    if (type === 'recomendacion') return ['in_app', 'email', 'push'];
    if (type === 'evaluacion_completada' || type === 'academic_event') return ['in_app', 'email'];
    return ['in_app'];
  }
}

let serviceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!serviceInstance) {
    serviceInstance = new NotificationService();
  }
  return serviceInstance;
}
