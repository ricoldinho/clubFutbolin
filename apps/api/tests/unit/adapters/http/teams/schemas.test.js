"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/teams/schemas");
(0, vitest_1.describe)('teams schemas', () => {
    (0, vitest_1.describe)('createTeamBodySchema', () => {
        const p1 = '123e4567-e89b-12d3-a456-426614174000';
        const p2 = '223e4567-e89b-12d3-a456-426614174001';
        (0, vitest_1.it)('acepta payload válido', () => {
            const result = schemas_1.createTeamBodySchema.safeParse({
                name: 'Equipo Alpha',
                playerIds: [p1, p2],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza name vacío', () => {
            const result = schemas_1.createTeamBodySchema.safeParse({ name: '', playerIds: [p1, p2] });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('rechaza menos de 2 playerIds', () => {
            const result = schemas_1.createTeamBodySchema.safeParse({ name: 'E', playerIds: [p1] });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('rechaza más de 4 playerIds', () => {
            const ids = [p1, p2, p1, p2, p1];
            const result = schemas_1.createTeamBodySchema.safeParse({ name: 'E', playerIds: ids });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateTeamBodySchema', () => {
        (0, vitest_1.it)('acepta name', () => {
            const result = schemas_1.updateTeamBodySchema.safeParse({ name: 'Nuevo nombre' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza body vacío', () => {
            const result = schemas_1.updateTeamBodySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('getTeamByIdParamsSchema', () => {
        (0, vitest_1.it)('acepta UUID válido', () => {
            const result = schemas_1.getTeamByIdParamsSchema.safeParse({
                teamId: '123e4567-e89b-12d3-a456-426614174000',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('getTeamByNameParamsSchema', () => {
        (0, vitest_1.it)('acepta name no vacío', () => {
            const result = schemas_1.getTeamByNameParamsSchema.safeParse({ name: 'Equipo X' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('listTeamsQuerySchema', () => {
        (0, vitest_1.it)('aplica defaults de paginación', () => {
            const result = schemas_1.listTeamsQuerySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.page).toBe(1);
                (0, vitest_1.expect)(result.data.limit).toBe(20);
            }
        });
        (0, vitest_1.it)('acepta q opcional y recorta espacios', () => {
            const result = schemas_1.listTeamsQuerySchema.safeParse({ q: '  fc  ' });
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.q).toBe('fc');
            }
        });
        (0, vitest_1.it)('transforma q vacío a undefined', () => {
            const result = schemas_1.listTeamsQuerySchema.safeParse({ q: '   ' });
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.q).toBeUndefined();
            }
        });
        (0, vitest_1.it)('rechaza q con más de 100 caracteres', () => {
            (0, vitest_1.expect)(schemas_1.listTeamsQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
        });
    });
    (0, vitest_1.describe)('teamProfileResponseSchema', () => {
        (0, vitest_1.it)('acepta perfil con isCurrent en jugadores', () => {
            const result = schemas_1.teamProfileResponseSchema.safeParse({
                team: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Equipo',
                    createdAt: new Date().toISOString(),
                },
                leagues: [],
                players: [
                    {
                        id: '223e4567-e89b-12d3-a456-426614174000',
                        name: 'Juan',
                        lastname: 'Pérez',
                        nickname: null,
                        category: 'PRIMERA',
                        isCurrent: true,
                    },
                ],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
});
