import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface LogContext {
  userId?: string;
  role?: string;
  requestId: string;
  service: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  requestId: string;
  userId: string | null;
  role: string | null;
  event: string;
  ip: string | undefined;
  service: string;
  durationMs: number;
  category: 'security_log' | 'business_log' | 'technical_log';
  message?: string;
  error?: string;
}

class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(entry: LogEntry): void {
    console.log(JSON.stringify(entry));
  }

  info(context: LogContext, event: string, durationMs: number, ip?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      requestId: context.requestId,
      userId: context.userId ?? null,
      role: context.role ?? null,
      event,
      ip: ip ?? undefined,
      service: context.service,
      durationMs,
      category: event.startsWith('auth') || event.startsWith('POST /auth') || event.startsWith('POST /users') 
        ? 'security_log' 
        : 'business_log'
    });
  }

  error(context: LogContext, event: string, error: Error, durationMs: number, ip?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      requestId: context.requestId,
      userId: context.userId ?? null,
      role: context.role ?? null,
      event,
      ip: ip ?? undefined,
      service: context.service,
      durationMs,
      category: 'technical_log',
      message: error.message,
      error: error.stack
    });
  }
}

export const logger = Logger.getInstance();

export function createLoggingMiddleware(service: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.header('x-correlation-id') || randomUUID();
    
    res.setHeader('x-correlation-id', requestId);
    
    const context: LogContext = {
      requestId,
      service,
      userId: (req as any).userId,
      role: (req as any).role
    };

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const event = `${req.method} ${req.path}`;
      
      if (res.statusCode >= 500) {
        logger.error(
          context,
          event,
          new Error(`HTTP ${res.statusCode}`),
          durationMs,
          req.header('x-forwarded-for') ?? req.ip
        );
      } else {
        logger.info(
          context,
          event,
          durationMs,
          req.header('x-forwarded-for') ?? req.ip
        );
      }
    });

    next();
  };
}

export default logger;
