import { expect, test } from '@playwright/test';

const uniqueEmail = () => `e2e_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

test.describe('Flujos críticos web', () => {
  test('navegación principal muestra rutas clave', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Players' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Teams' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leagues' })).toBeVisible();
  });

  test('login incorrecto muestra mensaje de error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('unknown@example.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('p.text-red-400')).toContainText(/credenciales|inválid|error/i);
  });

  test('registro + login redirige al perfil de player', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'Password123!';

    await page.goto('/register');
    await page.getByLabel('Nombre').fill('E2E');
    await page.getByLabel('Apellidos').fill('Tester');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Teléfono').fill('600000999');
    await page.getByLabel('Fecha de nacimiento').fill('1994-05-10');
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByLabel('Repite la contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/players\/.+/);
  });
});
