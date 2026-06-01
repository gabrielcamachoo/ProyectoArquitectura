import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, generateKeyPairSync } from 'crypto';
import { UserRepository } from '../repositories/userRepository';
import { Role, User, UserExport } from '../domain/types';
import { TokenStore } from './tokenStore';

const generated = generateKeyPairSync('rsa', { modulusLength: 2048 });
const isPlaceholderKey = (value?: string) =>
  !value || value.includes('<rsa-') || !value.includes('BEGIN');
const normalizeKey = (value: string | undefined, fallback: string): string => {
  if (isPlaceholderKey(value)) return fallback;
  return value!.replace(/\\n/g, '\n');
};
const PRIVATE_KEY = normalizeKey(
  process.env.JWT_PRIVATE_KEY,
  generated.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
);
const PUBLIC_KEY = normalizeKey(
  process.env.JWT_PUBLIC_KEY,
  generated.publicKey.export({ type: 'spki', format: 'pem' }).toString()
);

const INSTITUTIONAL_EMAIL_REGEX = /^[a-z0-9._%+-]+@(javeriana\.edu\.co|puj\.edu\.co|estudiantes\.puj\.edu\.co)$/i;
const PASSWORD_MIN_LENGTH = 8;

export class AuthService {
  constructor(private users: UserRepository, private tokenStore: TokenStore) {}

  private validateEmail(email: string): boolean {
    return INSTITUTIONAL_EMAIL_REGEX.test(email);
  }

  private validatePassword(password: string): boolean {
    if (password.length < PASSWORD_MIN_LENGTH) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }

  async register(input: {
    fullName: string;
    institutionalEmail: string;
    password: string;
    role?: Role;
  }) {
    if (!input.fullName || input.fullName.trim().length === 0) {
      throw new Error('fullName_required');
    }
    if (!input.institutionalEmail) {
      throw new Error('email_required');
    }
    if (!this.validateEmail(input.institutionalEmail)) {
      throw new Error('email_invalid_format');
    }
    if (!input.password) {
      throw new Error('password_required');
    }
    if (!this.validatePassword(input.password)) {
      throw new Error('password_weak');
    }

    const existing = await this.users.findByEmail(input.institutionalEmail);
    if (existing) {
      throw new Error('email_exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      fullName: input.fullName,
      institutionalEmail: input.institutionalEmail,
      passwordHash,
      role: input.role || 'student',
      status: 'active',
      consent: true,
      createdAt: now,
      updatedAt: now
    };

    await this.users.create(user);
    console.log(`[LEY_1581] User registered with consent: ${user.id} at ${now}`);

    return {
      id: user.id,
      fullName: user.fullName,
      institutionalEmail: user.institutionalEmail,
      role: user.role,
      status: user.status
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new Error('email_password_required');
    }

    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new Error('invalid_credentials');
    }

    if (user.status === 'inactive') {
      throw new Error('user_inactive');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('invalid_credentials');
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        iss: 'auth-jwt-key',
        email: user.institutionalEmail
      },
      PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: '1h' }
    );

    const refreshToken = randomUUID();
    await this.tokenStore.set(
      `refresh:${refreshToken}`,
      user.id,
      60 * 60 * 24 * 7
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        institutionalEmail: user.institutionalEmail,
        role: user.role
      }
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('refresh_token_required');
    }

    const userId = await this.tokenStore.get(`refresh:${refreshToken}`);
    if (!userId) {
      throw new Error('invalid_refresh');
    }

    await this.tokenStore.del(`refresh:${refreshToken}`);

    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error('invalid_refresh');
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        iss: 'auth-jwt-key',
        email: user.institutionalEmail
      },
      PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: '1h' }
    );

    const rotatedRefreshToken = randomUUID();
    await this.tokenStore.set(
      `refresh:${rotatedRefreshToken}`,
      user.id,
      60 * 60 * 24 * 7
    );

    return { accessToken, refreshToken: rotatedRefreshToken };
  }

  async logout(token: string) {
    if (!token) return;

    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded?.exp) return;

      const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
      await this.tokenStore.set(`blacklist:${token}`, '1', ttl);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  verifyToken(token: string) {
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return Boolean(await this.tokenStore.get(`blacklist:${token}`));
  }

  async exportUserData(id: string): Promise<UserExport> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new Error('not_found');
    }

    console.log(`[LEY_1581] User data export requested: ${id}`);

    return {
      ...user,
      passwordHashMasked: '****'
    };
  }

  async deleteUserData(id: string) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new Error('not_found');
    }

    console.log(`[LEY_1581] User data deletion requested: ${id}`);

    await this.users.update({
      ...user,
      fullName: `anonymous-${id}`,
      institutionalEmail: `deleted-${id}@purged.local`,
      status: 'inactive'
    });
  }

  async listUsers() {
    return this.users.listPublic();
  }
}
