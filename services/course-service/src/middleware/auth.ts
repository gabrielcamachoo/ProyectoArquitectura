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

export const requireRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
};

export const optional = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.role = payload.role;
    req.accessToken = token;
  } catch (error) {
    // If token is invalid, just continue without auth
  }
  next();
};
