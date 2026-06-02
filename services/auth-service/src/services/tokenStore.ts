import Redis from 'ioredis';

export class TokenStore {
  private redis?: Redis;
  private local = new Map<string, string>();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: false });
      this.redis.on('error', () => undefined);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
      return;
    }
    this.local.set(key, value);
    const timeout = setTimeout(() => this.local.delete(key), ttlSeconds * 1000);
    timeout.unref?.();
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) {
      return this.redis.get(key);
    }
    return this.local.get(key) ?? null;
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.local.delete(key);
  }
}
