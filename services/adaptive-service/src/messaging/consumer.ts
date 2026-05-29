import amqp from 'amqplib';
import { RecommendationService } from '../services/recommendationService';
import { EvaluationCompletedEvent } from '../rules/recommendationEngine';

export async function startConsumer(recommendationService: RecommendationService, url?: string) {
  if (!url) return;
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange('academic.events', 'topic', { durable: true });
  const queue = 'adaptive-service.evaluacion.completada.v1';
  await channel.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });
  await channel.bindQueue(queue, 'academic.events', 'evaluacion.completada.v1');
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as EvaluationCompletedEvent;
      await recommendationService.generate(event);
      channel.ack(msg);
    } catch (error) {
      console.log(JSON.stringify({ level: 'error', category: 'technical_log', event: 'dlq-publish', requestId: 'n/a', error: (error as Error).message }));
      channel.nack(msg, false, false);
    }
  });
}
