import { createApp } from './app';
import { startNotificationConsumer } from './messaging';

const port = Number(process.env.PORT || 3000);
createApp().listen(port, () => {
  console.log(`service listening on ${port}`);
});

startNotificationConsumer(process.env.RABBITMQ_URL).catch(console.error);
