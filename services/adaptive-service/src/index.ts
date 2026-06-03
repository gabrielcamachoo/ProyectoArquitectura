import { createApp } from './app';
import { recommendationService } from './routes';
import { startConsumer } from './messaging/consumer';

const port = Number(process.env.PORT || 3000);
createApp().listen(port, () => console.log(`adaptive-service on ${port}`));
startConsumer(recommendationService, process.env.RABBITMQ_URL).catch((error) => {
  console.error(error);
});
