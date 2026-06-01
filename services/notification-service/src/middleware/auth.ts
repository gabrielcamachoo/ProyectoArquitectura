import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/tokenService';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  accessToken?: string;
}

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const requireSelfOrRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId, role } = req;
  const { userId: targetUserId } = req.params;

  // Allow if requesting own data
  if (userId === targetUserId) {
    return next();
  }

  // Allow if user has one of the required roles
  if (role && roles.includes(role)) {
    return next();
  }

  res.status(403).json({ error: 'forbidden' });
};
