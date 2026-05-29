import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function loggingMiddleware(service: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.header('x-correlation-id') || randomUUID();
    res.setHeader('x-correlation-id', requestId);
    res.on('finish', () => {
      const payload = {
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'error' : 'info',
        requestId,
        userId: req.header('x-user-id') ?? null,
        role: req.header('x-role') ?? null,
        event: `${req.method} ${req.path}`,
        ip: req.header('x-forwarded-for') ?? req.ip,
        service,
        durationMs: Date.now() - start,
        category: res.statusCode >= 500 ? 'technical_log' : 'business_log'
      };
      console.log(JSON.stringify(payload));
    });
    next();
  };
}
