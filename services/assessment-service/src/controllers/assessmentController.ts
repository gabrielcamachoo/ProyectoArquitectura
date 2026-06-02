import { Response } from 'express';
import { AuthRequest } from '@proyecto/shared-core/auth';
import { getAssessmentService, AssessmentService } from '../services/assessmentService';

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
        totalPoints: evaluation.totalPoints,
        passThreshold: evaluation.passThreshold,
        maxAttempts: evaluation.maxAttempts,
        status: evaluation.status,
        createdBy: evaluation.createdBy,
        createdAt: evaluation.createdAt,
        deadline: evaluation.deadline
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'course_id_required': 400,
        'title_required': 400,
        'title_too_long': 400,
        'invalid_type': 400,
        'invalid_weight': 400,
        'invalid_total_points': 400,
        'creator_id_required': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /evaluations/:evaluationId
   * Get evaluation by ID
   */
  async getEvaluation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;

      const evaluation = await this.service.getEvaluation(evaluationId);

      if (!evaluation) {
        res.status(404).json({ error: 'evaluation_not_found' });
        return;
      }

      res.status(200).json(evaluation);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /courses/:courseId/evaluations
   * List evaluations for a course
   */
// Ln ~112-122: reemplazar el bloque de llamada al service y la respuesta
async listEvaluations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    
    const evaluations = await this.service.listEvaluationsByCourse(courseId, {
      status: status as string | undefined
    });

    
    const total = evaluations.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = evaluations.slice(start, start + limitNum);

    res.status(200).json({
      evaluations: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

  /**
   * POST /evaluations/:evaluationId/publish
   * Publish evaluation
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

      if (!evaluation) {
        res.status(404).json({ error: 'evaluation_not_found' });
        return;
      }

      res.status(200).json({
        message: 'Evaluation published successfully',
        evaluation
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  // ============ ATTEMPT ENDPOINTS ============
  /**
   * POST /evaluations/:evaluationId/attempts
   * Create attempt
   */
  async createAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;
      const studentId = req.userId;
      const { courseId } = req.body;

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
        startedAt: attempt.startedAt,
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'evaluation_id_required': 400,
        'student_id_required': 400,
        'evaluation_not_found': 404,
        'evaluation_not_published': 400,
        'max_attempts_reached': 400,
        'attempt_in_progress': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /attempts/:attemptId/start
   * Start attempt
   */
  async startAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const studentId = req.userId;

      if (!studentId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const attempt = await this.service.startAttempt(attemptId);

      if (!attempt) {
        res.status(404).json({ error: 'attempt_not_found' });
        return;
      }

      res.status(200).json({
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
      });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'attempt_not_found': 404,
        'attempt_already_started': 400,
        'attempt_already_submitted': 400,
        'attempt_time_expired': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /attempts/:attemptId/submit
   * Submit attempt
   */
  async submitAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;
      const studentId = req.userId;

      if (!studentId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const result = await this.service.submitAttempt(attemptId,answers as Record<string, any>,req.body.timeSpent);

      if (!result) {
        res.status(404).json({ error: 'attempt_not_found' });
        return;
      }

      res.status(200).json({
       id: result.id,               
       status: result.status,
       submittedAt: result.submittedAt,
       score: result.score,
       isPassed: result.isPassed
    });
    } catch (error: any) {
      const errorMap: Record<string, number> = {
        'attempt_not_found': 404,
        'attempt_not_started': 400,
        'attempt_already_submitted': 400,
        'attempt_time_expired': 400
      };

      const statusCode = errorMap[error.message] || 500;
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }
}
