export { authGuard, requireRole, requireSelfOrRole, optionalAuth } from './authGuard';
export { verifyToken, decodeToken, tokenService } from './tokenService';
export type { AuthRequest, TokenPayload } from './types';
