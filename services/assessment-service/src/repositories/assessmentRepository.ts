import { TypeORMAssessmentRepository, EvaluationDTO, AttemptDTO, GradeDTO, EvaluationType, AttemptStatus } from './TypeORMAssessmentRepository';
import { AppDataSource } from './dataSource';

/**
 * Hybrid assessment repository - PostgreSQL primary + in-memory fallback
 */
export class AssessmentRepository {
  private typeormRepo: TypeORMAssessmentRepository;
  private inMemoryEvaluations = new Map<string, EvaluationDTO>();
  private inMemoryAttempts = new Map<string, AttemptDTO>();
  private inMemoryGrades = new Map<string, GradeDTO>();
  private get usePostgres(): boolean {
    return AppDataSource.isInitialized;
  }

  constructor() {
    this.typeormRepo = new TypeORMAssessmentRepository();
  }

  // ============ EVALUATION METHODS ============
  async createEvaluation(input: {
    courseId: string;
    title: string;
    type: EvaluationType;
    weight: number;
    totalPoints?: number;
    passThreshold?: number;
    description?: string;
    maxAttempts?: number;
    startDate?: Date;
    deadline?: Date;
    rubricConfig?: Record<string, any>;
    createdBy: string;
  }): Promise<EvaluationDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createEvaluation(input);
    }

    const evaluation: EvaluationDTO = {
      id: this.generateId(),
      courseId: input.courseId,
      title: input.title,
      type: input.type,
      weight: input.weight,
      totalPoints: input.totalPoints || 100,
      passThreshold: input.passThreshold || 60,
      description: input.description || null,
      maxAttempts: input.maxAttempts || 1,
      startDate: input.startDate || null,
      deadline: input.deadline || null,
      status: 'draft',
      createdBy: input.createdBy,
      createdAt: new Date()
    };

    this.inMemoryEvaluations.set(evaluation.id, evaluation);
    return evaluation;
  }

  async getEvaluation(id: string): Promise<EvaluationDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getEvaluation(id);
    }
    return this.inMemoryEvaluations.get(id) || null;
  }

  async listEvaluationsByCourse(courseId: string, filters?: { status?: string }): Promise<EvaluationDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listEvaluationsByCourse(courseId, filters);
    }

    let evals = Array.from(this.inMemoryEvaluations.values())
      .filter(e => e.courseId === courseId);

    if (filters?.status) {
      evals = evals.filter(e => e.status === filters.status);
    }

    return evals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async publishEvaluation(id: string, publishedBy: string): Promise<EvaluationDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.publishEvaluation(id, publishedBy);
    }

    const evaluation = this.inMemoryEvaluations.get(id);
    if (!evaluation) return null;

    evaluation.status = 'published';
    return evaluation;
  }

  // ============ ATTEMPT METHODS ============
  async createAttempt(input: {
    evaluationId: string;
    studentId: string;
    courseId: string;
    attemptNumber?: number;
  }): Promise<AttemptDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createAttempt(input);
    }

    const attempt: AttemptDTO = {
      id: this.generateId(),
      evaluationId: input.evaluationId,
      studentId: input.studentId,
      courseId: input.courseId,
      status: 'created',
      attemptNumber: input.attemptNumber || 1,
      startedAt: null,
      submittedAt: null,
      score: null,
      isPassed: null,
      timeSpentSeconds: null,
      createdAt: new Date()
    };

    this.inMemoryAttempts.set(attempt.id, attempt);
    return attempt;
  }

  async getAttempt(id: string): Promise<AttemptDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getAttempt(id);
    }
    return this.inMemoryAttempts.get(id) || null;
  }

  async listAttemptsByStudentAndEvaluation(studentId: string, evaluationId: string): Promise<AttemptDTO[]> {
    if (this.usePostgres) {
      return this.typeormRepo.listAttemptsByStudentAndEvaluation(studentId, evaluationId);
    }

    const attempts = Array.from(this.inMemoryAttempts.values())
      .filter(a => a.studentId === studentId && a.evaluationId === evaluationId)
      .sort((a, b) => b.attemptNumber - a.attemptNumber);

    return attempts;
  }

  async startAttempt(attemptId: string): Promise<AttemptDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.startAttempt(attemptId);
    }

    const attempt = this.inMemoryAttempts.get(attemptId);
    if (!attempt) return null;

    attempt.status = 'in_progress';
    attempt.startedAt = new Date();
    return attempt;
  }

  async submitAttempt(attemptId: string, answers: Record<string, any>, timeSpentSeconds?: number): Promise<AttemptDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.submitAttempt(attemptId, answers, timeSpentSeconds);
    }

    const attempt = this.inMemoryAttempts.get(attemptId);
    if (!attempt || attempt.status !== 'in_progress') return null;

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.timeSpentSeconds = timeSpentSeconds || 0;
    return attempt;
  }

  async updateAttemptScore(attemptId: string, score: number, isPassed: boolean): Promise<AttemptDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.updateAttemptScore(attemptId, score, isPassed);
    }

    const attempt = this.inMemoryAttempts.get(attemptId);
    if (!attempt) return null;

    attempt.score = score;
    attempt.isPassed = isPassed;
    return attempt;
  }

  async markAttemptAsGraded(attemptId: string): Promise<AttemptDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.markAttemptAsGraded(attemptId);
    }

    const attempt = this.inMemoryAttempts.get(attemptId);
    if (!attempt || attempt.status !== 'submitted') return null;

    attempt.status = 'graded';
    return attempt;
  }

  // ============ GRADE METHODS ============
  async createGrade(input: {
    attemptId: string;
    score: number;
    rubricScore?: number;
    totalPoints?: number;
    feedback?: string;
    rubricDetails?: Record<string, any>;
    gradedBy?: string;
  }): Promise<GradeDTO> {
    if (this.usePostgres) {
      return this.typeormRepo.createGrade(input);
    }

    const grade: GradeDTO = {
      id: this.generateId(),
      attemptId: input.attemptId,
      score: input.score,
      rubricScore: input.rubricScore || null,
      totalPoints: input.totalPoints || null,
      feedback: input.feedback || null,
      rubricDetails: input.rubricDetails || null,
      gradedBy: input.gradedBy || null,
      createdAt: new Date()
    };

    this.inMemoryGrades.set(grade.id, grade);
    return grade;
  }

  async getGradeByAttempt(attemptId: string): Promise<GradeDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.getGradeByAttempt(attemptId);
    }

    return Array.from(this.inMemoryGrades.values())
      .find(g => g.attemptId === attemptId) || null;
  }

  async updateGrade(gradeId: string, input: { score?: number; feedback?: string; rubricDetails?: Record<string, any> }): Promise<GradeDTO | null> {
    if (this.usePostgres) {
      return this.typeormRepo.updateGrade(gradeId, input);
    }

    const grade = this.inMemoryGrades.get(gradeId);
    if (!grade) return null;

    if (input.score !== undefined) grade.score = input.score;
    if (input.feedback !== undefined) grade.feedback = input.feedback;
    if (input.rubricDetails !== undefined) grade.rubricDetails = input.rubricDetails;

    return grade;
  }

  // ============ HELPERS ============
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Singleton instance
let repositoryInstance: AssessmentRepository | null = null;

export function getAssessmentRepository(): AssessmentRepository {
  if (!repositoryInstance) {
    repositoryInstance = new AssessmentRepository();
  }
  return repositoryInstance;
}
