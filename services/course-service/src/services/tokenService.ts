import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

let publicKey: string | null = null;

const getPublicKey = (): string => {
  if (!publicKey) {
    const keyPath = path.join(__dirname, '../../keys/jwt.pub');
    if (fs.existsSync(keyPath)) {
      publicKey = fs.readFileSync(keyPath, 'utf8');
    } else {
      // Fallback: use default key (in development)
      publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890
-----END PUBLIC KEY-----`;
    }
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
