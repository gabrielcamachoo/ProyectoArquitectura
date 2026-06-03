import request from 'supertest';
import { createApp } from '../src/app';

const VALID_PASSWORD = 'Secret123!';

describe('auth-service', () => {
  const app = createApp();

  it('registers user', async () => {
    const res = await request(app).post('/auth/register').send({
      fullName: 'Test User',
      institutionalEmail: 'test@javeriana.edu.co',
      password: VALID_PASSWORD,
      role: 'student'
    });
    expect(res.status).toBe(201);
    expect(res.body.institutionalEmail).toBe('test@javeriana.edu.co');
  });

  it('logs in user', async () => {
    await request(app).post('/auth/register').send({
      fullName: 'Admin User',
      institutionalEmail: 'admin@javeriana.edu.co',
      password: VALID_PASSWORD,
      role: 'admin'
    });
    const res = await request(app)
      .post('/auth/login')
      .send({ institutionalEmail: 'admin@javeriana.edu.co', password: VALID_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects protected data export without token', async () => {
    const res = await request(app).get('/auth/users/00000000-0000-4000-8000-000000000001/data');
    expect(res.status).toBe(401);
  });
});
