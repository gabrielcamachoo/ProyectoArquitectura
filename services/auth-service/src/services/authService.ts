import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, generateKeyPairSync } from 'crypto';
import { UserRepository } from '../repositories/userRepository';
import { Role, User } from '../domain/types';
import { TokenStore } from './tokenStore';

const generated = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || generated.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || generated.publicKey.export({ type: 'spki', format: 'pem' }).toString();

export class AuthService {
  constructor(private users: UserRepository, private tokenStore: TokenStore) {}

  async register(input: { fullName: string; email: string; password: string; role: Role }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new Error('email_exists');
    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      fullName: input.fullName,
      institutionalEmail: input.email,
      passwordHash,
      role: input.role,
      status: 'active',
      consent: true,
      createdAt: now,
      updatedAt: now
    };
    await this.users.create(user);
    return { id: user.id, fullName: user.fullName, institutionalEmail: user.institutionalEmail, role: user.role };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('invalid_credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('invalid_credentials');
    const token = jwt.sign({ sub: user.id, role: user.role }, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '1h' });
    const refreshToken = randomUUID();
    await this.tokenStore.set(`refresh:${refreshToken}`, user.id, 60 * 60 * 24 * 7);
    return { token, refreshToken };
  }

  async refresh(refreshToken: string) {
    const userId = await this.tokenStore.get(`refresh:${refreshToken}`);
    if (!userId) throw new Error('invalid_refresh');
    await this.tokenStore.del(`refresh:${refreshToken}`);
    const user = await this.users.findById(userId);
    if (!user) throw new Error('invalid_refresh');
    const token = jwt.sign({ sub: user.id, role: user.role }, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '1h' });
    const rotatedRefreshToken = randomUUID();
    await this.tokenStore.set(`refresh:${rotatedRefreshToken}`, user.id, 60 * 60 * 24 * 7);
    return { token, refreshToken: rotatedRefreshToken };
  }

  async logout(token: string) {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded?.exp) return;
    const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
    await this.tokenStore.set(`blacklist:${token}`, '1', ttl);
  }

  verifyToken(token: string) {
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
  }

  async isBlacklisted(token: string) {
    return Boolean(await this.tokenStore.get(`blacklist:${token}`));
  }

  async exportUserData(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new Error('not_found');
    return user;
  }

  async anonymizeUser(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new Error('not_found');
    await this.users.create({ ...user, fullName: `anon-${id}`, institutionalEmail: `${id}@deleted.local`, status: 'inactive' });
  }
}
