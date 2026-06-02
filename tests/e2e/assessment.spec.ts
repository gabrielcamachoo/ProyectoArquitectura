import { test, expect } from '@playwright/test';

const ASSESSMENT_API = 'http://localhost:3002';
const AUTH_API = 'http://localhost:3000';
const COURSE_API = 'http://localhost:3001';

let studentToken: string;
let studentId: string;
let teacherToken: string;
let teacherId: string;
let evaluationId: string;
let attemptId: string;
let courseId: string;

test.describe('Assessment & Grading Flow', () => {
  test.beforeAll(async ({ request }) => {
    // Register and login student
    const studentEmail = `student-${Date.now()}@puj.edu.co`;
    const studentReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Assessment Student',
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
    const { accessToken: sToken } = await studentLogin.json();
    studentToken = sToken;

    // Register and login teacher
    const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
    const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
      data: {
        fullName: 'Assessment Teacher',
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
        role: 'teacher',
      },
    });
    const teacher = await teacherReg.json();
    teacherId = teacher.id;

    const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
      data: {
        institutionalEmail: teacherEmail,
        password: 'TeacherPass123!',
      },
    });
    const { accessToken: tToken } = await teacherLogin.json();
    teacherToken = tToken;

    // Create a valid course
    const courseRes = await request.post(`${COURSE_API}/courses`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        name: 'Assessment Test Course',
        description: 'Mock course for assessment E2E',
      },
    });
    const course = await courseRes.json();
    courseId = course.id;
  });

  test('Create evaluation', async ({ request }) => {
    const response = await request.post(`${ASSESSMENT_API}/evaluations`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        courseId,
        title: 'Quiz 1: Derivatives',
        type: 'quiz',
        weight: 0.2,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect(response.status()).toBe(201);
    const evaluation = await response.json();
    evaluationId = evaluation.id;
    expect(evaluation.title).toBe('Quiz 1: Derivatives');
  });

  test('Get evaluations list', async ({ request }) => {
    const response = await request.get(`${ASSESSMENT_API}/evaluations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.evaluations)).toBeTruthy();
  });

  test('Student starts attempt', async ({ request }) => {
    const response = await request.post(
      `${ASSESSMENT_API}/evaluations/${evaluationId}/attempts`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
        data: { studentId, courseId },
      }
    );
    expect(response.status()).toBe(201);
    const attempt = await response.json();
    attemptId = attempt.id;
    
    // Start the attempt
    const startRes = await request.post(`${ASSESSMENT_API}/attempts/${attemptId}/start`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const started = await startRes.json();
    expect(started.status).toBe('in_progress');
  });

  test('Student submits attempt', async ({ request }) => {
    const response = await request.post(`${ASSESSMENT_API}/attempts/${attemptId}/submit`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: {
        answers: [
          { questionId: 'q1', answer: 'derivative' },
          { questionId: 'q2', answer: 'chain rule' },
        ],
      },
    });
    expect(response.status()).toBe(200);
    const submitted = await response.json();
    expect(submitted.status).toBe('submitted');
  });

  test('Teacher grades attempt (returns <2s)', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${ASSESSMENT_API}/attempts/${attemptId}/grade`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: { score: 85 },
    });

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    expect(response.status()).toBe(200);
    const graded = await response.json();
    expect(graded.attempt.status).toBe('graded');
    expect(graded.attempt.score).toBe(85);

    // Critical requirement: Must return within 2 seconds
    expect(elapsedTime).toBeLessThan(2000);
    console.log(`⏱️ Grading completed in ${elapsedTime}ms (target: <2000ms)`);
  });

  test('Cannot access others\' attempts (RBAC)', async ({ request }) => {
    // Student tries to grade another student's attempt
    const response = await request.post(`${ASSESSMENT_API}/attempts/${attemptId}/grade`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { score: 100 },
    });
    expect(response.status()).toBe(403);
  });

  test('Attempt status progression', async ({ request }) => {
    // Create new eval and attempt
    const evalRes = await request.post(`${ASSESSMENT_API}/evaluations`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: {
        courseId,
        title: 'Status Test Quiz',
        type: 'quiz',
        weight: 0.1,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const newEvalId = (await evalRes.json()).id;

    // Start attempt
    const attemptRes = await request.post(
      `${ASSESSMENT_API}/evaluations/${newEvalId}/attempts`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
        data: { studentId, courseId },
      }
    );
    const newAttemptId = (await attemptRes.json()).id;
    const createdAttempt = await attemptRes.json();
    expect(createdAttempt.status).toBe('created');
    
    // Start attempt properly
    const startRes = await request.post(`${ASSESSMENT_API}/attempts/${newAttemptId}/start`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const startedAttempt = await startRes.json();
    expect(startedAttempt.status).toBe('in_progress');

    // Submit
    const submitRes = await request.post(`${ASSESSMENT_API}/attempts/${newAttemptId}/submit`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { answers: [] },
    });
    const submittedAttempt = await submitRes.json();
    expect(submittedAttempt.status).toBe('submitted');

    // Grade
    const gradeRes = await request.post(`${ASSESSMENT_API}/attempts/${newAttemptId}/grade`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: { score: 75 },
    });
    const gradedAttempt = await gradeRes.json();
    expect(gradedAttempt.attempt.status).toBe('graded');
  });
});
