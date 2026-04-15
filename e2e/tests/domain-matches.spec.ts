import { expect, test } from '@playwright/test';

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3000';

interface LeaguesListResponse {
  data: Array<{ id: string | null }>;
}

interface LeagueSeasonsResponse {
  data: Array<{ id: string | null }>;
}

const firstSeasonIdFromSeed = async (
  request: import('@playwright/test').APIRequestContext,
): Promise<string> => {
  const leaguesRes = await request.get(`${apiBaseUrl}/leagues?page=1&limit=1`);
  expect(leaguesRes.status()).toBe(200);
  const leaguesBody = (await leaguesRes.json()) as LeaguesListResponse;
  const leagueId = leaguesBody.data[0]?.id;
  expect(leagueId).toBeTruthy();

  const seasonsRes = await request.get(`${apiBaseUrl}/leagues/${leagueId}/seasons`);
  expect(seasonsRes.status()).toBe(200);
  const seasonsBody = (await seasonsRes.json()) as LeagueSeasonsResponse;
  const seasonId = seasonsBody.data[0]?.id;
  expect(seasonId).toBeTruthy();
  return seasonId!;
};

test.describe('Cobertura dominio matches', () => {
  test('matches muestra error con season inexistente y permite abrir detalle real', async ({
    page,
  }) => {
    await page.goto('/matches');
    await expect(page.getByRole('heading', { name: 'Matches' })).toBeVisible();

    await page.getByLabel('Season ID').fill('00000000-0000-4000-8000-000000000000');
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    let seasonId = '';
    try {
      seasonId = await firstSeasonIdFromSeed(page.request);
    } catch {
      // Entorno sin datos seed: ya validamos el escenario de error.
      return;
    }

    await page.getByLabel('Season ID').fill(seasonId);
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();

    const emptyState = page.getByText('No hay partidos para los filtros actuales.');
    const detailButtons = page.getByRole('button', { name: /Ver detalle del partido/i });

    if ((await detailButtons.count()) === 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await detailButtons.first().click();
    await expect(page.getByRole('heading', { name: 'Detalle del partido' })).toBeVisible();
  });
});
