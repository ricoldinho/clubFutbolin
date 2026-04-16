"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('TeamRoster', () => {
    const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
    const teamId = TeamId_value_object_1.TeamId.generate();
    const seasonId = SeasonId_value_object_1.SeasonId.generate();
    (0, vitest_1.it)('addPlayer añade jugadores hasta 4', () => {
        let roster = TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId });
        const p1 = PlayerId_value_object_1.PlayerId.generate();
        const p2 = PlayerId_value_object_1.PlayerId.generate();
        const p3 = PlayerId_value_object_1.PlayerId.generate();
        const p4 = PlayerId_value_object_1.PlayerId.generate();
        roster = roster.addPlayer(p1, 'PORTERO');
        roster = roster.addPlayer(p2, 'DELANTERO');
        roster = roster.addPlayer(p3, 'DELANTERO');
        roster = roster.addPlayer(p4, 'PORTERO');
        (0, vitest_1.expect)(roster.members).toHaveLength(4);
    });
    (0, vitest_1.it)('addPlayer lanza cuando se excede el máximo', () => {
        let roster = TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId });
        for (let i = 0; i < 4; i++) {
            roster = roster.addPlayer(PlayerId_value_object_1.PlayerId.generate(), 'DELANTERO');
        }
        (0, vitest_1.expect)(() => roster.addPlayer(PlayerId_value_object_1.PlayerId.generate(), 'PORTERO')).toThrow(errors_1.DomainValidationError);
    });
    (0, vitest_1.it)('addPlayer lanza cuando el jugador ya está', () => {
        let roster = TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId });
        const p = PlayerId_value_object_1.PlayerId.generate();
        roster = roster.addPlayer(p, 'PORTERO');
        (0, vitest_1.expect)(() => roster.addPlayer(p, 'DELANTERO')).toThrow(errors_1.DomainValidationError);
    });
    (0, vitest_1.it)('removePlayer elimina al jugador', () => {
        let roster = TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId });
        const p = PlayerId_value_object_1.PlayerId.generate();
        roster = roster.addPlayer(p, 'PORTERO');
        roster = roster.removePlayer(p);
        (0, vitest_1.expect)(roster.members).toHaveLength(0);
    });
});
