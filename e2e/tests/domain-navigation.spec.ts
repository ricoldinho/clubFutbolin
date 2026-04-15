import { expect, test } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Cobertura dominio navegación pública/autenticada', () => {
  test('players autenticado permite abrir perfil y memberships', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/players');
    await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();

    const playerLinks = page.locator('a[href^="/players/"]');
    await expect(playerLinks.first()).toBeVisible();
    await playerLinks.first().click();

    await expect(page.getByRole('heading', { name: 'Perfil del jugador' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Información personal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ligas y equipos' })).toBeVisible();
  });

  test('teams y leagues abren detalle cuando hay datos', async ({ page }) => {
    await page.goto('/teams');
    await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible();

    const teamLinks = page.locator('a[href^="/teams/"]');
    if ((await teamLinks.count()) > 0) {
      await teamLinks.first().click();
      await expect(page.getByRole('heading', { name: /Ligas en las que participa/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Plantilla actual/i })).toBeVisible();
    } else {
      await expect(page.getByText('No hay equipos registrados.')).toBeVisible();
    }

    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: 'Leagues' })).toBeVisible();
    const leagueLinks = page.locator('a[href^="/leagues/"]');

    if ((await leagueLinks.count()) > 0) {
      await leagueLinks.first().click();
      await expect(page.getByRole('heading', { name: 'Liga' })).toBeVisible();
      await page.getByRole('button', { name: 'Calendario' }).click();
      await expect(page.getByRole('button', { name: 'Clasificación' })).toBeVisible();
    } else {
      await expect(page.getByText('No hay ligas registradas.')).toBeVisible();
    }
  });
});
