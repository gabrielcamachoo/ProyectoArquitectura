import { Response } from 'express';
import { getAssessmentService, AssessmentService } from '../services/assessmentService';
import { AuthRequest } from '../middleware/auth';

export class AssessmentController {
  private service: AssessmentService;

  constructor() {
    this.service = getAssessmentService();
  }

  /**
   * POST /evaluations
   * Create evaluation (teacher only)
   */
  async createEvaluation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId, title, type, weight, totalPoints, passThreshold, description, maxAttempts, deadline } = req.body;
      const createdBy = req.userId;

      if (!createdBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const evaluation = await this.service.createEvaluation({
        courseId,
        title,
        type,
        weight,
        totalPoints,
        passThreshold,
        description,
        maxAttempts,
        createdBy,
        deadline: deadline ? new Date(deadline) : undefined
      });

      res.status(201).json({
        id: evaluation.id,
        courseId: evaluation.courseId,
        title: evaluation.title,
        type: evaluation.type,
        weight: evaluation.weight,
        status: evaluation.status,
        totalPoints: evaluation.totalPoints
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'missing_required_fields': 400,
        'weight_must_be_0_to_100': 400,
        'pass_threshold_must_be_0_to_100': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /courses/:courseId/evaluations
   * List evaluations for course
   */
  async listEvaluations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { status } = req.query;

      const evaluations = await this.service.listEvaluationsByCourse(courseId, {
        status: status as string | undefined
      });

      res.status(200).json({
        evaluations: evaluations.map(e => ({
          id: e.id,
          courseId: e.courseId,
          title: e.title,
          type: e.type,
          weight: e.weight,
          status: e.status,
          totalPoints: e.totalPoints,
          createdAt: e.createdAt
        }))
      });
    } catch (error: any) {
      const statusCode = error.message === 'course_id_required' ? 400 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * GET /evaluations/:evaluationId
   * Get evaluation details
   */
  async getEvaluation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;
      const evaluation = await this.service.getEvaluation(evaluationId);

      res.status(200).json({
        id: evaluation.id,
        courseId: evaluation.courseId,
        title: evaluation.title,
        type: evaluation.type,
        weight: evaluation.weight,
        totalPoints: evaluation.totalPoints,
        passThreshold: evaluation.passThreshold,
        description: evaluation.description,
        maxAttempts: evaluation.maxAttempts,
        status: evaluation.status,
        deadline: evaluation.deadline,
        createdAt: evaluation.createdAt
      });
    } catch (error: any) {
      const statusCode = error.message === 'evaluation_not_found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /evaluations/:evaluationId/publish
   * Publish evaluation (teacher only)
   */
  async publishEvaluation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;
      const publishedBy = req.userId;

      if (!publishedBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const evaluation = await this.service.publishEvaluation(evaluationId, publishedBy);

      res.status(200).json({
        id: evaluation.id,
        title: evaluation.title,
        status: evaluation.status
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'evaluation_not_found': 404,
        'only_draft_evaluations_can_publish': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /evaluations/:evaluationId/attempts
   * Create new attempt for student
   */
  async createAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;
      const { courseId } = req.body;
      const studentId = req.userId;

      if (!studentId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const attempt = await this.service.createAttempt(evaluationId, studentId, courseId);

      res.status(201).json({
        id: attempt.id,
        evaluationId: attempt.evaluationId,
        studentId: attempt.studentId,
        status: attempt.status,
        attemptNumber: attempt.attemptNumber,
        createdAt: attempt.createdAt
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'evaluation_not_found': 404,
        'max_attempts_reached': 403,
        'missing_required_fields': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /attempts/:attemptId/start
   * Start attempt (mark as in_progress)
   */
  async startAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await this.service.startAttempt(attemptId);

      res.status(200).json({
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'attempt_not_found': 404,
        'attempt_already_started': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /attempts/:attemptId/submit
   * Submit attempt (mark as submitted)
   */
  async submitAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { answers, timeSpentSeconds } = req.body;

      const attempt = await this.service.submitAttempt(attemptId, answers, timeSpentSeconds);

      res.status(200).json({
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        timeSpentSeconds: attempt.timeSpentSeconds
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'attempt_not_found': 404,
        'attempt_not_in_progress': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * POST /attempts/:attemptId/grade
   * CRITICAL DR-01: Grade attempt (<2s response time)
   * 
   * Response MUST be <2 seconds WITHOUT waiting for RabbitMQ
   * Publishes to RabbitMQ async in background (fire-and-forget)
   */
  async gradeAttempt(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { attemptId } = req.params;
      const { rules, score, feedback } = req.body || {};

      // Synchronous grading - MUST complete <2s
      const result = await this.service.gradeAttempt(attemptId, { rules, score, feedback });

      const elapsedTime = Date.now() - startTime;

      // Log if exceeding DR-01 SLA
      if (elapsedTime > 2000) {
        console.warn(`[AssessmentController] SLOW GRADE: ${attemptId} took ${elapsedTime}ms (SLA: <2000ms)`);
      }

      // Return response IMMEDIATELY with timing info
      res.status(200).json({
        success: true,
        attempt: {
          id: result.attempt.id,
          status: result.attempt.status,
          score: result.attempt.score,
          isPassed: result.attempt.isPassed
        },
        grade: {
          id: result.grade.id,
          score: result.grade.score,
          feedback: result.grade.feedback
        },
        processingTimeMs: elapsedTime,
        withinSLA: elapsedTime < 2000
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'attempt_not_found': 404,
        'attempt_not_submitted': 400
      };
      const statusCode = errorMap[error.message] || 500;

      const elapsedTime = Date.now() - startTime;
      res.status(statusCode).json({
        error: error.message,
        processingTimeMs: elapsedTime
      });
    }
  }

  /**
   * PUT /grades/:gradeId
   * Update grade manually (teacher only)
   */
  async updateGrade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { gradeId } = req.params;
      const { score, feedback, rubricDetails } = req.body;
      const updatedBy = req.userId;

      if (!updatedBy) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const grade = await this.service.updateGradeManual(gradeId, {
        score,
        feedback,
        rubricDetails
      });

      res.status(200).json({
        id: grade.id,
        score: grade.score,
        feedback: grade.feedback,
        rubricDetails: grade.rubricDetails
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'grade_not_found': 404,
        'score_must_be_0_to_100': 400
      };
      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
}
