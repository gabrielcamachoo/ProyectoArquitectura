export interface EvaluationCompletedEvent {
  version: 'v1';
  student_id: string;
  evaluation_id: string;
  course_id: string;
  score: number;
  submitted_at: string;
}

export type RecommendationType = 'refuerzo' | 'profundizacion' | 'recurso_complementario';

export interface RecommendationRuleResult {
  type: RecommendationType;
  materialScope: 'current_published_module' | 'next_modules' | 'related_courses';
}

export function computeRecommendation(event: EvaluationCompletedEvent): RecommendationRuleResult {
  if (event.score < 60) {
    return { type: 'refuerzo', materialScope: 'current_published_module' };
  }
  if (event.score < 80) {
    return { type: 'profundizacion', materialScope: 'next_modules' };
  }
  return { type: 'recurso_complementario', materialScope: 'related_courses' };
}
