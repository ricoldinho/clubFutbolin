import { describe, it, expect } from 'vitest';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';

describe('CreateSeason', () => {
  it('crea una temporada y devuelve Result.ok', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(League.create({ id: leagueId, name: 'Liga A', leagueCategory: 'PRIMERA' }));
    const seasonRepo = new InMemorySeasonRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);

    const result = await createSeason.execute({ year: 2025, leagueId });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.year).toBe(2025);
    expect(result.value.leagueId.value).toBe(leagueId.value);
  });

  it('devuelve NotFoundError cuando la liga no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const leagueRepo = new InMemoryLeagueRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);

    const result = await createSeason.execute({
      year: 2025,
      leagueId: LeagueId.generate(),
    });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
