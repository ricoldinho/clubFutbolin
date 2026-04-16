"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
(0, vitest_1.describe)('League', () => {
    (0, vitest_1.it)('crea una liga con name y leagueCategory', () => {
        const league = League_entity_1.League.create({ name: 'Liga Test', leagueCategory: 'PRIMERA' });
        (0, vitest_1.expect)(league.name).toBe('Liga Test');
        (0, vitest_1.expect)(league.leagueCategory).toBe('PRIMERA');
        (0, vitest_1.expect)(league.id).toBeUndefined();
    });
    (0, vitest_1.it)('crea una liga con id cuando se pasa', () => {
        const id = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const league = League_entity_1.League.create({ id, name: 'Liga Con Id', leagueCategory: 'ELITE' });
        (0, vitest_1.expect)(league.id).toBeDefined();
        (0, vitest_1.expect)(league.id?.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
});
