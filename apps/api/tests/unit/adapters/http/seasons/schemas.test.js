"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/seasons/schemas");
const validUuid = '123e4567-e89b-12d3-a456-426614174000';
(0, vitest_1.describe)('seasons schemas', () => {
    (0, vitest_1.describe)('createSeasonBodySchema', () => {
        (0, vitest_1.it)('acepta payload válido', () => {
            const result = schemas_1.createSeasonBodySchema.safeParse({
                year: 2025,
                leagueId: validUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza año fuera de rango', () => {
            const result = schemas_1.createSeasonBodySchema.safeParse({
                year: 1999,
                leagueId: validUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('rechaza leagueId no UUID', () => {
            const result = schemas_1.createSeasonBodySchema.safeParse({
                year: 2025,
                leagueId: 'no-uuid',
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateSeasonBodySchema', () => {
        (0, vitest_1.it)('acepta al menos year', () => {
            const result = schemas_1.updateSeasonBodySchema.safeParse({ year: 2026 });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza body vacío', () => {
            const result = schemas_1.updateSeasonBodySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('setSeasonWinnersBodySchema', () => {
        (0, vitest_1.it)('acepta championId y secondId UUID', () => {
            const result = schemas_1.setSeasonWinnersBodySchema.safeParse({
                championId: validUuid,
                secondId: '223e4567-e89b-12d3-a456-426614174001',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza UUID inválido', () => {
            const result = schemas_1.setSeasonWinnersBodySchema.safeParse({
                championId: 'x',
                secondId: validUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('getSeasonByIdParamsSchema', () => {
        (0, vitest_1.it)('acepta seasonId UUID', () => {
            const result = schemas_1.getSeasonByIdParamsSchema.safeParse({ seasonId: validUuid });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza seasonId no UUID', () => {
            const result = schemas_1.getSeasonByIdParamsSchema.safeParse({ seasonId: 'bad' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('listSeasonsQuerySchema', () => {
        (0, vitest_1.it)('aplica defaults de paginación', () => {
            const result = schemas_1.listSeasonsQuerySchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.page).toBe(1);
                (0, vitest_1.expect)(result.data.limit).toBe(20);
            }
        });
    });
});
