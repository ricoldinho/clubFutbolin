import { describe, it, expect } from 'vitest';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { AlreadyExistsError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

describe('CreateLeague', () => {
  it('crea una liga y devuelve Result.ok', async () => {
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);

    const result = await createLeague.execute({
      name: 'Liga Provincial',
      leagueCategory: 'PRIMERA',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Liga Provincial');
    expect(result.value.leagueCategory).toBe('PRIMERA');
    expect(result.value.id).toBeInstanceOf(LeagueId);
  });

  it('devuelve Result.fail(AlreadyExistsError) cuando ya existe una liga con el mismo nombre', async () => {
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);
    await repository.save(
      League.create({
        id: LeagueId.generate(),
        name: 'Liga Provincial',
        leagueCategory: 'PRIMERA',
      }),
    );

    const result = await createLeague.execute({
      name: 'Liga Provincial',
      leagueCategory: 'SEGUNDA',
    });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyExistsError);
  });
});
