import { describe, it, expect } from 'vitest';
import { ListLeagues } from '@/application/use-cases/leagues/ListLeagues.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { isOk } from '@/shared/result';

describe('ListLeagues', () => {
  it('devuelve Result.ok([]) cuando no hay ligas', async () => {
    const repository = new InMemoryLeagueRepository();
    const listLeagues = new ListLeagues(repository);

    const result = await listLeagues.execute({ pagination: { page: 1, limit: 20 } });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data).toEqual([]);
    expect(result.value.total).toBe(0);
  });

  it('devuelve Result.ok con todas las ligas guardadas', async () => {
    const repository = new InMemoryLeagueRepository();
    await repository.save(
      League.create({ id: LeagueId.generate(), name: 'Liga A', leagueCategory: 'PRIMERA' }),
    );
    await repository.save(
      League.create({ id: LeagueId.generate(), name: 'Liga B', leagueCategory: 'SEGUNDA' }),
    );
    const listLeagues = new ListLeagues(repository);

    const result = await listLeagues.execute({ pagination: { page: 1, limit: 20 } });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data).toHaveLength(2);
    expect(result.value.total).toBe(2);
    const names = result.value.data.map((l) => l.name).sort();
    expect(names).toEqual(['Liga A', 'Liga B']);
  });
});
