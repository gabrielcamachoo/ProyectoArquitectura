import amqp from 'amqplib';

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
  const queue = 'notification-service.events';
  await ch.assertQueue(queue, { durable: true, deadLetterExchange: 'academic.events.dlq' });

  for (const key of bindings) {
    await ch.bindQueue(queue, 'academic.events', key);
  }

  await ch.consume(queue, (msg) => {
    if (!msg) return;
    console.log(JSON.stringify({ event: 'notification-event', routingKey: msg.fields.routingKey, category: 'business_log' }));
    ch.ack(msg);
  });
}
