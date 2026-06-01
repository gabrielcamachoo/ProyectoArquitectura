import express from 'express';
import routes from './routes';
import { loggingMiddleware } from './middleware/logging';
import { setupSwaggerUI } from './utils/swagger';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(loggingMiddleware('analytics-service'));
  app.get('/health', (_req, res) => res.json({ service: 'analytics-service', status: 'ok' }));
  setupSwaggerUI(app, 'analytics-service');
  app.use(routes);
  return app;
}
