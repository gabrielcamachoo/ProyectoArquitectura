import amqp from 'amqplib';

const EXCHANGE = 'academic.events';

let channelPromise: Promise<amqp.Channel | null> | null = null;

async function getChannel(url?: string): Promise<amqp.Channel | null> {
  if (!url) return null;
  if (!channelPromise) {
    channelPromise = (async () => {
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      return ch;
    })().catch(() => null);
  }
  return channelPromise;
}

export async function publishRecommendationGenerated(payload: Record<string, unknown>, url?: string) {
  const ch = await getChannel(url ?? process.env.RABBITMQ_URL);
  if (!ch) return;
  ch.publish(EXCHANGE, 'recomendacion.generada.v1', Buffer.from(JSON.stringify(payload)), {
    contentType: 'application/json',
    persistent: true
  });
}
