import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from './types';

let publicKey: string | null = null;

const getPublicKey = (): string => {
  if (!publicKey) {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', '..', 'kong', 'jwt-public.pem'),
      path.join(__dirname, '..', '..', 'keys', 'jwt.pub'),
      path.join(process.cwd(), 'keys', 'jwt.pub'),
      path.join(process.cwd(), 'kong', 'jwt-public.pem'),
    ];

    for (const keyPath of possiblePaths) {
      if (fs.existsSync(keyPath)) {
        publicKey = fs.readFileSync(keyPath, 'utf8');
        return publicKey;
      }
    }

    // Fallback: use environment variable or fail
    const envKey = process.env.JWT_PUBLIC_KEY?.replace(/\n/g, '\n');
    if (envKey) {
      publicKey = envKey;
      return publicKey;
    }

    throw new Error(
      'JWT Public Key not found. Please set JWT_PUBLIC_KEY environment variable or provide a key file.'
    );
  }
  return publicKey;
};

export const verifyToken = (token: string): TokenPayload => {
  const key = getPublicKey();
  const payload = jwt.verify(token, key, {
    algorithms: ['RS256'],
    issuer: 'auth-jwt-key'
  }) as TokenPayload;
  return payload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const tokenService = {
  verifyToken,
  decodeToken,
  getPublicKey,
};
