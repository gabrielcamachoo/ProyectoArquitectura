import amqp from 'amqplib';
import { createNotification } from './controllers/mainController';

const bindings = [
  'evaluacion.completada.v1',
  'recomendacion.generada.v1',
  'notificacion.academica.v1'
];

export async function startNotificationConsumer(url?: string) {
  if (!url) return;
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await ch.assertExchange('academic.events', 'topic', { durable: true });
  await ch.assertExchange('academic.events.dlq', 'topic', { durable: true });
  const queue = 'notification-service.events';
  await ch.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });

  for (const key of bindings) {
    await ch.bindQueue(queue, 'academic.events', key);
  }

  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        user_id?: string;
        userId?: string;
        studentId?: string;
        type?: string;
        content?: unknown;
      };
      await createNotification({
        userId: payload.user_id ?? payload.userId ?? payload.studentId ?? 'system',
        type: payload.type ?? msg.fields.routingKey.replace('.v1', ''),
        content: payload.content ?? payload,
        read: false
      });
      console.log(JSON.stringify({ event: 'notification-event', routingKey: msg.fields.routingKey, category: 'business_log' }));
      ch.ack(msg);
    } catch (error) {
      console.log(JSON.stringify({ event: 'notification-dlq', routingKey: msg.fields.routingKey, category: 'technical_log', error: (error as Error).message }));
      ch.nack(msg, false, false);
    }
  });
}
