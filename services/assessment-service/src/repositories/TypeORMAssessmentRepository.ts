import { randomUUID } from 'crypto';
import { EvaluationEntity, Attempt, GradeEntity } from '../domain/entities';
import { AppDataSource } from './dataSource';

export type EvaluationType = 'quiz' | 'exam' | 'assignment' | 'project' | 'final';
export type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'graded' | 'annulled';

export interface EvaluationDTO {
  id: string;
  courseId: string;
  title: string;
  type: EvaluationType;
  weight: number;
  totalPoints: number;
  passThreshold: number;
  description?: string | null;
  maxAttempts: number;
  startDate?: Date | null;
  deadline?: Date | null;
  status: 'draft' | 'published' | 'archived';
  createdBy?: string | null;
  createdAt: Date;
}

export interface AttemptDTO {
  id: string;
  evaluationId: string;
  studentId: string;
  courseId: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt?: Date | null;
  submittedAt?: Date | null;
  score?: number | null;
  isPassed?: boolean | null;
  timeSpentSeconds?: number | null;
  answers?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface GradeDTO {
  id: string;
  attemptId: string;
  score: number;
  rubricScore?: number | null;
  totalPoints?: number | null;
  feedback?: string | null;
  rubricDetails?: Record<string, any> | null;
  gradedBy?: string | null;
  createdAt: Date;
}

export class TypeORMAssessmentRepository {
  private evaluationRepo = AppDataSource.getRepository(EvaluationEntity);
  private attemptRepo = AppDataSource.getRepository(Attempt);
  private gradeRepo = AppDataSource.getRepository(GradeEntity);

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
    const entity = this.evaluationRepo.create({
      id: randomUUID(),
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
      rubricConfig: input.rubricConfig || null,
      status: 'draft',
      createdBy: input.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const saved = await this.evaluationRepo.save(entity);
    return this.entityToEvaluation(saved);
  }

  async getEvaluation(id: string): Promise<EvaluationDTO | null> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['attempts']
    });
    return evaluation ? this.entityToEvaluation(evaluation) : null;
  }

  async listEvaluationsByCourse(courseId: string, filters?: { status?: string }): Promise<EvaluationDTO[]> {
    const query = this.evaluationRepo.createQueryBuilder('e')
      .where('e.courseId = :courseId', { courseId });
      
    if (filters?.status) {
      query.andWhere('e.status = :status', { status: filters.status });
    }
    
    const evals = await query.getMany();
    return evals.map(e => this.entityToEvaluation(e));
  }

  async findAllEvaluations(): Promise<EvaluationDTO[]> {
    const evals = await this.evaluationRepo.find({ where: { status: 'published' } });
    return evals.map(e => this.entityToEvaluation(e));
  }

  async publishEvaluation(id: string, publishedBy: string): Promise<EvaluationDTO | null> {
    const evaluation = await this.evaluationRepo.findOneBy({ id });
    if (!evaluation) return null;

    evaluation.status = 'published';
    evaluation.updatedBy = publishedBy;
    evaluation.updatedAt = new Date();
    const saved = await this.evaluationRepo.save(evaluation);
    return this.entityToEvaluation(saved);
  }

  // ============ ATTEMPT METHODS ============
  async createAttempt(input: {
    evaluationId: string;
    studentId: string;
    courseId: string;
    attemptNumber?: number;
  }): Promise<AttemptDTO> {
    const entity = this.attemptRepo.create({
      id: randomUUID(),
      evaluationId: input.evaluationId,
      studentId: input.studentId,
      courseId: input.courseId,
      status: 'created',
      attemptNumber: input.attemptNumber || 1,
      startedAt: null,
      submittedAt: null,
      score: null,
      isPassed: null,
      answers: null,
      timeSpentSeconds: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const saved = await this.attemptRepo.save(entity);
    return this.entityToAttempt(saved);
  }

  async getAttempt(id: string): Promise<AttemptDTO | null> {
    const attempt = await this.attemptRepo.findOne({
      where: { id },
      relations: ['grade']
    });
    return attempt ? this.entityToAttempt(attempt) : null;
  }

  async listAttemptsByStudentAndEvaluation(studentId: string, evaluationId: string): Promise<AttemptDTO[]> {
    const attempts = await this.attemptRepo.find({
      where: { studentId, evaluationId },
      order: { attemptNumber: 'DESC' }
    });
    return attempts.map(a => this.entityToAttempt(a));
  }

  async startAttempt(attemptId: string): Promise<AttemptDTO | null> {
    const attempt = await this.attemptRepo.findOneBy({ id: attemptId });
    if (!attempt) return null;

    attempt.status = 'in_progress';
    attempt.startedAt = new Date();
    attempt.updatedAt = new Date();
    const saved = await this.attemptRepo.save(attempt);
    return this.entityToAttempt(saved);
  }

  async submitAttempt(attemptId: string, answers: Record<string, any>, timeSpentSeconds?: number): Promise<AttemptDTO | null> {
    const attempt = await this.attemptRepo.findOneBy({ id: attemptId });
    if (!attempt || attempt.status !== 'in_progress') return null;

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.answers = answers;
    attempt.timeSpentSeconds = timeSpentSeconds || 0;
    attempt.updatedAt = new Date();
    const saved = await this.attemptRepo.save(attempt);
    return this.entityToAttempt(saved);
  }

  async updateAttemptScore(attemptId: string, score: number, isPassed: boolean): Promise<AttemptDTO | null> {
    const attempt = await this.attemptRepo.findOneBy({ id: attemptId });
    if (!attempt) return null;

    attempt.score = score;
    attempt.isPassed = isPassed;
    attempt.updatedAt = new Date();
    const saved = await this.attemptRepo.save(attempt);
    return this.entityToAttempt(saved);
  }

  async markAttemptAsGraded(attemptId: string): Promise<AttemptDTO | null> {
    const attempt = await this.attemptRepo.findOneBy({ id: attemptId });
    if (!attempt || attempt.status !== 'submitted') return null;

    attempt.status = 'graded';
    attempt.updatedAt = new Date();
    const saved = await this.attemptRepo.save(attempt);
    return this.entityToAttempt(saved);
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
    const entity = this.gradeRepo.create({
      id: randomUUID(),
      attemptId: input.attemptId,
      score: input.score,
      rubricScore: input.rubricScore || null,
      totalPoints: input.totalPoints || null,
      feedback: input.feedback || null,
      rubricDetails: input.rubricDetails || null,
      gradedBy: input.gradedBy || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const saved = await this.gradeRepo.save(entity);
    return this.entityToGrade(saved);
  }

  async getGradeByAttempt(attemptId: string): Promise<GradeDTO | null> {
    const grade = await this.gradeRepo.findOneBy({ attemptId });
    return grade ? this.entityToGrade(grade) : null;
  }

  async updateGrade(gradeId: string, input: { score?: number; feedback?: string; rubricDetails?: Record<string, any> }): Promise<GradeDTO | null> {
    const grade = await this.gradeRepo.findOneBy({ id: gradeId });
    if (!grade) return null;

    if (input.score !== undefined) grade.score = input.score;
    if (input.feedback !== undefined) grade.feedback = input.feedback;
    if (input.rubricDetails !== undefined) grade.rubricDetails = input.rubricDetails;

    grade.updatedAt = new Date();
    const saved = await this.gradeRepo.save(grade);
    return this.entityToGrade(saved);
  }

  // ============ HELPERS ============
  private entityToEvaluation(entity: EvaluationEntity): EvaluationDTO {
    return {
      id: entity.id,
      courseId: entity.courseId,
      title: entity.title,
      type: entity.type,
      weight: Number(entity.weight),
      totalPoints: entity.totalPoints,
      passThreshold: Number(entity.passThreshold),
      description: entity.description,
      maxAttempts: entity.maxAttempts,
      startDate: entity.startDate,
      deadline: entity.deadline,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt
    };
  }

  private entityToAttempt(entity: Attempt): AttemptDTO {
    return {
      id: entity.id,
      evaluationId: entity.evaluationId,
      studentId: entity.studentId,
      courseId: entity.courseId,
      status: entity.status,
      attemptNumber: entity.attemptNumber,
      startedAt: entity.startedAt,
      submittedAt: entity.submittedAt,
      score: entity.score ? Number(entity.score) : null,
      isPassed: entity.isPassed,
      timeSpentSeconds: entity.timeSpentSeconds,
      createdAt: entity.createdAt
    };
  }

  private entityToGrade(entity: GradeEntity): GradeDTO {
    return {
      id: entity.id,
      attemptId: entity.attemptId,
      score: Number(entity.score),
      rubricScore: entity.rubricScore ? Number(entity.rubricScore) : null,
      totalPoints: entity.totalPoints,
      feedback: entity.feedback,
      rubricDetails: entity.rubricDetails,
      gradedBy: entity.gradedBy,
      createdAt: entity.createdAt
    };
  }
}
