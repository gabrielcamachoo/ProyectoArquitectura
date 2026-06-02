import amqp from 'amqplib';

const EXCHANGE = 'academic.events';

let channelPromise: Promise<amqp.Channel | null> | null = null;

async function getChannel(url?: string): Promise<amqp.Channel | null> {
  if (!url) return null;
  if (!channelPromise) {
    channelPromise = (async () => {
      const connectWithRetry = async (retryCount = 0): Promise<any> => {
        try {
          return await amqp.connect(url);
        } catch (error) {
          console.log(`[RabbitMQ Publisher] Connection failed, retrying in 5s... (${retryCount + 1})`);
          await new Promise(res => setTimeout(res, 5000));
          return connectWithRetry(retryCount + 1);
        }
      };
      const conn = await connectWithRetry();
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      return ch;
    })();
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
