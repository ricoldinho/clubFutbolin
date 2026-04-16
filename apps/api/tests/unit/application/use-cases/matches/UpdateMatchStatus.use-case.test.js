"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdateMatchStatus_use_case_1 = require("@/application/use-cases/matches/UpdateMatchStatus.use-case");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
(0, vitest_1.describe)('UpdateMatchStatus', () => {
    (0, vitest_1.it)('falla cuando el partido no existe', async () => {
        // Arrange
        const useCase = new UpdateMatchStatus_use_case_1.UpdateMatchStatus(new InMemoryMatchRepository_1.InMemoryMatchRepository());
        // Act
        const result = await useCase.execute({
            matchId: MatchId_value_object_1.MatchId.generate(),
            status: MatchStatus_1.MatchStatus.CANCELLED,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Match');
    });
    (0, vitest_1.it)('actualiza el estado y persiste el cambio', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
            status: MatchStatus_1.MatchStatus.SCHEDULED,
        });
        await repository.save(match);
        const useCase = new UpdateMatchStatus_use_case_1.UpdateMatchStatus(repository);
        // Act
        const result = await useCase.execute({
            matchId: match.id,
            status: MatchStatus_1.MatchStatus.POSTPONED,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        const updated = await repository.findById(match.id);
        (0, vitest_1.expect)(updated?.status).toBe(MatchStatus_1.MatchStatus.POSTPONED);
    });
});
