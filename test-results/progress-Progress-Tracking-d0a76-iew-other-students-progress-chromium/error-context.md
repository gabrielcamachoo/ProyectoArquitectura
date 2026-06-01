# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: progress.spec.ts >> Progress Tracking >> Student cannot view other students' progress
- Location: tests\e2e\progress.spec.ts:85:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

# Test source

```ts
  13  |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  14  |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  15  |       data: {
  16  |         fullName: 'Progress Student',
  17  |         institutionalEmail: studentEmail,
  18  |         password: 'StudentPass123!',
  19  |         role: 'student',
  20  |       },
  21  |     });
  22  |     const student = await studentReg.json();
  23  |     studentId = student.id;
  24  | 
  25  |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  26  |       data: {
  27  |         institutionalEmail: studentEmail,
  28  |         password: 'StudentPass123!',
  29  |       },
  30  |     });
  31  |     const { accessToken } = await studentLogin.json();
  32  |     studentToken = accessToken;
  33  |   });
  34  | 
  35  |   test('Get student course progress', async ({ request }) => {
  36  |     const response = await request.get(
  37  |       `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
  38  |       {
  39  |         headers: { Authorization: `Bearer ${studentToken}` },
  40  |       }
  41  |     );
  42  |     // 200 or 404 both acceptable initially
  43  |     expect([200, 404]).toContain(response.status());
  44  |   });
  45  | 
  46  |   test('Get overall student progress', async ({ request }) => {
  47  |     const response = await request.get(`${PROGRESS_API}/progress/student/${studentId}`, {
  48  |       headers: { Authorization: `Bearer ${studentToken}` },
  49  |     });
  50  |     expect(response.status()).toBe(200);
  51  |     const progress = await response.json();
  52  |     expect(Array.isArray(progress) || typeof progress === 'object').toBeTruthy();
  53  |   });
  54  | 
  55  |   test('Teacher can view student progress', async ({ request }) => {
  56  |     // Register teacher
  57  |     const teacherEmail = `teacher-${Date.now()}@puj.edu.co`;
  58  |     const teacherReg = await request.post(`${AUTH_API}/auth/register`, {
  59  |       data: {
  60  |         fullName: 'Progress Teacher',
  61  |         institutionalEmail: teacherEmail,
  62  |         password: 'TeacherPass123!',
  63  |         role: 'teacher',
  64  |       },
  65  |     });
  66  | 
  67  |     const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
  68  |       data: {
  69  |         institutionalEmail: teacherEmail,
  70  |         password: 'TeacherPass123!',
  71  |       },
  72  |     });
  73  |     const { accessToken: teacherToken } = await teacherLogin.json();
  74  | 
  75  |     // Teacher views student progress
  76  |     const response = await request.get(
  77  |       `${PROGRESS_API}/progress/student/${studentId}`,
  78  |       {
  79  |         headers: { Authorization: `Bearer ${teacherToken}` },
  80  |       }
  81  |     );
  82  |     expect([200, 401, 403]).toContain(response.status());
  83  |   });
  84  | 
  85  |   test('Student cannot view other students\' progress', async ({ request }) => {
  86  |     // Create another student
  87  |     const otherEmail = `student-${Date.now() + 1}@puj.edu.co`;
  88  |     const otherReg = await request.post(`${AUTH_API}/auth/register`, {
  89  |       data: {
  90  |         fullName: 'Other Progress Student',
  91  |         institutionalEmail: otherEmail,
  92  |         password: 'StudentPass123!',
  93  |         role: 'student',
  94  |       },
  95  |     });
  96  |     const otherStudent = await otherReg.json();
  97  | 
  98  |     const otherLogin = await request.post(`${AUTH_API}/auth/login`, {
  99  |       data: {
  100 |         institutionalEmail: otherEmail,
  101 |         password: 'StudentPass123!',
  102 |       },
  103 |     });
  104 |     const { accessToken: otherToken } = await otherLogin.json();
  105 | 
  106 |     // Try to view first student's progress
  107 |     const response = await request.get(
  108 |       `${PROGRESS_API}/progress/student/${studentId}`,
  109 |       {
  110 |         headers: { Authorization: `Bearer ${otherToken}` },
  111 |       }
  112 |     );
> 113 |     expect(response.status()).toBe(403);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  114 |   });
  115 | 
  116 |   test('Progress percentage is valid (0-100)', async ({ request }) => {
  117 |     const response = await request.get(
  118 |       `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
  119 |       {
  120 |         headers: { Authorization: `Bearer ${studentToken}` },
  121 |       }
  122 |     );
  123 | 
  124 |     if (response.status() === 200) {
  125 |       const progress = await response.json();
  126 |       if (progress.percentage !== undefined) {
  127 |         expect(progress.percentage).toBeGreaterThanOrEqual(0);
  128 |         expect(progress.percentage).toBeLessThanOrEqual(100);
  129 |       }
  130 |     }
  131 |   });
  132 | 
  133 |   test('Progress status is valid enum', async ({ request }) => {
  134 |     const response = await request.get(
  135 |       `${PROGRESS_API}/progress/student/${studentId}/course/${courseId}`,
  136 |       {
  137 |         headers: { Authorization: `Bearer ${studentToken}` },
  138 |       }
  139 |     );
  140 | 
  141 |     if (response.status() === 200) {
  142 |       const progress = await response.json();
  143 |       if (progress.status) {
  144 |         expect(['not_started', 'in_progress', 'completed']).toContain(progress.status);
  145 |       }
  146 |     }
  147 |   });
  148 | });
  149 | 
```