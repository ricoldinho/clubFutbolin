import { describe, it, expect } from 'vitest';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

describe('Season', () => {
  const leagueId = LeagueId.generate();

  it('setWinners asigna campeón y subcampeón distintos', () => {
    const championId = TeamId.generate();
    const secondId = TeamId.generate();
    const season = Season.create({
      id: SeasonId.generate(),
      year: 2025,
      leagueId,
    });
    const updated = season.setWinners(championId, secondId);
    expect(updated.championId?.value).toBe(championId.value);
    expect(updated.secondId?.value).toBe(secondId.value);
  });

  it('setWinners lanza cuando champion y second son iguales', () => {
    const teamId = TeamId.generate();
    const season = Season.create({
      id: SeasonId.generate(),
      year: 2025,
      leagueId,
    });
    expect(() => season.setWinners(teamId, teamId)).toThrow(DomainValidationError);
  });
});
