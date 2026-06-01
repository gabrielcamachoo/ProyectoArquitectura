import amqp from 'amqplib';
import { RecommendationService } from '../services/recommendationService';
import { normalizeEvaluationEvent } from './eventNormalizer';

const EXCHANGE = 'academic.events';
const DLX = 'academic.events.dlq';
const ROUTING_KEY = 'evaluacion.completada.v1';
const DLQ_ROUTING_KEY = `${ROUTING_KEY}.dlq`;
const MAX_RETRIES = 3;

export async function startConsumer(recommendationService: RecommendationService, url?: string) {
  if (!url) {
    console.warn('[AdaptiveConsumer] RABBITMQ_URL not set, consumer disabled');
    return;
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(DLX, 'topic', { durable: true });

  const queue = `adaptive-service.${ROUTING_KEY}`;
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, EXCHANGE, ROUTING_KEY);

  // Observable DLQ (so RabbitMQ UI shows it)
  const dlq = `adaptive-service.${ROUTING_KEY}.dlq`;
  await channel.assertQueue(dlq, { durable: true });
  await channel.bindQueue(dlq, DLX, DLQ_ROUTING_KEY);

  console.log(JSON.stringify({ level: 'info', event: 'consumer-started', queue, category: 'technical_log' }));

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const raw = JSON.parse(msg.content.toString());
      const event = normalizeEvaluationEvent(raw);
      await recommendationService.generate(event);
      channel.ack(msg);
    } catch (error) {
      const currentRetry = Number(msg.properties.headers?.['x-retry-count'] ?? 0);
      const nextRetry = currentRetry + 1;

      console.log(
        JSON.stringify({
          level: 'error',
          category: 'technical_log',
          event: 'consumer-failed',
          routingKey: msg.fields.routingKey,
          retry: nextRetry,
          maxRetries: MAX_RETRIES,
          error: (error as Error).message
        })
      );

      if (nextRetry <= MAX_RETRIES) {
        // Re-publish to the same routing key with incremented retry count
        channel.publish(EXCHANGE, msg.fields.routingKey, msg.content, {
          contentType: msg.properties.contentType,
          persistent: true,
          headers: {
            ...(msg.properties.headers ?? {}),
            'x-retry-count': nextRetry
          }
        });
        channel.ack(msg);
        return;
      }

      // Send to DLQ exchange with explicit DLQ routing key, then ack original
      channel.publish(DLX, DLQ_ROUTING_KEY, msg.content, {
        contentType: msg.properties.contentType,
        persistent: true,
        headers: {
          ...(msg.properties.headers ?? {}),
          'x-retry-count': nextRetry,
          'x-original-routing-key': msg.fields.routingKey,
          'x-error': (error as Error).message
        }
      });
      channel.ack(msg);
    }
  });
}
