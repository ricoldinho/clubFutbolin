"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const errors_1 = require("@/domain/matches/errors");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
(0, vitest_1.describe)('Match', () => {
    (0, vitest_1.it)('lanza error si local y visitante son el mismo TeamSeason', () => {
        // Arrange
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        // Act + Assert
        (0, vitest_1.expect)(() => Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonId,
            awayTeamSeasonId: teamSeasonId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        })).toThrow(errors_1.MatchTeamsMustBeDifferentError);
    });
    (0, vitest_1.it)('updateScore marca el partido como FINISHED', () => {
        // Arrange
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
            status: MatchStatus_1.MatchStatus.SCHEDULED,
        });
        // Act
        const updated = match.updateScore(3, 1);
        // Assert
        (0, vitest_1.expect)(updated.status).toBe(MatchStatus_1.MatchStatus.FINISHED);
        (0, vitest_1.expect)(updated.score.home).toBe(3);
        (0, vitest_1.expect)(updated.score.away).toBe(1);
    });
    (0, vitest_1.it)('updateScore lanza error si el partido está CANCELLED', () => {
        // Arrange
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 2,
            status: MatchStatus_1.MatchStatus.CANCELLED,
        });
        // Act + Assert
        (0, vitest_1.expect)(() => match.updateScore(1, 0)).toThrow(errors_1.MatchScoreUpdateNotAllowedError);
    });
});
