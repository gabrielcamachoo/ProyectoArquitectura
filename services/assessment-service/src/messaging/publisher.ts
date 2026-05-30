import amqp from 'amqplib';

const EXCHANGE = 'academic.events';

export interface EvaluationCompletedPayload {
  version: 'v1';
  student_id: string;
  evaluation_id: string;
  course_id: string;
  score: number;
  submitted_at: string;
}

let channelPromise: Promise<amqp.Channel | null> | null = null;

async function getChannel(url?: string): Promise<amqp.Channel | null> {
  if (!url) return null;
  if (!channelPromise) {
    channelPromise = (async () => {
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      await ch.assertExchange('academic.events.dlq', 'topic', { durable: true });
      return ch;
    })().catch(() => null);
  }
  return channelPromise;
}

export async function publishEvaluationCompleted(payload: EvaluationCompletedPayload, url?: string) {
  const ch = await getChannel(url ?? process.env.RABBITMQ_URL);
  if (!ch) return;
  ch.publish(EXCHANGE, 'evaluacion.completada.v1', Buffer.from(JSON.stringify(payload)), {
    contentType: 'application/json',
    persistent: true
  });
  console.log(
    JSON.stringify({
      level: 'info',
      category: 'business_log',
      event: 'evaluacion.completada.v1',
      evaluationId: payload.evaluation_id,
      studentId: payload.student_id
    })
  );
}
