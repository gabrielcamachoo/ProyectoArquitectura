import { computeRecommendation } from '../src/rules/recommendationEngine';

describe('recommendation rules', () => {
  it('returns refuerzo for low scores', () => {
    expect(computeRecommendation({ version: 'v1', studentId: 's', evaluationId: 'e', courseId: 'c', score: 55, submittedAt: new Date().toISOString() }).type).toBe('refuerzo');
  });

  it('returns suplementario for middle scores (60-85)', () => {
    expect(computeRecommendation({ version: 'v1', studentId: 's', evaluationId: 'e', courseId: 'c', score: 70, submittedAt: new Date().toISOString() }).type).toBe('suplementario');
  });

  it('returns profundización for high scores (>85)', () => {
    expect(computeRecommendation({ version: 'v1', studentId: 's', evaluationId: 'e', courseId: 'c', score: 95, submittedAt: new Date().toISOString() }).type).toBe('profundización');
  });
});
