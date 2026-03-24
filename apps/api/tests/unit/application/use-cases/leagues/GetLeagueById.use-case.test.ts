import { describe, it, expect } from 'vitest';
import { GetLeagueById } from '@/application/use-cases/leagues/GetLeagueById.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';

describe('GetLeagueById', () => {
  it('devuelve Result.ok(League) cuando la liga existe', async () => {
    const id = LeagueId.generate();
    const repository = new InMemoryLeagueRepository();
    await repository.save(
      League.create({ id, name: 'Liga Test', leagueCategory: 'ELITE' }),
    );
    const getLeagueById = new GetLeagueById(repository);

    const result = await getLeagueById.execute(id);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id?.value).toBe(id.value);
    expect(result.value.name).toBe('Liga Test');
    expect(result.value.leagueCategory).toBe('ELITE');
  });

  it('devuelve Result.fail(NotFoundError) cuando la liga no existe', async () => {
    const repository = new InMemoryLeagueRepository();
    const getLeagueById = new GetLeagueById(repository);
    const id = LeagueId.generate();

    const result = await getLeagueById.execute(id);

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
    expect(result.error.message).toContain('League');
  });
});
