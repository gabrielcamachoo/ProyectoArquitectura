import request from 'supertest';
import { createApp } from '../src/app';

describe('notification-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves first endpoint', async () => {
    const res = await request(app).get('/notifications/user/:userId'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u'));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('serves last endpoint', async () => {
    const req = request(app);
    const created = await req.post('/notifications').send({ userId: 'u', type: 'test', content: { ok: true } });
    expect([200, 201]).toContain(created.status);
    const id = created.body.id ?? created.body.notification?.id ?? created.body?.data?.id;
    expect(id).toBeTruthy();

    const url = `/notifications/${id}/read`;
    const res = await req.put(url);
    expect([200,201]).toContain(res.status);
  });
});
