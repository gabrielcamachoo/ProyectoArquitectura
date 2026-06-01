# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Critical Flows & Performance >> Grading event propagates to recommendations asynchronously
- Location: tests\e2e\critical-flows.spec.ts:104:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  37  |         role: 'teacher',
  38  |       },
  39  |     });
  40  |     const teacher = await teacherReg.json();
  41  |     const teacherId = teacher.id;
  42  | 
  43  |     const teacherLogin = await request.post(`${AUTH_API}/auth/login`, {
  44  |       data: {
  45  |         institutionalEmail: teacherEmail,
  46  |         password: 'TeacherPass123!',
  47  |       },
  48  |     });
  49  |     const { accessToken: teacherToken } = await teacherLogin.json();
  50  | 
  51  |     // Create evaluation
  52  |     const evalRes = await request.post(`${ASSESSMENT_API}/evaluations`, {
  53  |       headers: { Authorization: `Bearer ${teacherToken}` },
  54  |       data: {
  55  |         courseId,
  56  |         title: 'Critical Flow Evaluation',
  57  |         type: 'quiz',
  58  |         weight: 0.5,
  59  |         deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  60  |       },
  61  |     });
  62  |     const evaluation = await evalRes.json();
  63  |     const evaluationId = evaluation.id;
  64  | 
  65  |     // Student attempts
  66  |     const attemptRes = await request.post(
  67  |       `${ASSESSMENT_API}/evaluations/${evaluationId}/attempts`,
  68  |       {
  69  |         headers: { Authorization: `Bearer ${studentToken}` },
  70  |         data: { studentId, courseId },
  71  |       }
  72  |     );
  73  |     const attempt = await attemptRes.json();
  74  |     const attemptId = attempt.id;
  75  | 
  76  |     // Submit attempt
  77  |     await request.put(`${ASSESSMENT_API}/attempts/${attemptId}/submit`, {
  78  |       headers: { Authorization: `Bearer ${studentToken}` },
  79  |       data: { answers: [{ q: 'a1' }] },
  80  |     });
  81  | 
  82  |     // CRITICAL: Grade attempt - must return <2s without waiting for RabbitMQ
  83  |     const startTime = Date.now();
  84  | 
  85  |     const gradeRes = await request.put(`${ASSESSMENT_API}/attempts/${attemptId}/grade`, {
  86  |       headers: { Authorization: `Bearer ${teacherToken}` },
  87  |       data: { score: 92 },
  88  |     });
  89  | 
  90  |     const endTime = Date.now();
  91  |     const elapsedTime = endTime - startTime;
  92  | 
  93  |     expect(gradeRes.status()).toBe(200);
  94  |     const graded = await gradeRes.json();
  95  |     expect(graded.score).toBe(92);
  96  | 
  97  |     // CRITICAL REQUIREMENT: DR-01 - Must return in <2s
  98  |     expect(elapsedTime).toBeLessThan(2000);
  99  |     console.log(
  100 |       `✅ CRITICAL: gradeAttempt returned in ${elapsedTime}ms (target: <2000ms P95)`
  101 |     );
  102 |   });
  103 | 
  104 |   test('Grading event propagates to recommendations asynchronously', async ({ request }) => {
  105 |     // This test verifies that after grading, recommendations can be fetched
  106 |     // (They may be generated asynchronously via RabbitMQ)
  107 | 
  108 |     const studentEmail = `student-${Date.now()}@puj.edu.co`;
  109 |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  110 |       data: {
  111 |         fullName: 'Async Recommendation Student',
  112 |         institutionalEmail: studentEmail,
  113 |         password: 'StudentPass123!',
  114 |         role: 'student',
  115 |       },
  116 |     });
  117 |     const student = await studentReg.json();
  118 |     const studentId = student.id;
  119 | 
  120 |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  121 |       data: {
  122 |         institutionalEmail: studentEmail,
  123 |         password: 'StudentPass123!',
  124 |       },
  125 |     });
  126 |     const { accessToken: studentToken } = await studentLogin.json();
  127 | 
  128 |     // Fetch recommendations after grading
  129 |     // (Recommendations may be generated asynchronously)
  130 |     const response = await request.get(
  131 |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  132 |       {
  133 |         headers: { Authorization: `Bearer ${studentToken}` },
  134 |       }
  135 |     );
  136 | 
