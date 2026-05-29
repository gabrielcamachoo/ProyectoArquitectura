import request from 'supertest';
import { createApp } from '../src/app';

describe('assessment-service', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves first endpoint', async () => {
    const res = await request(app).get('/evaluations'.replace(':id','1').replace(':studentId','s').replace(':courseId','c').replace(':moduleId','m').replace(':userId','u'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('serves last endpoint', async () => {
    const create = await request(app).post('/evaluations/ev-1/attempts').send({ studentId: 'student-1' });
    const submit = await request(app).put(`/attempts/${create.body.id}/submit`);
    const grade = await request(app).put(`/attempts/${create.body.id}/grade`).send({ score: 88 });
    expect(submit.status).toBe(200);
    expect(grade.status).toBe(200);
    expect(grade.body.status).toBe('graded');
  });
});
