"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('Season', () => {
    const leagueId = LeagueId_value_object_1.LeagueId.generate();
    (0, vitest_1.it)('setWinners asigna campeón y subcampeón distintos', () => {
        const championId = TeamId_value_object_1.TeamId.generate();
        const secondId = TeamId_value_object_1.TeamId.generate();
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: 2025,
            leagueId,
        });
        const updated = season.setWinners(championId, secondId);
        (0, vitest_1.expect)(updated.championId?.value).toBe(championId.value);
        (0, vitest_1.expect)(updated.secondId?.value).toBe(secondId.value);
    });
    (0, vitest_1.it)('setWinners lanza cuando champion y second son iguales', () => {
        const teamId = TeamId_value_object_1.TeamId.generate();
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: 2025,
            leagueId,
        });
        (0, vitest_1.expect)(() => season.setWinners(teamId, teamId)).toThrow(errors_1.DomainValidationError);
    });
});
