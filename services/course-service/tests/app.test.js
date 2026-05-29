"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('course-service', () => {
    const app = (0, app_1.createApp)();
    it('returns health', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
    });
    it('serves first endpoint', async () => {
        const res = await (0, supertest_1.default)(app).get('/courses'.replace(':id', '1').replace(':studentId', 's').replace(':courseId', 'c').replace(':moduleId', 'm').replace(':userId', 'u'));
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });
    it('serves last endpoint', async () => {
        const url = '/courses/:id/modules/:moduleId/materials'.replace(':id', '1').replace(':studentId', 's').replace(':courseId', 'c').replace(':moduleId', 'm').replace(':userId', 'u');
        const req = (0, supertest_1.default)(app);
        const res = await req.post(url);
        expect([200, 201]).toContain(res.status);
    });
});
