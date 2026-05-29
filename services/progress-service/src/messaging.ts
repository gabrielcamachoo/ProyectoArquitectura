import amqp from 'amqplib';

export async function startProgressConsumer(url?: string) {
  if (!url) return;
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await ch.assertExchange('academic.events', 'topic', { durable: true });
  const queue = 'progress-service.evaluacion.completada.v1';
  await ch.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });
  await ch.bindQueue(queue, 'academic.events', 'evaluacion.completada.v1');
  await ch.consume(queue, (msg) => {
    if (!msg) return;
    ch.ack(msg);
  });
}
