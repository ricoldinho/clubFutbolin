"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdateMatchScore_use_case_1 = require("@/application/use-cases/matches/UpdateMatchScore.use-case");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
const errors_1 = require("@/domain/matches/errors");
(0, vitest_1.describe)('UpdateMatchScore', () => {
    (0, vitest_1.it)('falla cuando el partido no existe', async () => {
        // Arrange
        const useCase = new UpdateMatchScore_use_case_1.UpdateMatchScore(new InMemoryMatchRepository_1.InMemoryMatchRepository());
        // Act
        const result = await useCase.execute({
            matchId: MatchId_value_object_1.MatchId.generate(),
            homeScore: 1,
            awayScore: 0,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Match');
    });
    (0, vitest_1.it)('falla cuando el partido está cancelado', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = createMatch(MatchStatus_1.MatchStatus.CANCELLED);
        await repository.save(match);
        const useCase = new UpdateMatchScore_use_case_1.UpdateMatchScore(repository);
        // Act
        const result = await useCase.execute({
            matchId: match.id,
            homeScore: 1,
            awayScore: 0,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.MatchScoreUpdateNotAllowedError);
    });
    (0, vitest_1.it)('falla cuando el marcador es inválido', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = createMatch(MatchStatus_1.MatchStatus.SCHEDULED);
        await repository.save(match);
        const useCase = new UpdateMatchScore_use_case_1.UpdateMatchScore(repository);
        // Act
        const result = await useCase.execute({
            matchId: match.id,
            homeScore: -1,
            awayScore: 2,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.InvalidMatchScoreError);
    });
    (0, vitest_1.it)('actualiza marcador y persiste el cambio', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = createMatch(MatchStatus_1.MatchStatus.SCHEDULED);
        await repository.save(match);
        const useCase = new UpdateMatchScore_use_case_1.UpdateMatchScore(repository);
        // Act
        const result = await useCase.execute({
            matchId: match.id,
            homeScore: 3,
            awayScore: 1,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        const updated = await repository.findById(match.id);
        (0, vitest_1.expect)(updated?.status).toBe(MatchStatus_1.MatchStatus.FINISHED);
        (0, vitest_1.expect)(updated?.score.home).toBe(3);
        (0, vitest_1.expect)(updated?.score.away).toBe(1);
    });
    (0, vitest_1.it)('permite actualizar marcador de un partido ya finalizado', async () => {
        // Arrange
        const repository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
        const match = createMatch(MatchStatus_1.MatchStatus.FINISHED);
        await repository.save(match);
        const useCase = new UpdateMatchScore_use_case_1.UpdateMatchScore(repository);
        // Act
        const result = await useCase.execute({
            matchId: match.id,
            homeScore: 4,
            awayScore: 2,
        });
        // Assert
        (0, vitest_1.expect)(result.ok).toBe(true);
        if (!result.ok)
            return;
        const updated = await repository.findById(match.id);
        (0, vitest_1.expect)(updated?.status).toBe(MatchStatus_1.MatchStatus.FINISHED);
        (0, vitest_1.expect)(updated?.score.home).toBe(4);
        (0, vitest_1.expect)(updated?.score.away).toBe(2);
    });
});
function createMatch(status) {
    return Match_entity_1.Match.create({
        id: MatchId_value_object_1.MatchId.generate(),
        seasonId: SeasonId_value_object_1.SeasonId.generate(),
        homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
        awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
        date: new Date('2026-04-01T10:00:00.000Z'),
        round: 1,
        status,
    });
}
