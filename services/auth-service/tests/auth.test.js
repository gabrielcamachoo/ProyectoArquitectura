"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('auth-service', () => {
    const app = (0, app_1.createApp)();
    it('registers user', async () => {
        const res = await (0, supertest_1.default)(app).post('/auth/register').send({
            fullName: 'Test User',
            email: 'test@javeriana.edu.co',
            password: 'secret123',
            role: 'student'
        });
        expect(res.status).toBe(201);
        expect(res.body.institutionalEmail).toBe('test@javeriana.edu.co');
    });
    it('logs in user', async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({
            fullName: 'Admin User',
            email: 'admin@javeriana.edu.co',
            password: 'secret123',
            role: 'admin'
        });
        const res = await (0, supertest_1.default)(app).post('/auth/login').send({ email: 'admin@javeriana.edu.co', password: 'secret123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });
    it('rejects protected data export without token', async () => {
        const res = await (0, supertest_1.default)(app).get('/users/1/data');
        expect(res.status).toBe(401);
    });
});
