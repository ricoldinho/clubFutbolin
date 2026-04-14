import { describe, expect, it } from 'vitest';
import { GenerateSeasonCalendar } from '@/application/use-cases/matches/GenerateSeasonCalendar.use-case';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonCalendarAlreadyGeneratedError } from '@/domain/matches/errors';

describe('GenerateSeasonCalendar', () => {
  it('falla cuando la temporada no existe', async () => {
    // Arrange
    const useCase = new GenerateSeasonCalendar(
      new InMemoryMatchRepository(),
      new InMemoryRosterRepository(),
      new InMemorySeasonRepository(),
    );

    // Act
    const result = await useCase.execute({ seasonId: SeasonId.generate() });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Season');
  });

  it('falla cuando la temporada ya tiene calendario', async () => {
    // Arrange
    const seasonRepository = new InMemorySeasonRepository();
    const rosterRepository = new InMemoryRosterRepository();
    const matchRepository = new InMemoryMatchRepository();
    const season = Season.create({
      id: SeasonId.generate(),
      year: 2026,
      leagueId: LeagueId.generate(),
    });
    await seasonRepository.save(season);
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await matchRepository.save(
      Match.create({
        id: MatchId.generate(),
        seasonId: season.id!,
        homeTeamSeasonId: TeamSeasonId.generate(),
        awayTeamSeasonId: TeamSeasonId.generate(),
        date: new Date('2026-04-01T10:00:00.000Z'),
        round: 1,
      }),
    );
    const useCase = new GenerateSeasonCalendar(
      matchRepository,
      rosterRepository,
      seasonRepository,
    );

    // Act
    const result = await useCase.execute({ seasonId: season.id! });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(SeasonCalendarAlreadyGeneratedError);
  });

  it('genera calendario round-robin ida simple para 4 equipos', async () => {
    // Arrange
    const seasonRepository = new InMemorySeasonRepository();
    const rosterRepository = new InMemoryRosterRepository();
    const matchRepository = new InMemoryMatchRepository();
    const season = Season.create({
      id: SeasonId.generate(),
      year: 2026,
      leagueId: LeagueId.generate(),
    });
    await seasonRepository.save(season);
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    const useCase = new GenerateSeasonCalendar(
      matchRepository,
      rosterRepository,
      seasonRepository,
    );
    const startDate = new Date('2026-04-01T10:00:00.000Z');

    // Act
    const result = await useCase.execute({
      seasonId: season.id!,
      startDate,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(6);
    const rounds = new Set(result.value.map((match) => match.round));
    expect(rounds).toEqual(new Set([1, 2, 3]));
    const dates = new Set(
      result.value.map(
        (match) =>
          `${match.round}-${match.date.toISOString().slice(0, 10)}`,
      ),
    );
    expect(dates).toContain('1-2026-04-01');
    expect(dates).toContain('2-2026-04-08');
    expect(dates).toContain('3-2026-04-15');
  });

  it('genera calendario ida y vuelta cuando se solicita doubleRoundRobin', async () => {
    // Arrange
    const seasonRepository = new InMemorySeasonRepository();
    const rosterRepository = new InMemoryRosterRepository();
    const matchRepository = new InMemoryMatchRepository();
    const season = Season.create({
      id: SeasonId.generate(),
      year: 2026,
      leagueId: LeagueId.generate(),
    });
    await seasonRepository.save(season);
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    await rosterRepository.saveTeamSeason(createRoster(season.id!, TeamSeasonId.generate()));
    const useCase = new GenerateSeasonCalendar(
      matchRepository,
      rosterRepository,
      seasonRepository,
    );

    // Act
    const result = await useCase.execute({
      seasonId: season.id!,
      startDate: new Date('2026-04-01T10:00:00.000Z'),
      doubleRoundRobin: true,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(12);
    const rounds = new Set(result.value.map((match) => match.round));
    expect(rounds).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });
});

function createRoster(seasonId: SeasonId, teamSeasonId: TeamSeasonId): TeamRoster {
  return TeamRoster.create({
    teamSeasonId,
    seasonId,
    teamId: TeamId.generate(),
  });
}
