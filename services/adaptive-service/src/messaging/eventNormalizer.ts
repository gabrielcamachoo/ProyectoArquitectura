import { EvaluationCompletedEvent } from '../rules/recommendationEngine';

/** Raw payloads from assessment-service (v1) or legacy RF-03 envelope */
export type RawEvaluationEvent =
  | EvaluationCompletedEvent
  | {
      event?: string;
      studentId?: string;
      assessmentId?: string;
      courseId?: string;
      score?: number;
      totalPoints?: number;
      passThreshold?: number;
    }
  | {
      eventType?: string;
      timestamp?: string;
      data?: {
        studentId?: string;
        evaluationId?: string;
        courseId?: string;
        score?: number;
        submittedAt?: string;
      };
    };

export function normalizeEvaluationEvent(raw: RawEvaluationEvent): EvaluationCompletedEvent {
  if ('version' in raw && raw.version === 'v1' && ('studentId' in raw || 'student_id' in raw)) {
    const r = raw as any;
    return {
      version: 'v1',
      studentId: r.studentId ?? r.student_id,
      evaluationId: r.evaluationId ?? r.evaluation_id,
      courseId: r.courseId ?? r.course_id,
      score: r.score,
      submittedAt: r.submittedAt ?? r.submitted_at ?? new Date().toISOString()
    };
  }

  // RF-03 contract from the demo prompt
  const direct = raw as { event?: string; studentId?: unknown; assessmentId?: unknown; courseId?: unknown; score?: unknown };
  if (direct.event === 'evaluacion.completada.v1') {
    const studentId = String(direct.studentId ?? '');
    const evaluationId = String(direct.assessmentId ?? '');
    const courseId = String(direct.courseId ?? '');
    const score = Number(direct.score ?? 0);
    if (!studentId || !evaluationId || !courseId) {
      throw new Error('invalid_evaluation_event_payload');
    }
    return {
      version: 'v1',
      studentId,
      evaluationId,
      courseId,
      score,
      submittedAt: new Date().toISOString()
    };
  }

  const envelope = raw as { data?: Record<string, unknown>; timestamp?: string };
  const data = envelope.data ?? {};
  const studentId = String(data.studentId ?? data.student_id ?? '');
  const evaluationId = String(data.evaluationId ?? data.evaluation_id ?? '');
  const courseId = String(data.courseId ?? data.course_id ?? '');
  const score = Number(data.score ?? 0);
  const submittedAt = String(
    data.submittedAt ?? data.submitted_at ?? envelope.timestamp ?? new Date().toISOString()
  );

  if (!studentId || !evaluationId || !courseId) {
    throw new Error('invalid_evaluation_event_payload');
  }

  return {
    version: 'v1',
    studentId,
    evaluationId,
    courseId,
    score,
    submittedAt
  };
}
