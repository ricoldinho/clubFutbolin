"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/leagues/schemas");
(0, vitest_1.describe)('leagues schemas', () => {
    (0, vitest_1.describe)('createLeagueBodySchema', () => {
        (0, vitest_1.it)('acepta payload válido', () => {
            const result = schemas_1.createLeagueBodySchema.safeParse({
                name: 'Liga Provincial',
                leagueCategory: 'PRIMERA',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza leagueCategory inválido', () => {
            const result = schemas_1.createLeagueBodySchema.safeParse({
                name: 'Liga',
                leagueCategory: 'INVALID',
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateLeagueBodySchema', () => {
        (0, vitest_1.it)('acepta al menos un campo', () => {
            const result = schemas_1.updateLeagueBodySchema.safeParse({ name: 'Nuevo nombre' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza body vacío', () => {
            const result = schemas_1.updateLeagueBodySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('getLeagueByIdParamsSchema', () => {
        (0, vitest_1.it)('acepta UUID válido', () => {
            const result = schemas_1.getLeagueByIdParamsSchema.safeParse({
                leagueId: '123e4567-e89b-12d3-a456-426614174000',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('listLeaguesQuerySchema', () => {
        (0, vitest_1.it)('aplica defaults de paginación', () => {
            const result = schemas_1.listLeaguesQuerySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.page).toBe(1);
                (0, vitest_1.expect)(result.data.limit).toBe(20);
            }
        });
    });
});
