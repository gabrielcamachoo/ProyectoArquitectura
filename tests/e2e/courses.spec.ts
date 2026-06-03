import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:5173';

let teacherToken: string;
let teacherId: string;
let courseId: string;

test.describe('Course Management', () => {
  test.beforeAll(async ({ request }) => {
    // Register teacher
    const authBase = 'http://localhost:3000';
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const registerResponse = await request.post(`${authBase}/auth/register`, {
      data: {
        fullName: 'Test Teacher',
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
        role: 'teacher',
      },
    });
    const teacher = await registerResponse.json();
    teacherId = teacher.id;

    // Login teacher
    const loginResponse = await request.post(`${authBase}/auth/login`, {
      data: {
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
      },
    });
    const { accessToken } = await loginResponse.json();
    teacherToken = accessToken;
  });

  test('Create course', async ({ request }) => {
    const response = await request.post(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        courseId: `CS-${Date.now()}`,
        name: 'Advanced Mathematics',
        description: 'Calculus and Linear Algebra',
        teacherId,
        status: 'draft',
      },
    });
    expect(response.status()).toBe(201);
    const course = await response.json();
    courseId = course.id;
    expect(course.name).toBe('Advanced Mathematics');
  });

  test('Get courses list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/courses`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.courses)).toBeTruthy();
  });

  test('Get course details', async ({ request }) => {
    const response = await request.get(`${API_BASE}/courses/${courseId}`);
    expect(response.status()).toBe(200);
    const course = await response.json();
    expect(course.id).toBe(courseId);
  });

  test('Add module to course', async ({ request }) => {
    const response = await request.post(`${API_BASE}/courses/${courseId}/modules`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        title: 'Module 1: Derivatives',
        order: 1,
        status: 'draft',
      },
    });
    expect(response.status()).toBe(201);
    const module = await response.json();
    expect(module.title).toBe('Module 1: Derivatives');
  });

  test('Get course modules', async ({ request }) => {
    const response = await request.get(`${API_BASE}/courses/${courseId}/modules`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.modules)).toBeTruthy();
  });

  test('Add material to module', async ({ request }) => {
    // First get a module
    const modulesResponse = await request.get(`${API_BASE}/courses/${courseId}/modules`);
    const data = await modulesResponse.json();
    const moduleId = data.modules[0]?.id;

    if (!moduleId) {
      test.skip();
    }

    const response = await request.post(
      `${API_BASE}/courses/${courseId}/modules/${moduleId}/materials`,
      {
        headers: { Authorization: `Bearer ${teacherToken}` },
        data: {
          title: 'Derivatives Lecture',
          type: 'video',
          url: 'https://example.com/derivatives.mp4',
          visibility: 'public',
        },
      }
    );
    expect(response.status()).toBe(201);
    const material = await response.json();
    expect(material.title).toBe('Derivatives Lecture');
  });

  test('Publish course', async ({ request }) => {
    const response = await request.post(`${API_BASE}/courses/${courseId}/publish`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.status).toBe('published');
  });

  test('Frontend course listing', async ({ page }) => {
    // Login first
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const authBase = 'http://localhost:3000';
    await page.request.post(`${authBase}/auth/register`, {
      data: {
        fullName: 'Course Viewer',
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
      },
    });

    const loginResponse = await page.request.post(`${authBase}/auth/login`, {
      data: {
        institutionalEmail: studentEmail,
        password: 'StudentPass123!',
      },
    });
    const { accessToken } = await loginResponse.json();

    // Visit frontend
    await page.goto(`${FRONTEND_BASE}/login`);
    await page.fill('input[type="email"]', studentEmail);
    await page.fill('input[type="password"]', 'StudentPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/**');

    // Navigate to courses
    await page.click('text=Cursos');
    await page.waitForURL('**/courses');
    await expect(page.locator('text=Cursos').first()).toBeVisible();
  });
});
