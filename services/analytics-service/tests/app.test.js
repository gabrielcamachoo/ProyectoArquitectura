"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('analytics-service', () => {
    const app = (0, app_1.createApp)();
    it('returns health', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
    });
    it('serves first endpoint', async () => {
        const res = await (0, supertest_1.default)(app).get('/analytics/course/:courseId'.replace(':id', '1').replace(':studentId', 's').replace(':courseId', 'c').replace(':moduleId', 'm').replace(':userId', 'u'));
        expect(res.status).toBe(200);
        expect(res.body.source).toBe('read-replica');
    });
    it('serves last endpoint', async () => {
        const url = '/analytics/course/:courseId/students'.replace(':id', '1').replace(':studentId', 's').replace(':courseId', 'c').replace(':moduleId', 'm').replace(':userId', 'u');
        const req = (0, supertest_1.default)(app);
        const res = await req.get(url);
        expect([200, 201]).toContain(res.status);
    });
});
