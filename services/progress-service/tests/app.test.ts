import request from 'supertest';
import { createApp } from '../src/app';

describe('progress-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('requires auth for first endpoint', async () => {
    const res = await request(app).get('/progress/student/:studentId/course/:courseId'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u'));
    expect(res.status).toBe(401);
  });

  it('requires auth for last endpoint', async () => {
    const url = '/progress/student/:studentId'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u');
    const req = request(app);
    const res = await req.get(url);
    expect(res.status).toBe(401);
  });
});
