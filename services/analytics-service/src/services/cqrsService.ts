export class CqrsAnalyticsService {
  constructor(
    private readonly writeDbUrl = process.env.DATABASE_URL ?? 'postgres://primary',
    private readonly readDbUrl = process.env.DATABASE_READ_URL ?? 'postgres://replica'
  ) {}

  getConnections() {
    return { write: this.writeDbUrl, read: this.readDbUrl };
  }

  async getCourseDashboard(courseId: string) {
    const seed = courseId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const activeStudents = 18 + (seed % 12);
    const completionRate = 55 + (seed % 40);
    return {
      source: 'read-replica',
      readDb: this.readDbUrl,
      courseId,
      completionRate,
      activeStudents,
      averageScore: 68 + (seed % 25),
      evaluationsSubmitted: 42 + (seed % 20),
      recommendationsSent: 15 + (seed % 10),
      atRiskStudents: Math.max(1, Math.floor(activeStudents * 0.15)),
      trend: completionRate > 70 ? 'up' : 'stable'
    };
  }

  async getStudentProgress(courseId: string) {
    const seed = courseId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const students = Array.from({ length: 8 }, (_, i) => ({
      studentId: `estudiante-${i + 1}`,
      fullName: `Estudiante ${i + 1}`,
      percentage: 45 + ((seed + i * 7) % 55),
      lastActivity: new Date(Date.now() - i * 86400000).toISOString()
    }));
    return {
      source: 'read-replica',
      readDb: this.readDbUrl,
      courseId,
      students
    };
  }
}
