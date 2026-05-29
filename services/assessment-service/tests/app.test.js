"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('assessment-service', () => {
    const app = (0, app_1.createApp)();
    it('returns health', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
    });
    it('serves first endpoint', async () => {
        const res = await (0, supertest_1.default)(app).get('/evaluations'.replace(':id', '1').replace(':studentId', 's').replace(':courseId', 'c').replace(':moduleId', 'm').replace(':userId', 'u'));
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items)).toBe(true);
    });
    it('serves last endpoint', async () => {
        const create = await (0, supertest_1.default)(app).post('/evaluations/ev-1/attempts').send({ studentId: 'student-1' });
        const submit = await (0, supertest_1.default)(app).put(`/attempts/${create.body.id}/submit`);
        const grade = await (0, supertest_1.default)(app).put(`/attempts/${create.body.id}/grade`).send({ score: 88 });
        expect(submit.status).toBe(200);
        expect(grade.status).toBe(200);
        expect(grade.body.status).toBe('graded');
    });
});
