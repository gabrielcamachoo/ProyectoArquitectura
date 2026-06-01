# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Critical Flows & Performance >> Concurrent requests do not interfere
- Location: tests\e2e\critical-flows.spec.ts:219:7

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not undefined
```

# Test source

```ts
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
  238 |       const { accessToken } = await login.json();
  239 |       return { user, token: accessToken };
  240 |     };
  241 | 
  242 |     const [s1, s2] = await Promise.all([
  243 |       createStudent('_1'),
  244 |       createStudent('_2'),
  245 |     ]);
  246 | 
> 247 |     expect(s1.user.id).not.toBe(s2.user.id);
      |                            ^ Error: expect(received).not.toBe(expected) // Object.is equality
  248 |     console.log('✅ Concurrent operations maintain isolation');
  249 |   });
  250 | 
  251 |   test('Error responses follow standard format', async ({ request }) => {
  252 |     // Test that all errors follow consistent format
  253 | 
  254 |     const response = await request.post(`${AUTH_API}/auth/login`, {
  255 |       data: {
  256 |         institutionalEmail: 'nonexistent@puj.edu.co',
  257 |         password: 'WrongPassword',
  258 |       },
  259 |     });
  260 | 
  261 |     expect(response.status()).toBe(401);
  262 |     const error = await response.json();
  263 | 
  264 |     // Verify error format
  265 |     expect(error).toHaveProperty('message');
  266 |     console.log(`✅ Error format consistent: ${error.message}`);
  267 |   });
  268 | 
  269 |   test('End-to-end student workflow', async ({ request }) => {
  270 |     // Complete student lifecycle: register → login → view courses → attempt eval → see progress
  271 | 
  272 |     const email = `e2e-${Date.now()}@puj.edu.co`;
  273 | 
  274 |     // 1. Register
  275 |     const regRes = await request.post(`${AUTH_API}/auth/register`, {
  276 |       data: {
  277 |         fullName: 'E2E Student',
  278 |         institutionalEmail: email,
  279 |         password: 'E2EPass123!',
  280 |       },
  281 |     });
  282 |     expect(regRes.status()).toBe(201);
  283 |     const student = await regRes.json();
  284 | 
  285 |     // 2. Login
  286 |     const loginRes = await request.post(`${AUTH_API}/auth/login`, {
  287 |       data: {
  288 |         institutionalEmail: email,
  289 |         password: 'E2EPass123!',
  290 |       },
  291 |     });
  292 |     expect(loginRes.status()).toBe(200);
  293 |     const { accessToken } = await loginRes.json();
  294 | 
  295 |     // 3. Get profile
  296 |     const profileRes = await request.get(`${AUTH_API}/users/${student.id}`, {
  297 |       headers: { Authorization: `Bearer ${accessToken}` },
  298 |     });
  299 |     expect([200, 404]).toContain(profileRes.status());
  300 | 
  301 |     // 4. View courses
  302 |     const coursesRes = await request.get('http://localhost:3001/courses', {
  303 |       headers: { Authorization: `Bearer ${accessToken}` },
  304 |     });
  305 |     expect(coursesRes.status()).toBe(200);
  306 | 
  307 |     // 5. View progress
  308 |     const progressRes = await request.get(
  309 |       `http://localhost:3004/progress/student/${student.id}`,
  310 |       {
  311 |         headers: { Authorization: `Bearer ${accessToken}` },
  312 |       }
  313 |     );
  314 |     expect([200, 404]).toContain(progressRes.status());
  315 | 
  316 |     console.log('✅ End-to-end student workflow completed');
  317 |   });
  318 | });
  319 | 
```