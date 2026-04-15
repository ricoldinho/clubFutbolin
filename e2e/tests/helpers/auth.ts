import { expect, type Page } from '@playwright/test';

export interface E2eUser {
  email: string;
  password: string;
}

const uniqueUserEmail = (): string =>
  `e2e_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

const uniquePhone = (): string => `6${Math.floor(10000000 + Math.random() * 89999999)}`;

export const createE2eUser = (): E2eUser => ({
  email: uniqueUserEmail(),
  password: 'Password123!',
});

export async function registerUser(page: Page, user: E2eUser = createE2eUser()): Promise<E2eUser> {
  await page.goto('/register');
  await page.getByLabel('Nombre').fill('E2E');
  await page.getByLabel('Apellidos').fill('Tester');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Teléfono').fill(uniquePhone());
  await page.getByLabel('Fecha de nacimiento').fill('1994-05-10');
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/login$/);
  return user;
}

export async function loginUser(page: Page, user: E2eUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/players\/.+/);
}

export async function registerAndLogin(page: Page): Promise<E2eUser> {
  const user = await registerUser(page);
  await loginUser(page, user);
  return user;
}
