import { describe, expect, it } from 'vitest';
import { UpdateSeasonRoundDate } from '@/application/use-cases/matches/UpdateSeasonRoundDate.use-case';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

describe('UpdateSeasonRoundDate', () => {
  it('actualiza la fecha de todos los partidos de una jornada', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const seasonId = SeasonId.generate();
    await repository.save(
      Match.create({
        id: MatchId.generate(),
        seasonId,
        homeTeamSeasonId: TeamSeasonId.generate(),
        awayTeamSeasonId: TeamSeasonId.generate(),
        date: new Date('2026-01-06T20:00:00.000Z'),
        round: 1,
      }),
    );
    await repository.save(
      Match.create({
        id: MatchId.generate(),
        seasonId,
        homeTeamSeasonId: TeamSeasonId.generate(),
        awayTeamSeasonId: TeamSeasonId.generate(),
        date: new Date('2026-01-06T20:00:00.000Z'),
        round: 1,
      }),
    );
    const useCase = new UpdateSeasonRoundDate(repository);

    // Act
    const result = await useCase.execute({
      seasonId,
      round: 1,
      date: new Date('2026-01-13T20:00:00.000Z'),
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updatedMatches).toBe(2);
  });

  it('devuelve NotFoundError si la jornada no tiene partidos', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const useCase = new UpdateSeasonRoundDate(repository);

    // Act
    const result = await useCase.execute({
      seasonId: SeasonId.generate(),
      round: 9,
      date: new Date('2026-02-10T20:00:00.000Z'),
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.name).toBe('NotFoundError');
  });
});
