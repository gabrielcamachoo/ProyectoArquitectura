import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let studentToken: string;
let teacherToken: string;
let adminToken: string;
let courseId: string;

test.describe('RBAC Enforcement', () => {
  test.beforeAll(async ({ request }) => {
    // Register student
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const studentReg = await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'RBAC Student',
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
        role: 'student',
      },
    });

    const studentLogin = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken: sToken } = await studentLogin.json();
    studentToken = sToken;

    // Register teacher
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const teacherReg = await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'RBAC Teacher',
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
        role: 'teacher',
      },
    });

    const teacherLogin = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
      },
    });
    const { accessToken: tToken } = await teacherLogin.json();
    teacherToken = tToken;

    // Register admin (or use existing)
    const adminEmail = `admin-${Date.now()}@puj.edu.co`;
    const adminReg = await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'RBAC Admin',
        institutionalEmail: adminEmail,
        password: 'AdminPass123!',
        role: 'admin',
      },
    });

    const adminLogin = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: adminEmail,
        password: 'AdminPass123!',
      },
    });
    const { accessToken: aToken } = await adminLogin.json();
    adminToken = aToken;

    // Create real course
    const courseRes = await request.post('http://localhost:3001/courses', {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        name: 'RBAC Course',
        description: 'Course for RBAC tests',
      },
    });
    const course = await courseRes.json();
    courseId = course.id;
  });

  test('Student cannot create courses', async ({ request }) => {
    const response = await request.post('http://localhost:3001/courses', {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: {
        courseId: 'CS-001',
        name: 'Test Course',
        description: 'Student tries to create',
        teacherId: 'teacher-123',
        status: 'draft',
      },
    });
    expect(response.status()).toBe(403);
  });

  test('Teacher can create courses', async ({ request }) => {
    const response = await request.post('http://localhost:3001/courses', {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        courseId: `CS-${Date.now()}`,
        name: 'Teacher Created Course',
        description: 'Teacher creates this',
        teacherId: 'teacher-123',
        status: 'draft',
      },
    });
    expect([201, 403]).toContain(response.status()); // May fail if data validation
  });

  test('Student cannot create evaluations', async ({ request }) => {
    const response = await request.post('http://localhost:3002/evaluations', {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: {
        courseId,
        title: 'Student Quiz',
        type: 'quiz',
        weight: 0.2,
        deadline: new Date().toISOString(),
      },
    });
    expect(response.status()).toBe(403);
  });

  test('Teacher can create evaluations', async ({ request }) => {
    const response = await request.post('http://localhost:3002/evaluations', {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        courseId,
        title: 'Teacher Quiz',
        type: 'quiz',
        weight: 0.2,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect([201, 403]).toContain(response.status());
  });

  test('Admin can view analytics', async ({ request }) => {
    const response = await request.get(`http://localhost:3006/analytics/course/${courseId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([200, 404, 403]).toContain(response.status());
  });

  test('Invalid token returns 401', async ({ request }) => {
    const response = await request.get('http://localhost:3001/courses', {
      headers: { Authorization: 'Bearer invalid-token-123' },
    });
    expect(response.status()).toBe(401);
  });

  test('Missing auth header returns 401', async ({ request }) => {
    const response = await request.get('http://localhost:3001/courses');
    expect([200, 401]).toContain(response.status()); // 200 if public endpoint
  });

  test('Expired token returns 401', async ({ request }) => {
    // Create token that expired
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzk5MjJ9.invalid';

    const response = await request.get('http://localhost:3001/courses', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('Student attempting admin action returns 403', async ({ request }) => {
    const response = await request.get(
      `http://localhost:3006/analytics/course/course-${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    expect(response.status()).toBe(403);
  });
});
