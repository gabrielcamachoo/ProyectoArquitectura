# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: courses.spec.ts >> Course Management >> Publish course
- Location: tests\e2e\courses.spec.ts:116:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  21  |       },
  22  |     });
  23  |     const teacher = await registerResponse.json();
  24  |     teacherId = teacher.id;
  25  | 
  26  |     // Login teacher
  27  |     const loginResponse = await request.post(`${authBase}/auth/login`, {
  28  |       data: {
  29  |         institutionalEmail: teacherEmail,
  30  |         password: 'TeacherPass123!',
  31  |       },
  32  |     });
  33  |     const { accessToken } = await loginResponse.json();
  34  |     teacherToken = accessToken;
  35  |   });
  36  | 
  37  |   test('Create course', async ({ request }) => {
  38  |     const response = await request.post(`${API_BASE}/courses`, {
  39  |       headers: { Authorization: `Bearer ${teacherToken}` },
  40  |       data: {
  41  |         courseId: `CS-${Date.now()}`,
  42  |         name: 'Advanced Mathematics',
  43  |         description: 'Calculus and Linear Algebra',
  44  |         teacherId,
  45  |         status: 'draft',
  46  |       },
  47  |     });
  48  |     expect(response.status()).toBe(201);
  49  |     const course = await response.json();
  50  |     courseId = course.id;
  51  |     expect(course.name).toBe('Advanced Mathematics');
  52  |   });
  53  | 
  54  |   test('Get courses list', async ({ request }) => {
  55  |     const response = await request.get(`${API_BASE}/courses`);
  56  |     expect(response.status()).toBe(200);
  57  |     const courses = await response.json();
  58  |     expect(Array.isArray(courses)).toBeTruthy();
  59  |   });
  60  | 
  61  |   test('Get course details', async ({ request }) => {
  62  |     const response = await request.get(`${API_BASE}/courses/${courseId}`);
  63  |     expect(response.status()).toBe(200);
  64  |     const course = await response.json();
  65  |     expect(course.id).toBe(courseId);
  66  |   });
  67  | 
  68  |   test('Add module to course', async ({ request }) => {
  69  |     const response = await request.post(`${API_BASE}/courses/${courseId}/modules`, {
  70  |       headers: { Authorization: `Bearer ${teacherToken}` },
  71  |       data: {
  72  |         title: 'Module 1: Derivatives',
  73  |         order: 1,
  74  |         status: 'draft',
  75  |       },
  76  |     });
  77  |     expect(response.status()).toBe(201);
  78  |     const module = await response.json();
  79  |     expect(module.title).toBe('Module 1: Derivatives');
  80  |   });
  81  | 
  82  |   test('Get course modules', async ({ request }) => {
  83  |     const response = await request.get(`${API_BASE}/courses/${courseId}/modules`);
  84  |     expect(response.status()).toBe(200);
  85  |     const modules = await response.json();
  86  |     expect(Array.isArray(modules)).toBeTruthy();
  87  |   });
  88  | 
  89  |   test('Add material to module', async ({ request }) => {
  90  |     // First get a module
  91  |     const modulesResponse = await request.get(`${API_BASE}/courses/${courseId}/modules`);
  92  |     const modules = await modulesResponse.json();
  93  |     const moduleId = modules[0]?.id;
  94  | 
  95  |     if (!moduleId) {
  96  |       test.skip();
  97  |     }
  98  | 
  99  |     const response = await request.post(
  100 |       `${API_BASE}/courses/${courseId}/modules/${moduleId}/materials`,
  101 |       {
  102 |         headers: { Authorization: `Bearer ${teacherToken}` },
  103 |         data: {
  104 |           title: 'Derivatives Lecture',
  105 |           type: 'video',
  106 |           url: 'https://example.com/derivatives.mp4',
  107 |           visibility: 'public',
  108 |         },
  109 |       }
  110 |     );
  111 |     expect(response.status()).toBe(201);
  112 |     const material = await response.json();
  113 |     expect(material.title).toBe('Derivatives Lecture');
  114 |   });
  115 | 
  116 |   test('Publish course', async ({ request }) => {
  117 |     const response = await request.patch(`${API_BASE}/courses/${courseId}`, {
  118 |       headers: { Authorization: `Bearer ${teacherToken}` },
  119 |       data: { status: 'published' },
  120 |     });
> 121 |     expect(response.status()).toBe(200);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  122 |     const updated = await response.json();
  123 |     expect(updated.status).toBe('published');
  124 |   });
  125 | 
  126 |   test('Frontend course listing', async ({ page }) => {
  127 |     // Login first
  128 |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  129 |     const authBase = 'http://localhost:3000';
  130 |     await page.request.post(`${authBase}/auth/register`, {
  131 |       data: {
  132 |         fullName: 'Course Viewer',
  133 |         institutionalEmail: studentEmail,
  134 |         password: 'StudentPass123!',
  135 |       },
  136 |     });
  137 | 
  138 |     const loginResponse = await page.request.post(`${authBase}/auth/login`, {
  139 |       data: {
  140 |         institutionalEmail: studentEmail,
  141 |         password: 'StudentPass123!',
  142 |       },
  143 |     });
  144 |     const { accessToken } = await loginResponse.json();
  145 | 
  146 |     // Visit frontend
  147 |     await page.goto(`${FRONTEND_BASE}/login`);
  148 |     await page.fill('input[type="email"]', studentEmail);
  149 |     await page.fill('input[type="password"]', 'StudentPass123!');
  150 |     await page.click('button[type="submit"]');
  151 |     await page.waitForURL('**/dashboard');
  152 | 
  153 |     // Navigate to courses
  154 |     await page.click('text=Courses');
  155 |     await page.waitForURL('**/courses');
  156 |     await expect(page.locator('text=Courses')).toBeVisible();
  157 |   });
  158 | });
  159 | 
```