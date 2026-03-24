import { describe, it, expect } from 'vitest';
import { GetSeasonById } from '@/application/use-cases/seasons/GetSeasonById.use-case';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';

describe('GetSeasonById', () => {
  it('devuelve Result.ok(Season) cuando la temporada existe', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga Y', leagueCategory: 'SEGUNDA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const created = await createSeason.execute({ year: 2026, leagueId });
    if (!isOk(created)) throw new Error('Expected season create');
    const seasonId = created.value.id as SeasonId;
    const getSeasonById = new GetSeasonById(seasonRepo);

    const result = await getSeasonById.execute(seasonId);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id?.value).toBe(seasonId.value);
    expect(result.value.year).toBe(2026);
    expect(result.value.leagueId.value).toBe(leagueId.value);
  });

  it('devuelve Result.fail(NotFoundError) cuando la temporada no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const getSeasonById = new GetSeasonById(seasonRepo);
    const id = SeasonId.generate();

    const result = await getSeasonById.execute(id);

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
    expect(result.error.message).toContain('Season');
  });
});
