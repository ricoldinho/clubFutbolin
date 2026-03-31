import { describe, expect, it } from 'vitest';
import { UpdateMatchStatus } from '@/application/use-cases/matches/UpdateMatchStatus.use-case';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

describe('UpdateMatchStatus', () => {
  it('falla cuando el partido no existe', async () => {
    // Arrange
    const useCase = new UpdateMatchStatus(new InMemoryMatchRepository());

    // Act
    const result = await useCase.execute({
      matchId: MatchId.generate(),
      status: MatchStatus.CANCELLED,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Match');
  });

  it('actualiza el estado y persiste el cambio', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
      status: MatchStatus.SCHEDULED,
    });
    await repository.save(match);
    const useCase = new UpdateMatchStatus(repository);

    // Act
    const result = await useCase.execute({
      matchId: match.id!,
      status: MatchStatus.POSTPONED,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = await repository.findById(match.id!);
    expect(updated?.status).toBe(MatchStatus.POSTPONED);
  });
});
