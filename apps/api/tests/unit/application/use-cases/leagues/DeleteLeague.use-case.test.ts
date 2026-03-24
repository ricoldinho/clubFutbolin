import { describe, it, expect } from 'vitest';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { DeleteLeague } from '@/application/use-cases/leagues/DeleteLeague.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { NotFoundError, DomainValidationError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

describe('DeleteLeague', () => {
  it('elimina una liga y devuelve Result.ok', async () => {
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);
    const deleteLeague = new DeleteLeague(repository);
    const createResult = await createLeague.execute({
      name: 'Liga Provincial',
      leagueCategory: 'PRIMERA',
    });
    if (!isOk(createResult)) throw new Error('Expected create to succeed');
    const leagueId = createResult.value.id!;

    const result = await deleteLeague.execute(leagueId);

    expect(isOk(result)).toBe(true);
    const found = await repository.findById(leagueId);
    expect(found).toBeNull();
  });

  it('devuelve Result.fail(NotFoundError) cuando la liga no existe', async () => {
    const repository = new InMemoryLeagueRepository();
    const deleteLeague = new DeleteLeague(repository);
    const fakeId = LeagueId.generate();

    const result = await deleteLeague.execute(fakeId);

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('devuelve Result.fail(DomainValidationError) cuando la liga tiene temporadas', async () => {
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);
    const deleteLeague = new DeleteLeague(repository);
    const createResult = await createLeague.execute({
      name: 'Liga Con Temporadas',
      leagueCategory: 'ELITE',
    });
    if (!isOk(createResult)) throw new Error('Expected create to succeed');
    const leagueId = createResult.value.id!;
    repository.setSeasonCount(leagueId, 2);

    const result = await deleteLeague.execute(leagueId);

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(DomainValidationError);
    expect((result.error as Error).message).toContain('2');
  });
});
