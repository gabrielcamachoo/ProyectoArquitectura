import amqp from 'amqplib';
import { recordEvaluationCompletion } from './controllers/mainController';

export async function startProgressConsumer(url?: string) {
  if (!url) return;
  const connectWithRetry = async (retryCount = 0): Promise<any> => {
    try {
      return await amqp.connect(url);
    } catch (error) {
      console.log(`[RabbitMQ] Connection failed, retrying in 5s... (${retryCount + 1})`);
      await new Promise(res => setTimeout(res, 5000));
      return connectWithRetry(retryCount + 1);
    }
  };
  const conn = await connectWithRetry();
  const ch = await conn.createChannel();
  await ch.assertExchange('academic.events', 'topic', { durable: true });
  const queue = 'progress-service.evaluacion.completada.v1';
  await ch.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });
  await ch.bindQueue(queue, 'academic.events', 'evaluacion.completada.v1');
  await ch.consume(queue, (msg: any) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as { studentId?: string; student_id?: string; courseId?: string; course_id?: string; score: number };
      recordEvaluationCompletion({ studentId: event.studentId ?? event.student_id ?? '', courseId: event.courseId ?? event.course_id ?? '', score: event.score });
    } catch {
      console.log(JSON.stringify({ level: 'error', category: 'technical_log', event: 'progress-dlq', requestId: msg.properties.messageId ?? 'n/a' }));
    }
    ch.ack(msg);
  });
}
