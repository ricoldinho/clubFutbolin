import { describe, expect, it } from 'vitest';
import { GetMatchById } from '@/application/use-cases/matches/GetMatchById.use-case';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

describe('GetMatchById', () => {
  it('falla con NotFound cuando no existe el partido', async () => {
    // Arrange
    const useCase = new GetMatchById(new InMemoryMatchRepository());
    const matchId = MatchId.generate();

    // Act
    const result = await useCase.execute(matchId);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Match');
  });

  it('devuelve el partido cuando existe', async () => {
    // Arrange
    const repository = new InMemoryMatchRepository();
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });
    await repository.save(match);
    const useCase = new GetMatchById(repository);

    // Act
    const result = await useCase.execute(match.id!);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id?.value).toBe(match.id?.value);
  });
});
