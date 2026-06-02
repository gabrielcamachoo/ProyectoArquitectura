export interface EvaluationCompletedEvent {
  version: 'v1';
  studentId: string;
  evaluationId: string;
  courseId: string;
  score: number;
  submittedAt: string;
}

// RF-04 contract: score <60 refuerzo, 60-85 suplementario, >85 profundización
export type RecommendationType = 'refuerzo' | 'suplementario' | 'profundización';

export type MaterialScope = 'current_published_module' | 'next_modules' | 'related_courses';

export interface RecommendationOutput {
  studentId: string;
  courseId: string;
  evaluationId: string;
  type: RecommendationType;
  scope: MaterialScope;
  score: number;
  reasoning: string;
  resource: {
    title: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  };
}

const RULES: Array<{
  maxScore: number;
  type: RecommendationType;
  scope: MaterialScope;
  reasoning: string;
  resource: RecommendationOutput['resource'];
}> = [
  {
    maxScore: 60,
    type: 'refuerzo',
    scope: 'current_published_module',
    reasoning: 'Puntaje por debajo del 60%. Se recomienda repasar el módulo publicado actual.',
    resource: {
      title: 'Material de refuerzo',
      action: 'review_current_module',
      priority: 'high'
    }
  },
  {
    maxScore: 86,
    type: 'suplementario',
    scope: 'next_modules',
    reasoning: 'Puntaje entre 60% y 85%. Se recomiendan materiales suplementarios relacionados al tema.',
    resource: {
      title: 'Material suplementario',
      action: 'review_related_materials',
      priority: 'medium'
    }
  },
  {
    maxScore: 101,
    type: 'profundización',
    scope: 'next_modules',
    reasoning: 'Excelente desempeño (>85%). Avanza a contenido más avanzado y siguientes módulos.',
    resource: {
      title: 'Contenido de profundización',
      action: 'explore_next_modules',
      priority: 'low'
    }
  }
];

export function computeRecommendation(event: EvaluationCompletedEvent): RecommendationOutput {
  const rule = RULES.find((r) => event.score < r.maxScore) ?? RULES[RULES.length - 1];

  return {
    studentId: event.studentId,
    courseId: event.courseId,
    evaluationId: event.evaluationId,
    type: rule.type,
    scope: rule.scope,
    score: event.score,
    reasoning: rule.reasoning,
    resource: rule.resource
  };
}
