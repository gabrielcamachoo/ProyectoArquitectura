import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  accessToken?: string;
}

export interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}
