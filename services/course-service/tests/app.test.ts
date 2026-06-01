import request from 'supertest';
import { createApp } from '../src/app';

describe('course-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('lists courses publicly', async () => {
    const res = await request(app).get('/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.courses)).toBe(true);
  });

  it('requires auth to create materials', async () => {
    const res = await request(app)
      .post('/courses/00000000-0000-4000-8000-000000000001/modules/00000000-0000-4000-8000-000000000002/materials')
      .send({ title: 'Material test', type: 'pdf', url: 'https://example.com/doc.pdf' });
    expect(res.status).toBe(401);
  });
});
