import { describe, it, expect } from 'vitest';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { UpdateLeague } from '@/application/use-cases/leagues/UpdateLeague.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { NotFoundError } from '@/domain/shared/errors';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { isOk } from '@/shared/result';

describe('UpdateLeague', () => {
  it('actualiza una liga existente', async () => {
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);
    const updateLeague = new UpdateLeague(repository);
    const createResult = await createLeague.execute({
      name: 'Liga A',
      leagueCategory: 'PRIMERA',
    });
    if (!isOk(createResult)) throw new Error('Expected create to succeed');
    const leagueId = createResult.value.id!;

    const result = await updateLeague.execute({
      id: leagueId,
      name: 'Liga A Actualizada',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Liga A Actualizada');
    expect(result.value.leagueCategory).toBe('PRIMERA');
  });

  it('devuelve NotFoundError cuando la liga no existe', async () => {
    const repository = new InMemoryLeagueRepository();
    const updateLeague = new UpdateLeague(repository);
    const result = await updateLeague.execute({
      id: LeagueId.generate(),
      name: 'Nueva',
    });
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
