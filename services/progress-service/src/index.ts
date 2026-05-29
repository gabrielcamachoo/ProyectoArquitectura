import { createApp } from './app';
import { startProgressConsumer } from './messaging';

const port = Number(process.env.PORT || 3000);
createApp().listen(port, () => {
  console.log(`service listening on ${port}`);
});

startProgressConsumer(process.env.RABBITMQ_URL).catch(console.error);
