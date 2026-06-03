import Redis from 'ioredis';
import CircuitBreaker from 'opossum';
import {
  computeRecommendation,
  EvaluationCompletedEvent,
  RecommendationOutput
} from '../rules/recommendationEngine';
import { publishRecommendationGenerated } from '../messaging/publisher';
import { getRecommendationRepository, StoredRecommendation } from '../repositories/recommendationRepository';

const CACHE_TTL_SECONDS = 300;

export interface ConsumerMetrics {
  processed: number;
  failed: number;
  lastProcessedAt?: string;
  lastError?: string;
}

export class RecommendationService {
  private redis?: Redis;
  private memoryCache = new Map<string, string>();
  private breaker: InstanceType<typeof CircuitBreaker>;
  private metrics: ConsumerMetrics = { processed: 0, failed: 0 };

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: false });
      this.redis.on('error', () => undefined);
    }

    this.breaker = new CircuitBreaker(
      async (event: EvaluationCompletedEvent) => computeRecommendation(event),
      {
        errorThresholdPercentage: 50,
        rollingCountTimeout: 10_000,
        resetTimeout: 30_000,
        timeout: 5000
      }
    );

    this.breaker.fallback((event: EvaluationCompletedEvent) => ({
      studentId: event.studentId,
      courseId: event.courseId,
      evaluationId: event.evaluationId,
      type: 'recurso_complementario',
      scope: 'related_courses',
      score: event.score,
      reasoning: 'Recomendación genérica por indisponibilidad temporal del motor adaptivo.',
      resource: {
        title: 'Recursos generales',
        action: 'explore_related_courses',
        priority: 'low'
      }
    }));
  }

  getMetrics(): ConsumerMetrics {
    return { ...this.metrics };
  }

  isCircuitOpen(): boolean {
    return this.breaker.opened;
  }

  async generate(event: EvaluationCompletedEvent): Promise<StoredRecommendation> {
    try {
      const output = await this.breaker.fire(event);
      const fallback = this.breaker.opened;
      const repo = await getRecommendationRepository();
      const stored = await repo.save({ ...output, fallback });

      const cachePayload = JSON.stringify([stored]);
      await this.set(`recommendations:${event.studentId}`, cachePayload, CACHE_TTL_SECONDS);
      await this.set(`dashboard:${event.courseId}`, cachePayload, CACHE_TTL_SECONDS);

      await publishRecommendationGenerated({
        event: 'recomendacion.generada.v1',
        studentId: stored.studentId,
        recommendationType: stored.type,
        courseId: stored.courseId,
        materials: [stored.resource?.title].filter(Boolean)
      });

      this.metrics.processed += 1;
      this.metrics.lastProcessedAt = new Date().toISOString();
      return stored;
    } catch (error) {
      this.metrics.failed += 1;
      this.metrics.lastError = (error as Error).message;
      throw error;
    }
  }

  async getStudentRecommendations(studentId: string): Promise<StoredRecommendation[]> {
    const cached = await this.get(`recommendations:${studentId}`);
    if (cached) {
      return JSON.parse(cached) as StoredRecommendation[];
    }

    const repo = await getRecommendationRepository();
    return repo.listByStudent(studentId);
  }

  private async set(key: string, value: string, ttl: number) {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttl);
      return;
    }
    this.memoryCache.set(key, value);
    setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
  }

  private async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    return this.memoryCache.get(key) ?? null;
  }
}
