import request from 'supertest';
import { createApp } from '../src/app';

describe('course-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves first endpoint', async () => {
    const res = await request(app).get('/courses'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u'));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('serves last endpoint', async () => {
    const url = '/courses/:id/modules/:moduleId/materials'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u');
    const req = request(app);
    const res = await req.post(url);
    expect([200,201]).toContain(res.status);
  });
});
