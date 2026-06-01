import { createApp } from './app';
import { AppDataSource } from './repositories/dataSource';

const port = Number(process.env.PORT || 3000);

// Try to initialize database connection
if (process.env.DATABASE_URL) {
  AppDataSource.initialize()
    .then(() => {
      console.log('PostgreSQL connected');
      createApp().listen(port, () => console.log(`auth-service on ${port}`));
    })
    .catch((error) => {
      console.warn('PostgreSQL initialization failed, using in-memory storage:', error.message);
      createApp().listen(port, () => console.log(`auth-service on ${port} (in-memory)`));
    });
} else {
  console.warn('DATABASE_URL not set, using in-memory storage');
  createApp().listen(port, () => console.log(`auth-service on ${port} (in-memory)`));
}
