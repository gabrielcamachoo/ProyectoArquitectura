# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assessment.spec.ts >> Assessment & Grading Flow >> Get evaluations list
- Location: tests\e2e\assessment.spec.ts:79:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ASSESSMENT_API = 'http://localhost:3002';
  4   | const AUTH_API = 'http://localhost:3000';
  5   | 
  6   | let studentToken: string;
  7   | let studentId: string;
  8   | let teacherToken: string;
  9   | let teacherId: string;
  10  | let evaluationId: string;
  11  | let attemptId: string;
  12  | let courseId: string;
  13  | 
  14  | test.describe('Assessment & Grading Flow', () => {
  15  |   test.beforeAll(async ({ request }) => {
  16  |     // Register and login student
  17  |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  18  |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  19  |       data: {
  20  |         fullName: 'Assessment Student',
  21  |         institutionalEmail: studentEmail,
  22  |         password: 'StudentPass123!',
  23  |         role: 'student',
  24  |       },
  25  |     });
  26  |     const student = await studentReg.json();
  27  |     studentId = student.id;
  28  |     courseId = student.courseId || 'course-001'; // Mock course
  29  | 
  30  |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  31  |       data: {
  32  |         institutionalEmail: studentEmail,
  33  |         password: 'StudentPass123!',
  34  |       },
  35  |     });
  36  |     const { accessToken: sToken } = await studentLogin.json();
  37  |     studentToken = sToken;
  38  | 
  39  |     // Register and login teacher
  40  |     const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
  41  |     const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
  42  |       data: {
  43  |         fullName: 'Assessment Teacher',
  44  |         institutionalEmail: teacherEmail,
  45  |         password: 'TeacherPass123!',
  46  |         role: 'teacher',
  47  |       },
  48  |     });
  49  |     const teacher = await teacherReg.json();
  50  |     teacherId = teacher.id;
  51  | 
  52  |     const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
  53  |       data: {
  54  |         institutionalEmail: teacherEmail,
  55  |         password: 'TeacherPass123!',
  56  |       },
  57  |     });
  58  |     const { accessToken: tToken } = await teacherLogin.json();
  59  |     teacherToken = tToken;
  60  |   });
  61  | 
  62  |   test('Create evaluation', async ({ request }) => {
  63  |     const response = await request.post(`${ASSESSMENT_API}/evaluations`, {
  64  |       headers: { Authorization: `Bearer ${teacherToken}` },
  65  |       data: {
  66  |         courseId,
  67  |         title: 'Quiz 1: Derivatives',
  68  |         type: 'quiz',
  69  |         weight: 0.2,
  70  |         deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  71  |       },
  72  |     });
  73  |     expect(response.status()).toBe(201);
  74  |     const evaluation = await response.json();
  75  |     evaluationId = evaluation.id;
  76  |     expect(evaluation.title).toBe('Quiz 1: Derivatives');
  77  |   });
  78  | 
  79  |   test('Get evaluations list', async ({ request }) => {
  80  |     const response = await request.get(`${ASSESSMENT_API}/evaluations`, {
  81  |       headers: { Authorization: `Bearer ${studentToken}` },
  82  |     });
  83  |     expect(response.status()).toBe(200);
  84  |     const evaluations = await response.json();
> 85  |     expect(Array.isArray(evaluations)).toBeTruthy();
      |                                        ^ Error: expect(received).toBeTruthy()
  86  |   });
  87  | 
  88  |   test('Student starts attempt', async ({ request }) => {
  89  |     const response = await request.post(
  90  |       `${ASSESSMENT_API}/evaluations/${evaluationId}/attempts`,
  91  |       {
  92  |         headers: { Authorization: `Bearer ${studentToken}` },
  93  |         data: { studentId, courseId },
  94  |       }
  95  |     );
  96  |     expect(response.status()).toBe(201);
  97  |     const attempt = await response.json();
  98  |     attemptId = attempt.id;
  99  |     expect(attempt.status).toBe('in_progress');
  100 |   });
  101 | 
  102 |   test('Student submits attempt', async ({ request }) => {
  103 |     const response = await request.put(`${ASSESSMENT_API}/attempts/${attemptId}/submit`, {
  104 |       headers: { Authorization: `Bearer ${studentToken}` },
  105 |       data: {
  106 |         answers: [
  107 |           { questionId: 'q1', answer: 'derivative' },
  108 |           { questionId: 'q2', answer: 'chain rule' },
  109 |         ],
  110 |       },
  111 |     });
  112 |     expect(response.status()).toBe(200);
  113 |     const submitted = await response.json();
  114 |     expect(submitted.status).toBe('submitted');
  115 |   });
  116 | 
  117 |   test('Teacher grades attempt (returns <2s)', async ({ request }) => {
  118 |     const startTime = Date.now();
  119 | 
  120 |     const response = await request.put(`${ASSESSMENT_API}/attempts/${attemptId}/grade`, {
  121 |       headers: { Authorization: `Bearer ${teacherToken}` },
  122 |       data: { score: 85 },
  123 |     });
  124 | 
  125 |     const endTime = Date.now();
  126 |     const elapsedTime = endTime - startTime;
  127 | 
  128 |     expect(response.status()).toBe(200);
  129 |     const graded = await response.json();
  130 |     expect(graded.status).toBe('graded');
  131 |     expect(graded.score).toBe(85);
  132 | 
  133 |     // Critical requirement: Must return within 2 seconds
  134 |     expect(elapsedTime).toBeLessThan(2000);
  135 |     console.log(`⏱️ Grading completed in ${elapsedTime}ms (target: <2000ms)`);
  136 |   });
  137 | 
  138 |   test('Cannot access others\' attempts (RBAC)', async ({ request }) => {
  139 |     // Student tries to grade another student's attempt
  140 |     const response = await request.put(`${ASSESSMENT_API}/attempts/${attemptId}/grade`, {
  141 |       headers: { Authorization: `Bearer ${studentToken}` },
  142 |       data: { score: 100 },
  143 |     });
  144 |     expect(response.status()).toBe(403);
  145 |   });
  146 | 
  147 |   test('Attempt status progression', async ({ request }) => {
  148 |     // Create new eval and attempt
  149 |     const evalRes = await request.post(`${ASSESSMENT_API}/evaluations`, {
  150 |       headers: { Authorization: `Bearer ${teacherToken}` },
  151 |       data: {
  152 |         courseId,
  153 |         title: 'Status Test Quiz',
  154 |         type: 'quiz',
  155 |         weight: 0.1,
  156 |         deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  157 |       },
  158 |     });
  159 |     const newEvalId = (await evalRes.json()).id;
  160 | 
  161 |     // Start attempt
  162 |     const attemptRes = await request.post(
  163 |       `${ASSESSMENT_API}/evaluations/${newEvalId}/attempts`,
  164 |       {
  165 |         headers: { Authorization: `Bearer ${studentToken}` },
  166 |         data: { studentId, courseId },
  167 |       }
  168 |     );
  169 |     const newAttemptId = (await attemptRes.json()).id;
  170 |     const startedAttempt = await attemptRes.json();
  171 |     expect(startedAttempt.status).toBe('in_progress');
  172 | 
  173 |     // Submit
  174 |     const submitRes = await request.put(`${ASSESSMENT_API}/attempts/${newAttemptId}/submit`, {
  175 |       headers: { Authorization: `Bearer ${studentToken}` },
  176 |       data: { answers: [] },
  177 |     });
  178 |     const submittedAttempt = await submitRes.json();
  179 |     expect(submittedAttempt.status).toBe('submitted');
  180 | 
  181 |     // Grade
  182 |     const gradeRes = await request.put(`${ASSESSMENT_API}/attempts/${newAttemptId}/grade`, {
  183 |       headers: { Authorization: `Bearer ${teacherToken}` },
  184 |       data: { score: 75 },
  185 |     });
```