import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RecommendationEntity } from '../domain/entities/Recommendation';
import { AppDataSource } from './dataSource';
import { RecommendationOutput } from '../rules/recommendationEngine';
import { InMemoryRepository } from './baseRepository';

export interface StoredRecommendation extends RecommendationOutput {
  id: string;
  generatedAt: string;
  fallback?: boolean;
}

export interface RecommendationRepository {
  save(recommendation: RecommendationOutput & { fallback?: boolean }): Promise<StoredRecommendation>;
  listByStudent(studentId: string, limit?: number): Promise<StoredRecommendation[]>;
}

class TypeORMRecommendationRepository implements RecommendationRepository {
  private repo: Repository<RecommendationEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(RecommendationEntity);
  }

  async save(recommendation: RecommendationOutput & { fallback?: boolean }): Promise<StoredRecommendation> {
    const entity = this.repo.create({
      id: uuidv4(),
      studentId: recommendation.studentId,
      courseId: recommendation.courseId,
      evaluationId: recommendation.evaluationId,
      type: recommendation.type,
      scope: recommendation.scope,
      reasoning: recommendation.reasoning,
      score: recommendation.score,
      resource: recommendation.resource,
      fallback: recommendation.fallback ?? false
    });
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async listByStudent(studentId: string, limit = 10): Promise<StoredRecommendation[]> {
    const rows = await this.repo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: limit
    });
    return rows.map((row) => this.toDto(row));
  }

  private toDto(entity: RecommendationEntity): StoredRecommendation {
    return {
      id: entity.id,
      studentId: entity.studentId,
      courseId: entity.courseId,
      evaluationId: entity.evaluationId ?? '',
      type: entity.type as StoredRecommendation['type'],
      scope: entity.scope as StoredRecommendation['scope'],
      score: entity.score,
      reasoning: entity.reasoning ?? '',
      resource: (entity.resource as StoredRecommendation['resource']) ?? {
        title: 'Recurso',
        action: 'review',
        priority: 'medium'
      },
      generatedAt: entity.createdAt.toISOString(),
      fallback: entity.fallback
    };
  }
}

class InMemoryRecommendationRepository implements RecommendationRepository {
  private store = new InMemoryRepository<StoredRecommendation>();

  async save(recommendation: RecommendationOutput & { fallback?: boolean }): Promise<StoredRecommendation> {
    const stored: StoredRecommendation = {
      ...recommendation,
      id: uuidv4(),
      generatedAt: new Date().toISOString(),
      fallback: recommendation.fallback
    };
    return this.store.save(stored);
  }

  async listByStudent(studentId: string, limit = 10): Promise<StoredRecommendation[]> {
    const all = await this.store.list();
    return all
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, limit);
  }
}

let repositoryInstance: RecommendationRepository | null = null;

export async function getRecommendationRepository(): Promise<RecommendationRepository> {
  if (repositoryInstance) return repositoryInstance;

  if (process.env.DATABASE_URL) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      repositoryInstance = new TypeORMRecommendationRepository();
      return repositoryInstance;
    } catch (error) {
      console.warn('[RecommendationRepository] PostgreSQL unavailable, using in-memory:', (error as Error).message);
    }
  }

  repositoryInstance = new InMemoryRecommendationRepository();
  return repositoryInstance;
}
