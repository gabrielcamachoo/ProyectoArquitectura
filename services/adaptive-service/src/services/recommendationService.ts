import Redis from 'ioredis';
import CircuitBreaker from 'opossum';
import { computeRecommendation, EvaluationCompletedEvent } from '../rules/recommendationEngine';
import { publishRecommendationGenerated } from '../messaging/publisher';

const cacheTtl = 300;

export class RecommendationService {
  private redis?: Redis;
  private cache = new Map<string, string>();
  private breaker: any;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: false });
      this.redis.on('error', () => undefined);
    }

    this.breaker = new CircuitBreaker(async (event: EvaluationCompletedEvent) => {
      const result = computeRecommendation(event);
      return JSON.stringify({ ...result, studentId: event.student_id, courseId: event.course_id, generatedAt: new Date().toISOString() });
    }, {
      errorThresholdPercentage: 50,
      rollingCountTimeout: 10_000,
      resetTimeout: 30_000
    });

    this.breaker.fallback((event: EvaluationCompletedEvent) => JSON.stringify({
      type: 'recurso_complementario',
      materialScope: 'related_courses',
      studentId: event.student_id,
      courseId: event.course_id,
      fallback: true
    }));
  }

  async generate(event: EvaluationCompletedEvent) {
    const recommendation = await this.breaker.fire(event);
    await this.set(`recommendations:${event.student_id}`, recommendation, cacheTtl);
    await this.set(`dashboard:${event.course_id}`, recommendation, cacheTtl);
    const parsed = JSON.parse(recommendation);
    await publishRecommendationGenerated({
      version: 'v1',
      user_id: event.student_id,
      userId: event.student_id,
      type: 'recomendacion',
      content: parsed
    });
    return parsed;
  }

  async getStudentRecommendations(studentId: string) {
    const value = await this.get(`recommendations:${studentId}`);
    return value ? JSON.parse(value) : null;
  }

  private async set(key: string, value: string, ttl: number) {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttl);
      return;
    }
    this.cache.set(key, value);
    setTimeout(() => this.cache.delete(key), ttl * 1000);
  }

  private async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    return this.cache.get(key) ?? null;
  }
}