> 137 |     expect(response.status()).toBe(200);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  138 |     console.log('✅ Recommendations endpoint responds after async processing');
  139 |   });
  140 | 
  141 |   test('Hybrid fallback: In-memory works if PostgreSQL unavailable', async ({ request }) => {
  142 |     // This test verifies that even if PRIMARY database is down,
  143 |     // services can still respond using in-memory fallback
  144 | 
  145 |     const email = `fallback-${Date.now()}@puj.edu.co`;
  146 | 
  147 |     // Register (should work with either DB or in-memory)
  148 |     const response = await request.post(`${AUTH_API}/auth/register`, {
  149 |       data: {
  150 |         fullName: 'Fallback Test User',
  151 |         institutionalEmail: email,
  152 |         password: 'FallbackPass123!',
  153 |       },
  154 |     });
  155 | 
  156 |     expect([201, 200]).toContain(response.status());
  157 |     const user = await response.json();
  158 |     expect(user).toHaveProperty('id');
  159 | 
  160 |     console.log('✅ Hybrid persistence (PostgreSQL + in-memory) functioning');
  161 |   });
  162 | 
  163 |   test('Circuit breaker provides fallback on downstream failures', async ({ request }) => {
  164 |     // Test that if external service fails, circuit breaker provides graceful fallback
  165 | 
  166 |     const studentEmail = `circuit-${Date.now()}@puj.edu.co`;
  167 |     const studentReg = await request.post(`${AUTH_API}/auth/register`, {
  168 |       data: {
  169 |         fullName: 'Circuit Breaker Test',
  170 |         institutionalEmail: studentEmail,
  171 |         password: 'CircuitPass123!',
  172 |       },
  173 |     });
  174 |     const student = await studentReg.json();
  175 |     const studentId = student.id;
  176 | 
  177 |     const studentLogin = await request.post(`${AUTH_API}/auth/login`, {
  178 |       data: {
  179 |         institutionalEmail: studentEmail,
  180 |         password: 'CircuitPass123!',
  181 |       },
  182 |     });
  183 |     const { accessToken: studentToken } = await studentLogin.json();
  184 | 
  185 |     // Even if the recommendation engine fails, it should return gracefully
  186 |     const response = await request.get(
  187 |       `${ADAPTIVE_API}/recommendations/student/${studentId}`,
  188 |       {
  189 |         headers: { Authorization: `Bearer ${studentToken}` },
  190 |       }
  191 |     );
  192 | 
  193 |     // Should succeed or gracefully fail (not 500)
  194 |     expect([200, 503]).toContain(response.status());
  195 |     console.log('✅ Circuit breaker provides graceful degradation');
  196 |   });
  197 | 
  198 |   test('Rate limiting prevents abuse', async ({ request }) => {
  199 |     // Attempt many rapid requests to verify rate limiting
  200 |     const studentEmail = `ratelimit-${Date.now()}@puj.edu.co`;
  201 | 
  202 |     const requests = [];
  203 |     for (let i = 0; i < 5; i++) {
  204 |       requests.push(
  205 |         request.get('http://localhost:3001/courses', {
  206 |           headers: { Authorization: 'Bearer test-token' },
  207 |         })
  208 |       );
  209 |     }
  210 | 
  211 |     const responses = await Promise.all(requests);
  212 | 
  213 |     // Some requests may be rate limited
  214 |     const statuses = responses.map(r => r.status());
  215 |     expect(statuses).toBeTruthy();
  216 |     console.log(`📊 Rate limit test: Statuses = ${statuses.join(', ')}`);
  217 |   });
  218 | 
  219 |   test('Concurrent requests do not interfere', async ({ request }) => {
  220 |     // Create two concurrent evaluation flows to verify isolation
  221 | 
  222 |     const createStudent = async (suffix: string) => {
  223 |       const email = `concurrent-${Date.now()}${suffix}@puj.edu.co`;
  224 |       const reg = await request.post(`${AUTH_API}/auth/register`, {
  225 |         data: {
  226 |           fullName: `Concurrent Student ${suffix}`,
  227 |           institutionalEmail: email,
  228 |           password: 'ConcurrentPass123!',
  229 |         },
  230 |       });
  231 |       const user = await reg.json();
  232 |       const login = await request.post(`${AUTH_API}/auth/login`, {
  233 |         data: {
  234 |           institutionalEmail: email,
  235 |           password: 'ConcurrentPass123!',
  236 |         },
  237 |       });
```