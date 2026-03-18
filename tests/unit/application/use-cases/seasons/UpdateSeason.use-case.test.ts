import { describe, it, expect } from 'vitest';
import { UpdateSeason } from '@/application/use-cases/seasons/UpdateSeason.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { isOk } from '@/shared/result';

describe('UpdateSeason', () => {
  it('actualiza el año de una temporada', async () => {
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

    const updateSeason = new UpdateSeason(seasonRepo);
    const result = await updateSeason.execute({
      id: seasonId,
      year: 2026,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.year).toBe(2026);
  });

  it('mantiene el año anterior cuando no se pasa year', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga Y', leagueCategory: 'ELITE' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const createResult = await createSeason.execute({ year: 2024, leagueId });
    if (!isOk(createResult)) throw new Error('Expected season create');

    const updateSeason = new UpdateSeason(seasonRepo);
    const result = await updateSeason.execute({
      id: createResult.value.id!,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.year).toBe(2024);
  });

  it('falla con NotFound cuando la temporada no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const seasonId = SeasonId.generate();
    const updateSeason = new UpdateSeason(seasonRepo);
    const result = await updateSeason.execute({ id: seasonId, year: 2026 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Season');
  });
});
