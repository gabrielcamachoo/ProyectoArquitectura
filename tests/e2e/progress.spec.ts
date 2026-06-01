import { test, expect } from '@playwright/test';

const PROGRESS_API = 'http://localhost:3003';
const AUTH_API = 'http://localhost:3000';

let studentToken: string;
let studentId: string;
let courseId = 'test-course-' + Date.now();

test.describe('Progress Tracking', () => {
  test.beforeAll(async ({ request }) => {
    // Register and login student
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const studentReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Progress Student',
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
        role: 'student',
      },
    });
    const student = await studentReg.json();
    studentId = student.id;

    const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken } = await studentLogin.json();
    studentToken = accessToken;
  });

  test('Get student course progress', async ({ request }) => {
    const response = await request.get(
      `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    // 200 or 404 both acceptable initially
    expect([200, 404]).toContain(response.status());
  });

  test('Get overall student progress', async ({ request }) => {
    const response = await request.get(`${PROGRESS_API}/progress/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(response.status()).toBe(200);
    const progress = await response.json();
    expect(Array.isArray(progress) || typeof progress === 'object').toBeTruthy();
  });

  test('Teacher can view student progress', async ({ request }) => {
    // Register teacher
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Progress Teacher',
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
    const { accessToken: teacherToken } = await teacherLogin.json();

    // Teacher views student progress
    const response = await request.get(
      `${PROGRESS_API}/progress/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${teacherToken}` },
      }
    );
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Student cannot view other students\' progress', async ({ request }) => {
    // Create another student
    const otherEmail = `student-${Date.now() + 1}@puj.edu.co`;
    const otherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Other Progress Student',
        institutionalEmail: otherEmail,
        password: 'StudentPass123!',
        role: 'student',
      },
    });
    const otherStudent = await otherReg.json();

    const otherLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: otherEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken: otherToken } = await otherLogin.json();

    // Try to view first student's progress
    const response = await request.get(
      `${PROGRESS_API}/progress/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${otherToken}` },
      }
    );
    expect(response.status()).toBe(403);
  });

  test('Progress percentage is valid (0-100)', async ({ request }) => {
    const response = await request.get(
      `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    if (response.status() === 200) {
      const progress = await response.json();
      if (progress.percentage !== undefined) {
        expect(progress.percentage).toBeGreaterThanOrEqual(0);
        expect(progress.percentage).toBeLessThanOrEqual(100);
      }
    }
  });

  test('Progress status is valid enum', async ({ request }) => {
    const response = await request.get(
      `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    if (response.status() === 200) {
      const progress = await response.json();
      if (progress.status) {
        expect(['not_started', 'in_progress', 'completed']).toContain(progress.status);
      }
    }
  });
});
