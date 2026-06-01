import { getAssessmentRepository, AssessmentRepository } from '../repositories/assessmentRepository';
import { EvaluationDTO, AttemptDTO, GradeDTO, EvaluationType } from '../repositories/TypeORMAssessmentRepository';
import { publishEvaluationCompleted } from '../messaging/publisher';

interface GradingRules {
  autoGrade?: boolean; // Auto-calculate score if true
  rubricWeights?: Record<string, number>; // e.g. { "correctness": 0.7, "style": 0.3 }
  passingScore?: number; // % to pass (defaults to eval's passThreshold)
}

/**
 * AssessmentService - Business logic for assessment/grading
 * CRITICAL: gradeAttempt() MUST complete <2s without waiting for RabbitMQ
 */
export class AssessmentService {
  private repo: AssessmentRepository;

  constructor() {
    this.repo = getAssessmentRepository();
  }

  // ============ EVALUATION SERVICE METHODS ============

  /**
   * Create evaluation for a course
   */
  async createEvaluation(input: {
    courseId: string;
    title: string;
    type: EvaluationType;
    weight: number;
    totalPoints?: number;
    passThreshold?: number;
    description?: string;
    maxAttempts?: number;
    createdBy: string;
    deadline?: Date;
  }): Promise<EvaluationDTO> {
    // Validations
    if (!input.courseId || !input.title || !input.type || input.weight === undefined) {
      throw new Error('missing_required_fields');
    }

    if (input.weight < 0 || input.weight > 100) {
      throw new Error('weight_must_be_0_to_100');
    }

    if (input.passThreshold && (input.passThreshold < 0 || input.passThreshold > 100)) {
      throw new Error('pass_threshold_must_be_0_to_100');
    }

    const evaluation = await this.repo.createEvaluation(input);
    console.log(`[AssessmentService] Evaluation created: ${evaluation.id} for course ${input.courseId}`);
    return evaluation;
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluation(evaluationId: string): Promise<EvaluationDTO> {
    if (!evaluationId) {
      throw new Error('evaluation_id_required');
    }

    const evaluation = await this.repo.getEvaluation(evaluationId);
    if (!evaluation) {
      throw new Error('evaluation_not_found');
    }

    return evaluation;
  }

  /**
   * List evaluations for a course
   */
  async listEvaluationsByCourse(courseId: string, filters?: { status?: string }): Promise<EvaluationDTO[]> {
    if (!courseId) {
      throw new Error('course_id_required');
    }

    return this.repo.listEvaluationsByCourse(courseId, filters);
  }

  /**
   * Publish evaluation (change from draft to published)
   */
  async publishEvaluation(evaluationId: string, publishedBy: string): Promise<EvaluationDTO> {
    if (!evaluationId) {
      throw new Error('evaluation_id_required');
    }

    const evaluation = await this.repo.getEvaluation(evaluationId);
    if (!evaluation) {
      throw new Error('evaluation_not_found');
    }

    if (evaluation.status !== 'draft') {
      throw new Error('only_draft_evaluations_can_publish');
    }

    const published = await this.repo.publishEvaluation(evaluationId, publishedBy);
    if (!published) {
      throw new Error('publish_failed');
    }

    console.log(`[AssessmentService] Evaluation published: ${evaluationId}`);
    return published;
  }

  // ============ ATTEMPT SERVICE METHODS ============

  /**
   * Create new attempt for student
   */
  async createAttempt(evaluationId: string, studentId: string, courseId: string): Promise<AttemptDTO> {
    if (!evaluationId || !studentId || !courseId) {
      throw new Error('missing_required_fields');
    }

    const evaluation = await this.repo.getEvaluation(evaluationId);
    if (!evaluation) {
      throw new Error('evaluation_not_found');
    }

    // Check if student already has attempts
    const previousAttempts = await this.repo.listAttemptsByStudentAndEvaluation(studentId, evaluationId);
    if (previousAttempts.length >= evaluation.maxAttempts) {
      throw new Error('max_attempts_reached');
    }

    const attemptNumber = previousAttempts.length + 1;
    const attempt = await this.repo.createAttempt({
      evaluationId,
      studentId,
      courseId,
      attemptNumber
    });

    console.log(`[AssessmentService] Attempt created: ${attempt.id} (attempt ${attemptNumber} of ${evaluation.maxAttempts})`);
    return attempt;
  }

  /**
   * Start attempt (mark as in_progress)
   */
  async startAttempt(attemptId: string): Promise<AttemptDTO> {
    if (!attemptId) {
      throw new Error('attempt_id_required');
    }

    const attempt = await this.repo.getAttempt(attemptId);
    if (!attempt) {
      throw new Error('attempt_not_found');
    }

    if (attempt.status !== 'created') {
      throw new Error('attempt_already_started');
    }

    const started = await this.repo.startAttempt(attemptId);
    if (!started) {
      throw new Error('start_attempt_failed');
    }

    console.log(`[AssessmentService] Attempt started: ${attemptId}`);
    return started;
  }

  /**
   * Submit attempt (mark as submitted, stop time)
   */
  async submitAttempt(attemptId: string, answers: Record<string, any>, timeSpentSeconds?: number): Promise<AttemptDTO> {
    if (!attemptId) {
      throw new Error('attempt_id_required');
    }

    const attempt = await this.repo.getAttempt(attemptId);
    if (!attempt) {
      throw new Error('attempt_not_found');
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('attempt_not_in_progress');
    }

    const submitted = await this.repo.submitAttempt(attemptId, answers, timeSpentSeconds);
    if (!submitted) {
      throw new Error('submit_attempt_failed');
    }

    console.log(`[AssessmentService] Attempt submitted: ${attemptId}`);
    return submitted;
  }

  // ============ GRADING SERVICE METHODS (CRITICAL <2s) ============

  /**
   * CRITICAL DR-01: Grade attempt MUST respond in <2s without RabbitMQ
   *
   * Strategy:
   * 1. Load attempt + evaluation (fast queries)
   * 2. Calculate score synchronously (auto-grading logic)
   * 3. Save grade to DB (fast insert)
   * 4. Update attempt status+score synchronously
   * 5. Return response IMMEDIATELY (HTTP 200)
   * 6. Publish RabbitMQ event ASYNC in background (fire-and-forget)
   * 7. Never await RabbitMQ in this method
   */
  async gradeAttempt(
    attemptId: string,
    rules?: GradingRules
  ): Promise<{ attempt: AttemptDTO; grade: GradeDTO; completedAt: number }> {
    const startTime = Date.now();

    if (!attemptId) {
      throw new Error('attempt_id_required');
    }

    // 1. Load attempt + evaluation (should be <100ms)
    const attempt = await this.repo.getAttempt(attemptId);
    if (!attempt) {
      throw new Error('attempt_not_found');
    }

    if (attempt.status !== 'submitted') {
      throw new Error('attempt_not_submitted');
    }

    const evaluation = await this.repo.getEvaluation(attempt.evaluationId);
    if (!evaluation) {
      throw new Error('evaluation_not_found');
    }

    // 2. Calculate score synchronously (should be <500ms)
    const score = this.calculateScore(attempt.answers || {}, evaluation, rules);
    const passingScore = rules?.passingScore || evaluation.passThreshold;
    const isPassed = score >= passingScore;

    // 3. Create grade record (should be <100ms)
    const grade = await this.repo.createGrade({
      attemptId,
      score,
      totalPoints: evaluation.totalPoints,
      rubricScore: score,
      gradedBy: undefined // Auto-grading, not by user
    });

    // 4. Update attempt with score + mark as graded synchronously (should be <100ms)
    await this.repo.updateAttemptScore(attemptId, score, isPassed);
    await this.repo.markAttemptAsGraded(attemptId);

    // 5. RETURN RESPONSE IMMEDIATELY (total elapsed should be <500ms)
    const completedAt = Date.now() - startTime;
    const updatedAttempt = await this.repo.getAttempt(attemptId);

    // 6. Publish RabbitMQ event ASYNCHRONOUSLY (NEVER await this)
    // This happens in background, caller doesn't wait
    this.publishGradingEvent(attempt, evaluation, grade).catch((err) => {
      console.error(`[AssessmentService] Failed to publish grading event for ${attemptId}:`, err.message);
    });

    // 7. Return immediately - RabbitMQ publish happens async
    if (!updatedAttempt) {
      throw new Error('grade_verification_failed');
    }

    console.log(`[AssessmentService] Attempt graded in ${completedAt}ms: ${attemptId} (score: ${score}%)`);

    if (completedAt > 2000) {
      console.warn(`[AssessmentService] SLOW GRADING - ${attemptId} took ${completedAt}ms (DR-01 <2s violated!)`);
    }

    return {
      attempt: updatedAttempt,
      grade,
      completedAt
    };
  }

  /**
   * Recalculate score after manual grading (e.g., teacher overrides)
   */
  async updateGradeManual(
    gradeId: string,
    input: { score: number; feedback?: string; rubricDetails?: Record<string, any> }
  ): Promise<GradeDTO> {
    if (!gradeId) {
      throw new Error('grade_id_required');
    }

    if (input.score < 0 || input.score > 100) {
      throw new Error('score_must_be_0_to_100');
    }

    const updated = await this.repo.updateGrade(gradeId, input);
    if (!updated) {
      throw new Error('grade_not_found');
    }

    const attempt = await this.repo.getAttempt(updated.attemptId);
    if (attempt) {
      const evaluation = await this.repo.getEvaluation(attempt.evaluationId);
      if (evaluation) {
        this.publishGradingEvent(attempt, evaluation, updated).catch((err) => {
          console.error(`[AssessmentService] Failed to publish manual grade event for ${gradeId}:`, err.message);
        });
      }
    }

    console.log(`[AssessmentService] Grade updated manually: ${gradeId}`);
    return updated;
  }

  // ============ SCORING LOGIC ============

  /**
   * Auto-grading logic
   * Override this for custom scoring (e.g., rubric-based, ML models)
   */
  private calculateScore(
    answers: Record<string, any>,
    evaluation: EvaluationDTO,
    rules?: GradingRules
  ): number {
    if (rules?.autoGrade === false) {
      return 0; // Manual grading required
    }

    // Simple auto-grading: count correct answers
    // In production, this would integrate with LMS grading engine
    let correctCount = 0;
    let totalQuestions = 0;

    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      totalQuestions++;

      // Mock correct answers (in production, fetch from DB)
      const correctAnswer = this.getMockCorrectAnswer(questionId);
      if (studentAnswer === correctAnswer) {
        correctCount++;
      }
    }

    if (totalQuestions === 0) {
      return 0;
    }

    // Calculate percentage score
    const percentage = (correctCount / totalQuestions) * 100;
    return Math.round(percentage * 100) / 100; // Round to 2 decimals
  }

