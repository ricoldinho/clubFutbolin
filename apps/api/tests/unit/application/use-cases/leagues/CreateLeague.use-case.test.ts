import { describe, it, expect } from 'vitest';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { AlreadyExistsError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

describe('CreateLeague', () => {
  it('crea una liga y devuelve Result.ok', async () => {
    // Arrange
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);

    // Act
    const result = await createLeague.execute({
      name: 'Liga Provincial',
      leagueCategory: 'PRIMERA',
    });

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.league.name).toBe('Liga Provincial');
    expect(result.value.league.leagueCategory).toBe('PRIMERA');
    expect(result.value.league.id).toBeInstanceOf(LeagueId);
    expect(result.value.initialSeason.leagueId.equals(result.value.league.id!)).toBe(true);
    expect(result.value.initialSeason.year).toBe(new Date().getFullYear());
  });

  it('devuelve Result.fail(AlreadyExistsError) cuando ya existe una liga con el mismo nombre', async () => {
    // Arrange
    const repository = new InMemoryLeagueRepository();
    const createLeague = new CreateLeague(repository);
    await repository.save(
      League.create({
        id: LeagueId.generate(),
        name: 'Liga Provincial',
        leagueCategory: 'PRIMERA',
      }),
    );

    // Act
    const result = await createLeague.execute({
      name: 'Liga Provincial',
      leagueCategory: 'SEGUNDA',
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyExistsError);
  });
});
