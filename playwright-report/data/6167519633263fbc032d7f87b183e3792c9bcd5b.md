# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analytics.spec.ts >> Analytics Dashboard (CQRS + Read Replica) >> Student cannot access analytics (RBAC)
- Location: tests\e2e\analytics.spec.ts:63:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ANALYTICS_API = 'http://localhost:3006';
  4   | const AUTH_API = 'http://localhost:3000';
  5   | 
  6   | let teacherToken: string;
  7   | let courseId = 'test-course-' + Date.now();
  8   | 
  9   | test.describe('Analytics Dashboard (CQRS + Read Replica)', () => {
  10  |   test.beforeAll(async ({ request }) => {
  11  |     // Register and login teacher
  12  |     const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
  13  |     const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
  14  |       data: {
  15  |         fullName: 'Analytics Teacher',
  16  |         institutionalEmail: teacherEmail,
  17  |         password: 'TeacherPass123!',
  18  |         role: 'teacher',
  19  |       },
  20  |     });
  21  | 
  22  |     const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
  23  |       data: {
  24  |         institutionalEmail: teacherEmail,
  25  |         password: 'TeacherPass123!',
  26  |       },
  27  |     });
  28  |     const { accessToken } = await teacherLogin.json();
  29  |     teacherToken = accessToken;
  30  |   });
  31  | 
  32  |   test('Get course dashboard', async ({ request }) => {
  33  |     const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
  34  |       headers: { Authorization: `Bearer ${teacherToken}` },
  35  |     });
  36  |     // 200 or 404 both acceptable
  37  |     expect([200, 404]).toContain(response.status());
  38  | 
  39  |     if (response.status() === 200) {
  40  |       const dashboard = await response.json();
  41  |       expect(dashboard).toHaveProperty('completion_rate');
  42  |       expect(dashboard).toHaveProperty('avg_score');
  43  |       expect(dashboard).toHaveProperty('active_students');
  44  |     }
  45  |   });
  46  | 
  47  |   test('Get course student progress list', async ({ request }) => {
  48  |     const response = await request.get(
  49  |       `${ANALYTICS_API}/analytics/course/${courseId}/students`,
  50  |       {
  51  |         headers: { Authorization: `Bearer ${teacherToken}` },
  52  |       }
  53  |     );
  54  |     // 200 or 404 both acceptable
  55  |     expect([200, 404]).toContain(response.status());
  56  | 
  57  |     if (response.status() === 200) {
  58  |       const students = await response.json();
  59  |       expect(Array.isArray(students)).toBeTruthy();
  60  |     }
  61  |   });
  62  | 
  63  |   test('Student cannot access analytics (RBAC)', async ({ request }) => {
  64  |     // Register student
  65  |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  66  |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  67  |       data: {
  68  |         fullName: 'Analytics Student',
  69  |         institutionalEmail: studentEmail,
  70  |         password: 'StudentPass123!',
  71  |         role: 'student',
  72  |       },
  73  |     });
  74  | 
  75  |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  76  |       data: {
  77  |         institutionalEmail: studentEmail,
  78  |         password: 'StudentPass123!',
  79  |       },
  80  |     });
  81  |     const { accessToken: studentToken } = await studentLogin.json();
  82  | 
  83  |     // Student tries to access analytics
  84  |     const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
  85  |       headers: { Authorization: `Bearer ${studentToken}` },
  86  |     });
> 87  |     expect(response.status()).toBe(403);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  88  |   });
  89  | 
  90  |   test('Dashboard metrics are valid numbers', async ({ request }) => {
  91  |     const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
  92  |       headers: { Authorization: `Bearer ${teacherToken}` },
  93  |     });
  94  | 
  95  |     if (response.status() === 200) {
  96  |       const dashboard = await response.json();
  97  | 
  98  |       if (dashboard.completion_rate !== undefined) {
  99  |         expect(typeof dashboard.completion_rate).toBe('number');
  100 |         expect(dashboard.completion_rate).toBeGreaterThanOrEqual(0);
  101 |         expect(dashboard.completion_rate).toBeLessThanOrEqual(100);
  102 |       }
  103 | 
  104 |       if (dashboard.avg_score !== undefined) {
  105 |         expect(typeof dashboard.avg_score).toBe('number');
  106 |       }
  107 | 
  108 |       if (dashboard.active_students !== undefined) {
  109 |         expect(typeof dashboard.active_students).toBe('number');
  110 |         expect(dashboard.active_students).toBeGreaterThanOrEqual(0);
  111 |       }
  112 |     }
  113 |   });
  114 | 
  115 |   test('Uses read-replica (DATABASE_READ_URL)', async ({ request }) => {
  116 |     // This test verifies the service responds quickly
  117 |     // Read-replica queries should be fast
  118 |     const startTime = Date.now();
  119 | 
  120 |     const response = await request.get(`${ANALYTICS_API}/analytics/course/${courseId}`, {
  121 |       headers: { Authorization: `Bearer ${teacherToken}` },
  122 |     });
  123 | 
  124 |     const elapsedTime = Date.now() - startTime;
  125 | 
  126 |     // Analytics queries should be fast (read-replica optimization)
  127 |     if (response.status() === 200) {
  128 |       expect(elapsedTime).toBeLessThan(1000); // <1 second for read-replica
  129 |       console.log(`📊 Analytics query completed in ${elapsedTime}ms`);
  130 |     }
  131 |   });
  132 | });
  133 | 
```