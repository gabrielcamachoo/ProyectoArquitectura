import request from 'supertest';
import { createApp } from '../src/app';

describe('assessment-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('requires auth to create evaluations', async () => {
    const res = await request(app).post('/evaluations').send({
      courseId: '00000000-0000-4000-8000-000000000001',
      title: 'Quiz 1',
      type: 'quiz',
      weight: 10
    });
    expect(res.status).toBe(401);
  });

  it('requires auth to grade attempts', async () => {
    const res = await request(app)
      .post('/attempts/00000000-0000-4000-8000-000000000003/grade')
      .send({ score: 88 });
    expect(res.status).toBe(401);
  });
});
