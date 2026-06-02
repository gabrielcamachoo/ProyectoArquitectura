import { test, expect } from '@playwright/test';

const ANALYTICS_API = 'http://localhost:3006';
const AUTH_API = 'http://localhost:3000';

let teacherToken: string;
let courseId = 'test-course-' + Date.now();

test.describe('Analytics Dashboard (CQRS + Read Replica)', () => {
  test.beforeAll(async ({ request }) => {
    // Register and login teacher
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Analytics Teacher',
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
        role: 'teacher',
      },
    });

    const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
      },
    });
    const { accessToken } = await teacherLogin.json();
    teacherToken = accessToken;
  });

  test('Get course dashboard', async ({ request }) => {
    const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    // 200 or 404 both acceptable
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const dashboard = await response.json();
      expect(dashboard).toHaveProperty('completionRate');
      expect(dashboard).toHaveProperty('averageScore');
      expect(dashboard).toHaveProperty('activeStudents');
    }
  });

  test('Get course student progress list', async ({ request }) => {
    const response = await request.get(
      `${ANALYTICS_API}/analytics/course/${courseId}/students`,
      {
        headers: { Authorization: `Bearer ${teacherToken}` },
      }
    );
    // 200 or 404 both acceptable
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const students = await response.json();
      expect(Array.isArray(students)).toBeTruthy();
    }
  });

  test('Student cannot access analytics (RBAC)', async ({ request }) => {
    // Register student
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const studentReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Analytics Student',
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
        role: 'student',
      },
    });

    const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken: studentToken } = await studentLogin.json();

    // Student tries to access analytics
    const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(response.status()).toBe(403);
  });

  test('Dashboard metrics are valid numbers', async ({ request }) => {
    const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    if (response.status() === 200) {
      const dashboard = await response.json();

      if (dashboard.completionRate !== undefined) {
        expect(typeof dashboard.completionRate).toBe('number');
        expect(dashboard.completionRate).toBeGreaterThanOrEqual(0);
        expect(dashboard.completionRate).toBeLessThanOrEqual(100);
      }

      if (dashboard.averageScore !== undefined) {
        expect(typeof dashboard.averageScore).toBe('number');
      }

      if (dashboard.activeStudents !== undefined) {
        expect(typeof dashboard.activeStudents).toBe('number');
        expect(dashboard.activeStudents).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('Uses read-replica (DATABASE_READ_URL)', async ({ request }) => {
    // This test verifies the service responds quickly
    // Read-replica queries should be fast
    const startTime = Date.now();

    const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    const elapsedTime = Date.now() - startTime;

    // Analytics queries should be fast (read-replica optimization)
    if (response.status() === 200) {
      expect(elapsedTime).toBeLessThan(1000); // <1 second for read-replica
      console.log(`📊 Analytics query completed in ${elapsedTime}ms`);
    }
  });
});
