import { describe, expect, it } from 'vitest';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { MatchScoreUpdateNotAllowedError, MatchTeamsMustBeDifferentError } from '@/domain/matches/errors';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';

describe('Match', () => {
  it('lanza error si local y visitante son el mismo TeamSeason', () => {
    // Arrange
    const seasonId = SeasonId.generate();
    const teamSeasonId = TeamSeasonId.generate();

    // Act + Assert
    expect(() =>
      Match.create({
        id: MatchId.generate(),
        seasonId,
        homeTeamSeasonId: teamSeasonId,
        awayTeamSeasonId: teamSeasonId,
        date: new Date('2026-04-01T10:00:00.000Z'),
        round: 1,
      }),
    ).toThrow(MatchTeamsMustBeDifferentError);
  });

  it('updateScore marca el partido como FINISHED', () => {
    // Arrange
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
      status: MatchStatus.SCHEDULED,
    });

    // Act
    const updated = match.updateScore(3, 1);

    // Assert
    expect(updated.status).toBe(MatchStatus.FINISHED);
    expect(updated.score.home).toBe(3);
    expect(updated.score.away).toBe(1);
  });

  it('updateScore lanza error si el partido está CANCELLED', () => {
    // Arrange
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 2,
      status: MatchStatus.CANCELLED,
    });

    // Act + Assert
    expect(() => match.updateScore(1, 0)).toThrow(MatchScoreUpdateNotAllowedError);
  });
});
