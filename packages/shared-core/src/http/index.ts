import express, { Express, Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';

export interface AppConfig {
  serviceName: string;
  enableCors?: boolean;
  corsOrigins?: string[];
  bodyLimit?: string;
}

export function createBaseApp(config: AppConfig): Express {
  const app = express();
  
  // Body parsing middleware
  app.use(express.json({ limit: config.bodyLimit || '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit || '10mb' }));

  // CORS middleware
  if (config.enableCors !== false) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.header('origin');
      const allowedOrigins = config.corsOrigins || ['*'];
      
      if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Correlation-Id');
      res.setHeader('Access-Control-Expose-Headers', 'X-Correlation-Id');
      
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      
      next();
    });
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ 
      service: config.serviceName, 
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // Readiness check endpoint
  app.get('/ready', (_req: Request, res: Response) => {
    res.json({ 
      service: config.serviceName, 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

export function createAppWithConfig(config: AppConfig): Express {
  return createBaseApp(config);
}

// Re-export types for convenience
export { AuthRequest } from '../auth';
