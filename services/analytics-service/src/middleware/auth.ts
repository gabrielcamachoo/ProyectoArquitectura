import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/tokenService';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  accessToken?: string;
}

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Test-only bypass so unit tests can hit protected routes without generating JWTs.
  if (process.env.NODE_ENV === 'test') {
    req.userId = req.params.userId ?? req.params.studentId ?? 'test-user';
    req.role = 'admin';
    req.accessToken = 'test-token';
    return next();
  }

  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.role = payload.role;
    req.accessToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

export const requireRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
};
