import { describe, expect, it } from 'vitest';
import { UpdateMatchScore } from '@/application/use-cases/matches/UpdateMatchScore.use-case';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import {
  InvalidMatchScoreError,
  MatchScoreUpdateNotAllowedError,
} from '@/domain/matches/errors';

describe('UpdateMatchScore', () => {
  it('falla cuando el partido no existe', async () => {
    // Arrange
    const useCase = new UpdateMatchScore(new InMemoryMatchRepository());

    // Act
    const result = await useCase.execute({
      matchId: MatchId.generate(),
      homeScore: 1,
      awayScore: 0,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Match');
  });

  it('falla cuando el partido está cancelado', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const match = createMatch(MatchStatus.CANCELLED);
    await repository.save(match);
    const useCase = new UpdateMatchScore(repository);

    // Act
    const result = await useCase.execute({
      matchId: match.id!,
      homeScore: 1,
      awayScore: 0,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(MatchScoreUpdateNotAllowedError);
  });

  it('falla cuando el marcador es inválido', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const match = createMatch(MatchStatus.SCHEDULED);
    await repository.save(match);
    const useCase = new UpdateMatchScore(repository);

    // Act
    const result = await useCase.execute({
      matchId: match.id!,
      homeScore: -1,
      awayScore: 2,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidMatchScoreError);
  });

  it('actualiza marcador y persiste el cambio', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const match = createMatch(MatchStatus.SCHEDULED);
    await repository.save(match);
    const useCase = new UpdateMatchScore(repository);

    // Act
    const result = await useCase.execute({
      matchId: match.id!,
      homeScore: 3,
      awayScore: 1,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = await repository.findById(match.id!);
    expect(updated?.status).toBe(MatchStatus.FINISHED);
    expect(updated?.score.home).toBe(3);
    expect(updated?.score.away).toBe(1);
  });
});

function createMatch(status: MatchStatus): Match {
  return Match.create({
    id: MatchId.generate(),
    seasonId: SeasonId.generate(),
    homeTeamSeasonId: TeamSeasonId.generate(),
    awayTeamSeasonId: TeamSeasonId.generate(),
    date: new Date('2026-04-01T10:00:00.000Z'),
    round: 1,
    status,
  });
}
