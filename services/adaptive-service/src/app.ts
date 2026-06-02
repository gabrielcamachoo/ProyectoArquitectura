import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: 'adaptive-service',
    enableCors: true,
    bodyLimit: '10mb'
  });

  // Logging middleware
  app.use(createLoggingMiddleware('adaptive-service'));

  // Swagger documentation
  setupSwaggerUI(app, {
    serviceName: 'adaptive-service'
  });

  // Application routes
  app.use(routes);

  return app;
}
