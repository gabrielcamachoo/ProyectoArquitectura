import { computeRecommendation } from '../src/rules/recommendationEngine';

describe('recommendation rules', () => {
  it('returns refuerzo for low scores', () => {
    expect(computeRecommendation({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 55, submitted_at: new Date().toISOString() }).type).toBe('refuerzo');
  });

  it('returns suplementario for middle scores (60-85)', () => {
    expect(computeRecommendation({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 70, submitted_at: new Date().toISOString() }).type).toBe('suplementario');
  });

  it('returns profundización for high scores (>85)', () => {
    expect(computeRecommendation({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 95, submitted_at: new Date().toISOString() }).type).toBe('profundización');
  });
});
