import { TypeORMAnalyticsRepository } from '../repositories/TypeORMAnalyticsRepository';

export class CqrsAnalyticsService {
  private repo: TypeORMAnalyticsRepository;

  constructor(
    private readonly writeDbUrl = process.env.DATABASE_URL ?? 'postgres://primary',
    private readonly readDbUrl = process.env.DATABASE_READ_URL ?? process.env.DATABASE_URL ?? 'postgres://replica'
  ) {
    this.repo = new TypeORMAnalyticsRepository(this.readDbUrl);
  }

  getConnections() {
    return { write: this.writeDbUrl, read: this.readDbUrl };
  }

  async getCourseDashboard(courseId: string) {
    return this.repo.getCourseDashboard(courseId);
  }

  async getStudentProgress(courseId: string) {
    return this.repo.getStudentProgress(courseId);
  }
}
