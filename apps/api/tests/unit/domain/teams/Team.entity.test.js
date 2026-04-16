"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
(0, vitest_1.describe)('Team', () => {
    (0, vitest_1.it)('crea un equipo con name y createdAt por defecto', () => {
        const team = Team_entity_1.Team.create({ name: 'Equipo Test' });
        (0, vitest_1.expect)(team.name).toBe('Equipo Test');
        (0, vitest_1.expect)(team.createdAt).toBeInstanceOf(Date);
        (0, vitest_1.expect)(team.id).toBeUndefined();
    });
    (0, vitest_1.it)('crea un equipo con id cuando se pasa', () => {
        const id = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const team = Team_entity_1.Team.create({ id, name: 'Equipo Con Id' });
        (0, vitest_1.expect)(team.id).toBeDefined();
        (0, vitest_1.expect)(team.id?.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
});
