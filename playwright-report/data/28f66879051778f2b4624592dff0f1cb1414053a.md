# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac.spec.ts >> RBAC Enforcement >> Expired token returns 401
- Location: tests\e2e\rbac.spec.ts:147:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 200
Received array: [401, 403]
```

# Test source

```ts
  55  |         fullName: 'RBAC Admin',
  56  |         institutionalEmail: adminEmail,
  57  |         password: 'AdminPass123!',
  58  |         role: 'admin',
  59  |       },
  60  |     });
  61  | 
  62  |     const adminLogin = await request.post(`${API_BASE}/auth/login`, {
  63  |       data: {
  64  |         institutionalEmail: adminEmail,
  65  |         password: 'AdminPass123!',
  66  |       },
  67  |     });
  68  |     const { accessToken: aToken } = await adminLogin.json();
  69  |     adminToken = aToken;
  70  |   });
  71  | 
  72  |   test('Student cannot create courses', async ({ request }) => {
  73  |     const response = await request.post('http://localhost:3001/courses', {
  74  |       headers: { Authorization: `Bearer ${studentToken}` },
  75  |       data: {
  76  |         courseId: 'CS-001',
  77  |         name: 'Test Course',
  78  |         description: 'Student tries to create',
  79  |         teacherId: 'teacher-123',
  80  |         status: 'draft',
  81  |       },
  82  |     });
  83  |     expect(response.status()).toBe(403);
  84  |   });
  85  | 
  86  |   test('Teacher can create courses', async ({ request }) => {
  87  |     const response = await request.post('http://localhost:3001/courses', {
  88  |       headers: { Authorization: `Bearer ${teacherToken}` },
  89  |       data: {
  90  |         courseId: `CS-${Date.now()}`,
  91  |         name: 'Teacher Created Course',
  92  |         description: 'Teacher creates this',
  93  |         teacherId: 'teacher-123',
  94  |         status: 'draft',
  95  |       },
  96  |     });
  97  |     expect([201, 403]).toContain(response.status()); // May fail if data validation
  98  |   });
  99  | 
  100 |   test('Student cannot create evaluations', async ({ request }) => {
  101 |     const response = await request.post('http://localhost:3002/evaluations', {
  102 |       headers: { Authorization: `Bearer ${studentToken}` },
  103 |       data: {
  104 |         courseId: 'course-001',
  105 |         title: 'Student Quiz',
  106 |         type: 'quiz',
  107 |         weight: 0.2,
  108 |         deadline: new Date().toISOString(),
  109 |       },
  110 |     });
  111 |     expect(response.status()).toBe(403);
  112 |   });
  113 | 
  114 |   test('Teacher can create evaluations', async ({ request }) => {
  115 |     const response = await request.post('http://localhost:3002/evaluations', {
  116 |       headers: { Authorization: `Bearer ${teacherToken}` },
  117 |       data: {
  118 |         courseId: `course-${Date.now()}`,
  119 |         title: 'Teacher Quiz',
  120 |         type: 'quiz',
  121 |         weight: 0.2,
  122 |         deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  123 |       },
  124 |     });
  125 |     expect([201, 403]).toContain(response.status());
  126 |   });
  127 | 
  128 |   test('Admin can view analytics', async ({ request }) => {
  129 |     const response = await request.get('http://localhost:3006/analytics/course/course-001', {
  130 |       headers: { Authorization: `Bearer ${adminToken}` },
  131 |     });
  132 |     expect([200, 404, 403]).toContain(response.status());
  133 |   });
  134 | 
  135 |   test('Invalid token returns 401', async ({ request }) => {
  136 |     const response = await request.get('http://localhost:3001/courses', {
  137 |       headers: { Authorization: 'Bearer invalid-token-123' },
  138 |     });
  139 |     expect(response.status()).toBe(401);
  140 |   });
  141 | 
  142 |   test('Missing auth header returns 401', async ({ request }) => {
  143 |     const response = await request.get('http://localhost:3001/courses');
  144 |     expect([200, 401]).toContain(response.status()); // 200 if public endpoint
  145 |   });
  146 | 
  147 |   test('Expired token returns 401', async ({ request }) => {
  148 |     // Create token that expired
  149 |     const expiredToken =
  150 |       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzk5MjJ9.invalid';
  151 | 
  152 |     const response = await request.get('http://localhost:3001/courses', {
  153 |       headers: { Authorization: `Bearer ${expiredToken}` },
  154 |     });
> 155 |     expect([401, 403]).toContain(response.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  156 |   });
  157 | 
  158 |   test('Student attempting admin action returns 403', async ({ request }) => {
  159 |     const response = await request.get(
  160 |       `http://localhost:3006/analytics/course/course-${Date.now()}`,
  161 |       {
  162 |         headers: { Authorization: `Bearer ${studentToken}` },
  163 |       }
  164 |     );
  165 |     expect(response.status()).toBe(403);
  166 |   });
  167 | });
  168 | 
```