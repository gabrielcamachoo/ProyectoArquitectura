import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.header('x-correlation-id') || randomUUID();
  res.setHeader('x-correlation-id', requestId);
  res.on('finish', () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId,
      userId: req.header('x-user-id') ?? null,
      role: req.header('x-role') ?? null,
      event: `${req.method} ${req.path}`,
      ip: req.header('x-forwarded-for') ?? req.ip,
      service: 'adaptive-service',
      durationMs: Date.now() - start,
      category: 'business_log'
    }));
  });
  next();
}
