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
    return {
      source: 'read-replica',
      readDb: this.readDbUrl,
      courseId,
      completionRate: seed % 100,
      activeStudents: seed % 27
    };
  }

  async getStudentProgress(courseId: string) {
    return {
      source: 'read-replica',
      readDb: this.readDbUrl,
      courseId,
      students: [
        { studentId: `${courseId}-student-1`, percentage: 72 },
        { studentId: `${courseId}-student-2`, percentage: 88 }
      ] as Array<{ studentId: string; percentage: number }>
    };
  }
}
