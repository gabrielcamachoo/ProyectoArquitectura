import request from 'supertest';
import { createApp } from '../src/app';

describe('analytics-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves first endpoint', async () => {
    const res = await request(app).get('/analytics/course/:courseId'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u'));
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('read-replica');
  });

  it('serves last endpoint', async () => {
    const url = '/analytics/course/:courseId/students'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u');
    const req = request(app);
    const res = await req.get(url);
    expect([200,201]).toContain(res.status);
  });
});
