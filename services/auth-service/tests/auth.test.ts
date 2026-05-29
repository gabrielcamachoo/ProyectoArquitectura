import request from 'supertest';
import { createApp } from '../src/app';

describe('auth-service', () => {
  const app = createApp();

  it('registers user', async () => {
    const res = await request(app).post('/auth/register').send({
      fullName: 'Test User',
      email: 'test@javeriana.edu.co',
      password: 'secret123',
      role: 'student'
    });
    expect(res.status).toBe(201);
    expect(res.body.institutionalEmail).toBe('test@javeriana.edu.co');
  });

  it('logs in user', async () => {
    await request(app).post('/auth/register').send({
      fullName: 'Admin User',
      email: 'admin@javeriana.edu.co',
      password: 'secret123',
      role: 'admin'
    });
    const res = await request(app).post('/auth/login').send({ email: 'admin@javeriana.edu.co', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects protected data export without token', async () => {
    const res = await request(app).get('/users/1/data');
    expect(res.status).toBe(401);
  });
});
