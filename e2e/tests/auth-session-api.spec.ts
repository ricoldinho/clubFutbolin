import { expect, test } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Sesión API con cookies', () => {
  test('session + refresh + logout mantienen contrato HTTP', async ({ page }) => {
    await registerAndLogin(page);
    const cookies = await page.context().cookies(apiBaseUrl);
    const csrfCookie = cookies.find((cookie) => cookie.name === 'clubfutbolin_csrf');
    const csrfHeader = { 'x-csrf-token': csrfCookie?.value ?? '' };

    const sessionResponse = await page.request.get(`${apiBaseUrl}/auth/session`);
    expect(sessionResponse.status()).toBe(200);
    const sessionBody = (await sessionResponse.json()) as {
      playerId: string;
      role: string;
    };
    expect(sessionBody.playerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(sessionBody.role).toBe('USER');

    const refreshResponse = await page.request.post(`${apiBaseUrl}/auth/refresh`, {
      headers: csrfHeader,
    });
    expect(refreshResponse.status()).toBe(200);
    const refreshBody = (await refreshResponse.json()) as {
      playerId: string;
      role: string;
      expiresIn: string;
    };
    expect(refreshBody.playerId).toBe(sessionBody.playerId);
    expect(refreshBody.role).toBe(sessionBody.role);
    expect(refreshBody.expiresIn.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

    const postLogoutSessionResponse = await page.request.get(`${apiBaseUrl}/auth/session`);
    expect(postLogoutSessionResponse.status()).toBe(401);
  });

  test('refresh sin cookie de sesión devuelve 401', async ({ page }) => {
    await page.goto('/');
    const response = await page.request.post(`${apiBaseUrl}/auth/refresh`);
    expect(response.status()).toBe(401);
  });

  test('refresh token reutilizado revoca la familia activa', async ({ page }) => {
    await registerAndLogin(page);
    const initialCookies = await page.context().cookies(apiBaseUrl);
    const initialRefresh = initialCookies.find((cookie) => cookie.name === 'clubfutbolin_rt');
    const initialCsrf = initialCookies.find((cookie) => cookie.name === 'clubfutbolin_csrf');

    const firstRefresh = await page.request.post(`${apiBaseUrl}/auth/refresh`, {
      headers: {
        'x-csrf-token': initialCsrf?.value ?? '',
      },
    });
    expect(firstRefresh.status()).toBe(200);

    const rotatedCookies = await page.context().cookies(apiBaseUrl);
    const rotatedRefresh = rotatedCookies.find((cookie) => cookie.name === 'clubfutbolin_rt');
    const rotatedCsrf = rotatedCookies.find((cookie) => cookie.name === 'clubfutbolin_csrf');

    const reuseOld = await page.request.fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: `clubfutbolin_rt=${initialRefresh?.value ?? ''}; clubfutbolin_csrf=${initialCsrf?.value ?? ''}`,
        'x-csrf-token': initialCsrf?.value ?? '',
      },
    });
    expect(reuseOld.status()).toBe(401);

    const currentFamilyRevoked = await page.request.fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: `clubfutbolin_rt=${rotatedRefresh?.value ?? ''}; clubfutbolin_csrf=${rotatedCsrf?.value ?? ''}`,
        'x-csrf-token': rotatedCsrf?.value ?? '',
      },
    });
    expect(currentFamilyRevoked.status()).toBe(401);
  });
});
