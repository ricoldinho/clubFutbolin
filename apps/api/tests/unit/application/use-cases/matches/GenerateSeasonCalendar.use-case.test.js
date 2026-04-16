"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GenerateSeasonCalendar_use_case_1 = require("@/application/use-cases/matches/GenerateSeasonCalendar.use-case");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const errors_1 = require("@/domain/matches/errors");
(0, vitest_1.describe)('GenerateSeasonCalendar', () => {
    (0, vitest_1.it)('falla cuando la temporada no existe', async () => {
        // Arrange
        const useCase = new GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar(new InMemoryMatchRepository_1.InMemoryMatchRepository(), new InMemoryRosterRepository_1.InMemoryRosterRepository(), new InMemorySeasonRepository_1.InMemorySeasonRepository());
        // Act
        const result = await useCase.execute({ seasonId: SeasonId_value_object_1.SeasonId.generate() });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
    (0, vitest_1.it)('falla cuando la temporada ya tiene calendario', async () => {
        // Arrange
        const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepository = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const matchRepository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: 2026,
            leagueId: LeagueId_value_object_1.LeagueId.generate(),
        });
        await seasonRepository.save(season);
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await matchRepository.save(Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: season.id,
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        }));
        const useCase = new GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar(matchRepository, rosterRepository, seasonRepository);
        // Act
        const result = await useCase.execute({ seasonId: season.id });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.SeasonCalendarAlreadyGeneratedError);
    });
    (0, vitest_1.it)('genera calendario round-robin ida simple para 4 equipos', async () => {
        // Arrange
        const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepository = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const matchRepository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: 2026,
            leagueId: LeagueId_value_object_1.LeagueId.generate(),
        });
        await seasonRepository.save(season);
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        const useCase = new GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar(matchRepository, rosterRepository, seasonRepository);
        const startDate = new Date('2026-04-01T10:00:00.000Z');
        // Act
        const result = await useCase.execute({
            seasonId: season.id,
            startDate,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        (0, vitest_1.expect)(result.value).toHaveLength(6);
        const rounds = new Set(result.value.map((match) => match.round));
        (0, vitest_1.expect)(rounds).toEqual(new Set([1, 2, 3]));
        const dates = new Set(result.value.map((match) => `${match.round}-${match.date.toISOString().slice(0, 10)}`));
        (0, vitest_1.expect)(dates).toContain('1-2026-04-01');
        (0, vitest_1.expect)(dates).toContain('2-2026-04-08');
        (0, vitest_1.expect)(dates).toContain('3-2026-04-15');
    });
    (0, vitest_1.it)('genera calendario ida y vuelta cuando se solicita doubleRoundRobin', async () => {
        // Arrange
        const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepository = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const matchRepository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: 2026,
            leagueId: LeagueId_value_object_1.LeagueId.generate(),
        });
        await seasonRepository.save(season);
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        await rosterRepository.saveTeamSeason(createRoster(season.id, TeamSeasonId_value_object_1.TeamSeasonId.generate()));
        const useCase = new GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar(matchRepository, rosterRepository, seasonRepository);
        // Act
        const result = await useCase.execute({
            seasonId: season.id,
            startDate: new Date('2026-04-01T10:00:00.000Z'),
            doubleRoundRobin: true,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        (0, vitest_1.expect)(result.value).toHaveLength(12);
        const rounds = new Set(result.value.map((match) => match.round));
        (0, vitest_1.expect)(rounds).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    });
});
function createRoster(seasonId, teamSeasonId) {
    return TeamRoster_entity_1.TeamRoster.create({
        teamSeasonId,
        seasonId,
        teamId: TeamId_value_object_1.TeamId.generate(),
    });
}
