"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GetMatchById_use_case_1 = require("@/application/use-cases/matches/GetMatchById.use-case");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
(0, vitest_1.describe)('GetMatchById', () => {
    (0, vitest_1.it)('falla con NotFound cuando no existe el partido', async () => {
        // Arrange
        const useCase = new GetMatchById_use_case_1.GetMatchById(new InMemoryMatchRepository_1.InMemoryMatchRepository());
        const matchId = MatchId_value_object_1.MatchId.generate();
        // Act
        const result = await useCase.execute(matchId);
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Match');
    });
    (0, vitest_1.it)('devuelve el partido cuando existe', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await repository.save(match);
        const useCase = new GetMatchById_use_case_1.GetMatchById(repository);
        // Act
        const result = await useCase.execute(match.id);
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        (0, vitest_1.expect)(result.value.id?.value).toBe(match.id?.value);
    });
});
