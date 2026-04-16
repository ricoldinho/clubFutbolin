"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdateSeasonRoundDate_use_case_1 = require("@/application/use-cases/matches/UpdateSeasonRoundDate.use-case");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
(0, vitest_1.describe)('UpdateSeasonRoundDate', () => {
    (0, vitest_1.it)('actualiza la fecha de todos los partidos de una jornada', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await repository.save(Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-01-06T20:00:00.000Z'),
            round: 1,
        }));
        await repository.save(Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-01-06T20:00:00.000Z'),
            round: 1,
        }));
        const useCase = new UpdateSeasonRoundDate_use_case_1.UpdateSeasonRoundDate(repository);
        // Act
        const result = await useCase.execute({
            seasonId,
            round: 1,
            date: new Date('2026-01-13T20:00:00.000Z'),
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        (0, vitest_1.expect)(result.value.updatedMatches).toBe(2);
    });
    (0, vitest_1.it)('devuelve NotFoundError si la jornada no tiene partidos', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const useCase = new UpdateSeasonRoundDate_use_case_1.UpdateSeasonRoundDate(repository);
        // Act
        const result = await useCase.execute({
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            round: 9,
            date: new Date('2026-02-10T20:00:00.000Z'),
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.name).toBe('NotFoundError');
    });
});
