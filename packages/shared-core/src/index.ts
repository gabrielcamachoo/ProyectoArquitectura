// Auth module
export {
  authGuard,
  requireRole,
  requireSelfOrRole,
  optionalAuth,
  verifyToken,
  decodeToken,
  tokenService,
} from './auth';
export type { AuthRequest, TokenPayload } from './auth';

// Repository module
export { RepositoryPort, InMemoryRepository } from './repository';

// Logging module
export {
  logger,
  createLoggingMiddleware,
  LogContext,
  LogEntry,
} from './logging';

// Swagger module
export { setupSwaggerUI, SwaggerConfig } from './swagger';

// HTTP module
export {
  createBaseApp,
  createAppWithConfig,
  AppConfig,
} from './http';