  /**
   * Mock correct answers (replace with real implementation)
   */
  private getMockCorrectAnswer(questionId: string): any {
    // In production, fetch from questions table
    const mockAnswers: Record<string, any> = {
      'q1': 'A',
      'q2': 'B',
      'q3': true,
      'q4': 42
    };
    return mockAnswers[questionId];
  }

  // ============ EVENT PUBLISHING (ASYNC, non-blocking) ============

  /**
   * Publish grading event to RabbitMQ
   * IMPORTANT: This is called async, NOT awaited by gradeAttempt()
   * If RabbitMQ fails, doesn't affect HTTP response
   */
  private async publishGradingEvent(
    attempt: AttemptDTO,
    evaluation: EvaluationDTO,
    grade: GradeDTO
  ): Promise<void> {
    await publishEvaluationCompleted({
      version: 'v1',
      student_id: attempt.studentId,
      evaluation_id: attempt.evaluationId,
      course_id: attempt.courseId ?? evaluation.courseId,
      score: grade.score,
      submitted_at: attempt.submittedAt
        ? attempt.submittedAt instanceof Date
          ? attempt.submittedAt.toISOString()
          : String(attempt.submittedAt)
        : new Date().toISOString()
    });
  }
}

// Singleton instance
let serviceInstance: AssessmentService | null = null;

export function getAssessmentService(): AssessmentService {
  if (!serviceInstance) {
    serviceInstance = new AssessmentService();
  }
  return serviceInstance;
}
