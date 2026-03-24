import { describe, it, expect } from 'vitest';
import { DeleteSeason } from '@/application/use-cases/seasons/DeleteSeason.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { isOk } from '@/shared/result';

describe('DeleteSeason', () => {
  it('elimina una temporada existente', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const createResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(createResult)) throw new Error('Expected season create');
    const seasonId = createResult.value.id!;

    const deleteSeason = new DeleteSeason(seasonRepo);
    const result = await deleteSeason.execute(seasonId);

    expect(isOk(result)).toBe(true);
    const found = await seasonRepo.findById(seasonId);
    expect(found).toBeNull();
  });

  it('falla con NotFound cuando la temporada no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const seasonId = SeasonId.generate();
    const deleteSeason = new DeleteSeason(seasonRepo);
    const result = await deleteSeason.execute(seasonId);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Season');
  });
});
