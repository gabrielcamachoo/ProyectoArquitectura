import { createServer } from 'http';
import { createApp } from './app';
import { setupWebsocket } from './websocket';
import { AppDataSource } from './repositories/dataSource';

const port = Number(process.env.PORT || 3005);
const app = createApp();
const server = createServer(app);
setupWebsocket(server);

const start = () => {
  server.listen(port, () => console.log(`collaboration-service on ${port}`));
};

if (process.env.DATABASE_URL) {
  AppDataSource.initialize()
    .then(() => {
      console.log('PostgreSQL connected');
      start();
    })
    .catch((error) => {
      console.warn('PostgreSQL initialization failed, using in-memory storage:', error.message);
      start();
    });
} else {
  console.warn('DATABASE_URL not set, using in-memory storage');
  start();
}
