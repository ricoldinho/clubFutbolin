"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/rosters/schemas");
const validUuid = '123e4567-e89b-12d3-a456-426614174000';
const otherUuid = '223e4567-e89b-12d3-a456-426614174001';
(0, vitest_1.describe)('rosters schemas', () => {
    (0, vitest_1.describe)('registerTeamToSeasonBodySchema', () => {
        (0, vitest_1.it)('acepta teamId y seasonId UUID', () => {
            const result = schemas_1.registerTeamToSeasonBodySchema.safeParse({
                teamId: validUuid,
                seasonId: otherUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza teamId inválido', () => {
            const result = schemas_1.registerTeamToSeasonBodySchema.safeParse({
                teamId: 'x',
                seasonId: otherUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('addPlayerToRosterBodySchema', () => {
        (0, vitest_1.it)('acepta posición PORTERO', () => {
            const result = schemas_1.addPlayerToRosterBodySchema.safeParse({
                playerId: validUuid,
                position: 'PORTERO',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza posición desconocida', () => {
            const result = schemas_1.addPlayerToRosterBodySchema.safeParse({
                playerId: validUuid,
                position: 'MEDIO',
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('removePlayerFromRosterParamsSchema', () => {
        (0, vitest_1.it)('acepta params UUID', () => {
            const result = schemas_1.removePlayerFromRosterParamsSchema.safeParse({
                teamSeasonId: validUuid,
                playerId: otherUuid,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rechaza playerId no UUID', () => {
            const result = schemas_1.removePlayerFromRosterParamsSchema.safeParse({
                teamSeasonId: validUuid,
                playerId: 'nope',
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('getRosterParamsSchema', () => {
        (0, vitest_1.it)('acepta teamSeasonId UUID', () => {
            const result = schemas_1.getRosterParamsSchema.safeParse({ teamSeasonId: validUuid });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
});
