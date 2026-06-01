import express from 'express';
import routes from './routes';
import { loggingMiddleware } from './middleware/logging';
import { setupSwaggerUI } from './utils/swagger';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(loggingMiddleware);
  app.get('/health', (_req, res) =>
    res.json({
      service: 'adaptive-service',
      status: 'ok',
      rabbitmq: Boolean(process.env.RABBITMQ_URL),
      redis: Boolean(process.env.REDIS_URL)
    })
  );
  setupSwaggerUI(app, 'adaptive-service');
  app.use(routes);
  return app;
}
