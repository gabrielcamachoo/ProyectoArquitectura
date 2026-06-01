import amqp from 'amqplib';
import { RecommendationService } from '../services/recommendationService';
import { normalizeEvaluationEvent } from './eventNormalizer';

export async function startConsumer(recommendationService: RecommendationService, url?: string) {
  if (!url) {
    console.warn('[AdaptiveConsumer] RABBITMQ_URL not set, consumer disabled');
    return;
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange('academic.events', 'topic', { durable: true });
  await channel.assertExchange('academic.events.dlq', 'topic', { durable: true });

  const queue = 'adaptive-service.evaluacion.completada.v1';
  await channel.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });
  await channel.bindQueue(queue, 'academic.events', 'evaluacion.completada.v1');

  console.log(JSON.stringify({ level: 'info', event: 'consumer-started', queue, category: 'technical_log' }));

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const raw = JSON.parse(msg.content.toString());
      const event = normalizeEvaluationEvent(raw);
      await recommendationService.generate(event);
      channel.ack(msg);
    } catch (error) {
      console.log(JSON.stringify({
        level: 'error',
        category: 'technical_log',
        event: 'consumer-failed',
        routingKey: msg.fields.routingKey,
        error: (error as Error).message
      }));
      channel.nack(msg, false, false);
    }
  });
}
