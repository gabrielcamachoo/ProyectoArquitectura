import { NextFunction, Response } from 'express';
import { AuthRequest } from './types';
import { verifyToken } from './tokenService';

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

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

export const requireSelfOrRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const role = req.role;
  const resourceUserId = req.params.userId ?? req.params.id ?? req.params.studentId;

  if (userId === resourceUserId) {
    return next();
  }

  if (role && roles.includes(role)) {
    return next();
  }

  return res.status(403).json({ error: 'forbidden' });
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
