# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recommendations.spec.ts >> Recommendation Engine >> Student cannot view other students' recommendations
- Location: tests\e2e\recommendations.spec.ts:76:7

# Error details

```
SyntaxError: Unexpected token 'T', "Too many r"... is not valid JSON
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADAPTIVE_API = 'http://localhost:3004';
  4   | const AUTH_API = 'http://localhost:3000';
  5   | 
  6   | let studentToken: string;
  7   | let studentId: string;
  8   | 
  9   | test.describe('Recommendation Engine', () => {
  10  |   test.beforeAll(async ({ request }) => {
  11  |     // Register and login student
  12  |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  13  |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  14  |       data: {
  15  |         fullName: 'Recommendation Student',
  16  |         institutionalEmail: studentEmail,
  17  |         password: 'StudentPass123!',
  18  |         role: 'student',
  19  |       },
  20  |     });
  21  |     const student = await studentReg.json();
  22  |     studentId = student.id;
  23  | 
  24  |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  25  |       data: {
  26  |         institutionalEmail: studentEmail,
  27  |         password: 'StudentPass123!',
  28  |       },
  29  |     });
  30  |     const { accessToken } = await studentLogin.json();
  31  |     studentToken = accessToken;
  32  |   });
  33  | 
  34  |   test('Get recommendations for student', async ({ request }) => {
  35  |     const response = await request.get(
  36  |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  37  |       {
  38  |         headers: { Authorization: `Bearer ${studentToken}` },
  39  |       }
  40  |     );
  41  |     expect(response.status()).toBe(200);
  42  |     const recommendations = await response.json();
  43  |     expect(Array.isArray(recommendations)).toBeTruthy();
  44  |   });
  45  | 
  46  |   test('Teacher can view student recommendations', async ({ request }) => {
  47  |     // Register teacher
  48  |     const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
  49  |     const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
  50  |       data: {
  51  |         fullName: 'Recommendation Teacher',
  52  |         institutionalEmail: teacherEmail,
  53  |         password: 'TeacherPass123!',
  54  |         role: 'teacher',
  55  |       },
  56  |     });
  57  | 
  58  |     const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
  59  |       data: {
  60  |         institutionalEmail: teacherEmail,
  61  |         password: 'TeacherPass123!',
  62  |       },
  63  |     });
  64  |     const { accessToken: teacherToken } = await teacherLogin.json();
  65  | 
  66  |     // Teacher views student recommendations
  67  |     const response = await request.get(
  68  |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  69  |       {
  70  |         headers: { Authorization: `Bearer ${teacherToken}` },
  71  |       }
  72  |     );
  73  |     expect(response.status()).toBe(200);
  74  |   });
  75  | 
  76  |   test('Student cannot view other students\' recommendations', async ({ request }) => {
  77  |     // Create another student
  78  |     const otherStudentEmail = `student-${Date.now() + 1}@puj.edu.co`;
  79  |     const otherReg = await request.post(`${AUTH_API}/auth/register`, {
  80  |       data: {
  81  |         fullName: 'Other Student',
  82  |         institutionalEmail: otherStudentEmail,
  83  |         password: 'StudentPass123!',
  84  |         role: 'student',
  85  |       },
  86  |     });
> 87  |     const otherStudent = await otherReg.json();
      |                          ^ SyntaxError: Unexpected token 'T', "Too many r"... is not valid JSON
  88  | 
  89  |     const otherLogin = await request.post(`${AUTH_API}/auth/login`, {
  90  |       data: {
  91  |         institutionalEmail: otherStudentEmail,
  92  |         password: 'StudentPass123!',
  93  |       },
  94  |     });
  95  |     const { accessToken: otherToken } = await otherLogin.json();
  96  | 
  97  |     // Try to view first student's recommendations
  98  |     const response = await request.get(
  99  |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  100 |       {
  101 |         headers: { Authorization: `Bearer ${otherToken}` },
  102 |       }
  103 |     );
  104 |     expect(response.status()).toBe(403);
  105 |   });
  106 | 
  107 |   test('Recommendations cached in Redis', async ({ request }) => {
  108 |     // First request should hit database/rules engine
  109 |     const first = await request.get(
  110 |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  111 |       {
  112 |         headers: { Authorization: `Bearer ${studentToken}` },
  113 |       }
  114 |     );
  115 |     expect(first.status()).toBe(200);
  116 |     const firstData = await first.json();
  117 | 
  118 |     // Wait 100ms
  119 |     await new Promise(resolve => setTimeout(resolve, 100));
  120 | 
  121 |     // Second request should be from cache (same data)
  122 |     const second = await request.get(
  123 |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  124 |       {
  125 |         headers: { Authorization: `Bearer ${studentToken}` },
  126 |       }
  127 |     );
  128 |     expect(second.status()).toBe(200);
  129 |     const secondData = await second.json();
  130 | 
  131 |     // Data should be consistent
  132 |     expect(JSON.stringify(firstData)).toBe(JSON.stringify(secondData));
  133 |   });
  134 | 
  135 |   test('Recommendations types based on score', async ({ request }) => {
  136 |     // Test that recommendations object includes expected type field
  137 |     const response = await request.get(
  138 |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  139 |       {
  140 |         headers: { Authorization: `Bearer ${studentToken}` },
  141 |       }
  142 |     );
  143 |     expect(response.status()).toBe(200);
  144 |     const recommendations = await response.json();
  145 | 
  146 |     // Verify structure (even if empty, should be array)
  147 |     if (recommendations.length > 0) {
  148 |       const rec = recommendations[0];
  149 |       expect(rec).toHaveProperty('type');
  150 |       expect(rec).toHaveProperty('scope');
  151 |       // Valid types: refuerzo, profundización, recurso_complementario
  152 |       expect(['refuerzo', 'profundización', 'recurso_complementario']).toContain(rec.type);
  153 |     }
  154 |   });
  155 | });
  156 | 
```