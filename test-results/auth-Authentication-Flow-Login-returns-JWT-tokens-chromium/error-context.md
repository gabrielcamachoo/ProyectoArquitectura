# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> Login returns JWT tokens
- Location: tests\e2e\auth.spec.ts:21:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const API_BASE = 'http://localhost:3000';
  4   | const FRONTEND_BASE = 'http://localhost:5173';
  5   | 
  6   | test.describe('Authentication Flow', () => {
  7   |   test('Register new user', async ({ request }) => {
  8   |     const response = await request.post(`${API_BASE}/auth/register`, {
  9   |       data: {
  10  |         fullName: 'Test Student',
  11  |         institutionalEmail: `student-${Date.now()}@puj.edu.co`,
  12  |         password: 'SecurePass123!',
  13  |       },
  14  |     });
  15  |     expect(response.status()).toBe(201);
  16  |     const user = await response.json();
  17  |     expect(user).toHaveProperty('id');
  18  |     expect(user).toHaveProperty('fullName', 'Test Student');
  19  |   });
  20  | 
  21  |   test('Login returns JWT tokens', async ({ request }) => {
  22  |     const email = `student-${Date.now()}@puj.edu.co`;
  23  |     // Register first
  24  |     await request.post(`${API_BASE}/auth/register`, {
  25  |       data: {
  26  |         fullName: 'JWT Test User',
  27  |         institutionalEmail: email,
  28  |         password: 'TestPass123!',
  29  |       },
  30  |     });
  31  | 
  32  |     // Login
  33  |     const loginResponse = await request.post(`${API_BASE}/auth/login`, {
  34  |       data: {
  35  |         institutionalEmail: email,
  36  |         password: 'TestPass123!',
  37  |       },
  38  |     });
> 39  |     expect(loginResponse.status()).toBe(200);
      |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  40  |     const { accessToken, refreshToken } = await loginResponse.json();
  41  |     expect(accessToken).toBeTruthy();
  42  |     expect(refreshToken).toBeTruthy();
  43  |   });
  44  | 
  45  |   test('Refresh token generates new access token', async ({ request }) => {
  46  |     const email = `student-${Date.now()}@puj.edu.co`;
  47  |     // Register & login
  48  |     await request.post(`${API_BASE}/auth/register`, {
  49  |       data: {
  50  |         fullName: 'Refresh Token Test',
  51  |         institutionalEmail: email,
  52  |         password: 'TestPass123!',
  53  |       },
  54  |     });
  55  | 
  56  |     const loginResponse = await request.post(`${API_BASE}/auth/login`, {
  57  |       data: {
  58  |         institutionalEmail: email,
  59  |         password: 'TestPass123!',
  60  |       },
  61  |     });
  62  |     const { refreshToken } = await loginResponse.json();
  63  | 
  64  |     // Use refresh token
  65  |     const refreshResponse = await request.post(`${API_BASE}/auth/refresh`, {
  66  |       data: { refreshToken },
  67  |     });
  68  |     expect(refreshResponse.status()).toBe(200);
  69  |     const newTokens = await refreshResponse.json();
  70  |     expect(newTokens.accessToken).toBeTruthy();
  71  |   });
  72  | 
  73  |   test('Invalid credentials return 401', async ({ request }) => {
  74  |     const response = await request.post(`${API_BASE}/auth/login`, {
  75  |       data: {
  76  |         institutionalEmail: 'nonexistent@puj.edu.co',
  77  |         password: 'WrongPassword',
  78  |       },
  79  |     });
  80  |     expect(response.status()).toBe(401);
  81  |   });
  82  | 
  83  |   test('Frontend login flow', async ({ page }) => {
  84  |     // Register user first
  85  |     const email = `fe-student-${Date.now()}@puj.edu.co`;
  86  |     const response = await page.request.post(`${API_BASE}/auth/register`, {
  87  |       data: {
  88  |         fullName: 'Frontend Test User',
  89  |         institutionalEmail: email,
  90  |         password: 'FrontendPass123!',
  91  |       },
  92  |     });
  93  |     expect(response.ok()).toBeTruthy();
  94  | 
  95  |     // Navigate to login
  96  |     await page.goto(`${FRONTEND_BASE}/login`);
  97  |     await expect(page.locator('text=Log In')).toBeVisible();
  98  | 
  99  |     // Fill login form
  100 |     await page.fill('input[type="email"]', email);
  101 |     await page.fill('input[type="password"]', 'FrontendPass123!');
  102 |     await page.click('button[type="submit"]');
  103 | 
  104 |     // Verify redirect to dashboard
  105 |     await page.waitForURL('**/dashboard');
  106 |     await expect(page).toHaveURL(/\/dashboard/);
  107 |   });
  108 | });
  109 | 
```