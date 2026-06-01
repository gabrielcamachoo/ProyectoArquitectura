import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const FRONTEND_BASE = 'http://localhost:5173';

test.describe('Authentication Flow', () => {
  test('Register new user', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'Test Student',
        institutionalEmail: `student-${Date.now()}@puj.edu.co`,
        password: 'SecurePass123!',
      },
    });
    expect(response.status()).toBe(201);
    const user = await response.json();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('fullName', 'Test Student');
  });

  test('Login returns JWT tokens', async ({ request }) => {
    const email = `student-${Date.now()}@puj.edu.co`;
    // Register first
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'JWT Test User',
        institutionalEmail: email,
        password: 'TestPass123!',
      },
    });

    // Login
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: email,
        password: 'TestPass123!',
      },
    });
    expect(loginResponse.status()).toBe(200);
    const { accessToken, refreshToken } = await loginResponse.json();
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  test('Refresh token generates new access token', async ({ request }) => {
    const email = `student-${Date.now()}@puj.edu.co`;
    // Register & login
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'Refresh Token Test',
        institutionalEmail: email,
        password: 'TestPass123!',
      },
    });

    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: email,
        password: 'TestPass123!',
      },
    });
    const { refreshToken } = await loginResponse.json();

    // Use refresh token
    const refreshResponse = await request.post(`${API_BASE}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshResponse.status()).toBe(200);
    const newTokens = await refreshResponse.json();
    expect(newTokens.accessToken).toBeTruthy();
  });

  test('Invalid credentials return 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        institutionalEmail: 'nonexistent@puj.edu.co',
        password: 'WrongPassword',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('Frontend login flow', async ({ page }) => {
    // Register user first
    const email = `fe-student-${Date.now()}@puj.edu.co`;
    const response = await page.request.post(`${API_BASE}/auth/register`, {
      data: {
        fullName: 'Frontend Test User',
        institutionalEmail: email,
        password: 'FrontendPass123!',
      },
    });
    expect(response.ok()).toBeTruthy();

    // Navigate to login
    await page.goto(`${FRONTEND_BASE}/login`);
    await expect(page.locator('text=Log In')).toBeVisible();

    // Fill login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'FrontendPass123!');
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
