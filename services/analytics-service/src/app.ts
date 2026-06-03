import express from 'express';
import routes from './routes';
import { loggingMiddleware } from './middleware/logging';
import { setupSwaggerUI } from './utils/swagger';

export function createApp() {
  const app = express();
  app.use((req, res, next) => {
    const origin = req.header('origin');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());
  app.use(loggingMiddleware('analytics-service'));
  app.get('/health', (_req, res) => res.json({ service: 'analytics-service', status: 'ok' }));
  setupSwaggerUI(app, 'analytics-service');
  app.use(routes);
  return app;
}
