import { expect, test } from '@playwright/test';
import { registerAndLogin, registerUser } from './helpers/auth';

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

  test('players pide autenticación si no hay sesión', async ({ page }) => {
    await page.goto('/players');
    await expect(page.getByText(/Necesitas/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('registro + login redirige al perfil y muestra sesión activa', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page).toHaveURL(/\/players\/.+/);
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('logout cierra la sesión y vuelve a bloquear players', async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await page.goto('/players');
    await expect(page.getByText(/Necesitas/i)).toBeVisible();
  });

  test('la sesión por cookie se mantiene tras recargar', async ({ page }) => {
    await registerAndLogin(page);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('registro detecta contraseñas no coincidentes', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.getByLabel('Nombre').fill('Mismatch');
    await page.getByLabel('Apellidos').fill('Case');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Teléfono').fill('600111222');
    await page.getByLabel('Fecha de nacimiento').fill('1994-05-10');
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('Password123!_other');

    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
  });

  test('teams y leagues cargan las vistas principales', async ({ page }) => {
    const user = await registerUser(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/players\/.+/);

    await page.goto('/teams');
    await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible();

    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: 'Leagues' })).toBeVisible();
  });
});
