import { describe, it, expect } from 'vitest';
import { ListSeasons } from '@/application/use-cases/seasons/ListSeasons.use-case';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { isOk } from '@/shared/result';

describe('ListSeasons', () => {
  it('devuelve Result.ok([]) cuando no hay temporadas', async () => {
    const repository = new InMemorySeasonRepository();
    const listSeasons = new ListSeasons(repository);

    const result = await listSeasons.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toEqual([]);
  });

  it('devuelve Result.ok con todas las temporadas guardadas', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const s1 = await createSeason.execute({ year: 2024, leagueId });
    const s2 = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(s1) || !isOk(s2)) throw new Error('Expected season create');
    const listSeasons = new ListSeasons(seasonRepo);

    const result = await listSeasons.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(2);
    const years = result.value.map((s) => s.year).sort();
    expect(years).toEqual([2024, 2025]);
  });
});
