import { createApp } from './app';
import { AppDataSource } from './repositories/dataSource';

const port = Number(process.env.PORT || 3006);

// Try to initialize database connection (read-replica or primary)
if (process.env.DATABASE_READ_URL || process.env.DATABASE_URL) {
  AppDataSource.initialize()
    .then(() => {
      console.log('PostgreSQL (read-replica) connected');
      createApp().listen(port, () => console.log(`analytics-service on ${port}`));
    })
    .catch((error) => {
      console.warn('PostgreSQL initialization failed, service will use demo data:', error.message);
      createApp().listen(port, () => console.log(`analytics-service on ${port} (demo-only)`));
    });
} else {
  console.warn('DATABASE_READ_URL not set, using demo data only');
  createApp().listen(port, () => console.log(`analytics-service on ${port} (demo-only)`));
}
