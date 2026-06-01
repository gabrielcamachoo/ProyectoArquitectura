import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';

export const authGuard = (authService: AuthService) => async (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const token = header.slice(7);
  if (await authService.isBlacklisted(token)) return res.status(401).json({ error: 'blacklisted' });
  try {
    const payload = authService.verifyToken(token) as { sub: string; role: string };
    const authenticated = req as Request & { userId: string; role: string; accessToken: string };
    authenticated.userId = payload.sub;
    authenticated.role = payload.role;
    authenticated.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
};

export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const role = (req as Request & { role?: string }).role;
  if (!role || !roles.includes(role)) return res.status(403).json({ error: 'forbidden' });
  next();
};

export const requireSelfOrRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const context = req as Request & { userId?: string; role?: string };
  const resourceUserId = req.params.userId ?? req.params.id ?? req.params.studentId;
  if (context.userId === resourceUserId) {
    next();
    return;
  }
  if (context.role && roles.includes(context.role)) {
    next();
    return;
  }
  res.status(403).json({ error: 'forbidden' });
};
