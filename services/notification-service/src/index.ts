import { createApp } from './app';
import { startNotificationConsumer } from './messaging';
import { AppDataSource } from './repositories/dataSource';

const port = Number(process.env.PORT || 3007);

// Try to initialize database connection
if (process.env.DATABASE_URL) {
  AppDataSource.initialize()
    .then(() => {
      console.log('PostgreSQL connected');
      createApp().listen(port, () => console.log(`notification-service on ${port}`));
      startNotificationConsumer(process.env.RABBITMQ_URL).catch(console.error);
    })
    .catch((error) => {
      console.warn('PostgreSQL initialization failed, using in-memory storage:', error.message);
      createApp().listen(port, () => console.log(`notification-service on ${port} (in-memory)`));
      startNotificationConsumer(process.env.RABBITMQ_URL).catch(console.error);
    });
} else {
  console.warn('DATABASE_URL not set, using in-memory storage');
  createApp().listen(port, () => console.log(`notification-service on ${port} (in-memory)`));
  startNotificationConsumer(process.env.RABBITMQ_URL).catch(console.error);
}
