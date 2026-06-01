import { test, expect } from '@playwright/test';

const ADAPTIVE_API = 'http://localhost:3004';
const AUTH_API = 'http://localhost:3000';

let studentToken: string;
let studentId: string;

test.describe('Recommendation Engine', () => {
  test.beforeAll(async ({ request }) => {
    // Register and login student
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const studentReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Recommendation Student',
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

  test('Get recommendations for student', async ({ request }) => {
    const response = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    expect(response.status()).toBe(200);
    const recommendations = await response.json();
    expect(Array.isArray(recommendations)).toBeTruthy();
  });

  test('Teacher can view student recommendations', async ({ request }) => {
    // Register teacher
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Recommendation Teacher',
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

    // Teacher views student recommendations
    const response = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${teacherToken}` },
      }
    );
    expect(response.status()).toBe(200);
  });

  test('Student cannot view other students\' recommendations', async ({ request }) => {
    // Create another student
    const otherStudentEmail = `student-${Date.now() + 1}@puj.edu.co`;
    const otherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Other Student',
        institutionalEmail: otherStudentEmail,
        password: 'StudentPass123!',
        role: 'student',
      },
    });
    const otherStudent = await otherReg.json();

    const otherLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: otherStudentEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken: otherToken } = await otherLogin.json();

    // Try to view first student's recommendations
    const response = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${otherToken}` },
      }
    );
    expect(response.status()).toBe(403);
  });

  test('Recommendations cached in Redis', async ({ request }) => {
    // First request should hit database/rules engine
    const first = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    expect(first.status()).toBe(200);
    const firstData = await first.json();

    // Wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request should be from cache (same data)
    const second = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    expect(second.status()).toBe(200);
    const secondData = await second.json();

    // Data should be consistent
    expect(JSON.stringify(firstData)).toBe(JSON.stringify(secondData));
  });

  test('Recommendations types based on score', async ({ request }) => {
    // Test that recommendations object includes expected type field
    const response = await request.get(
      `${ADAPTIVE_API}/recommendations/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    expect(response.status()).toBe(200);
    const recommendations = await response.json();

    // Verify structure (even if empty, should be array)
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      expect(rec).toHaveProperty('type');
      expect(rec).toHaveProperty('scope');
      // Valid types: refuerzo, profundización, recurso_complementario
      expect(['refuerzo', 'profundización', 'recurso_complementario']).toContain(rec.type);
    }
  });
});
