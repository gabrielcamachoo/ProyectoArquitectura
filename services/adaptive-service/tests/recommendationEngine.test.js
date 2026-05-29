"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recommendationEngine_1 = require("../src/rules/recommendationEngine");
describe('recommendation rules', () => {
    it('returns refuerzo for low scores', () => {
        expect((0, recommendationEngine_1.computeRecommendation)({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 55, submitted_at: new Date().toISOString() }).type).toBe('refuerzo');
    });
    it('returns profundizacion for middle scores', () => {
        expect((0, recommendationEngine_1.computeRecommendation)({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 70, submitted_at: new Date().toISOString() }).type).toBe('profundizacion');
    });
    it('returns recurso_complementario for high scores', () => {
        expect((0, recommendationEngine_1.computeRecommendation)({ version: 'v1', student_id: 's', evaluation_id: 'e', course_id: 'c', score: 95, submitted_at: new Date().toISOString() }).type).toBe('recurso_complementario');
    });
});
