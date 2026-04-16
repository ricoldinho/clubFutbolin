"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/players/schemas");
(0, vitest_1.describe)('registerPlayerBodySchema', () => {
    (0, vitest_1.it)('acepta un payload válido con password', () => {
        const payload = {
            name: 'Manuel',
            lastname: 'Rico',
            nickname: null,
            email: 'test@example.com',
            phoneNumber: '600123123',
            birthdate: '1990-01-01',
            category: 'PRIMERA',
            password: 'password123',
        };
        const result = schemas_1.registerPlayerBodySchema.safeParse(payload);
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rechaza un email inválido', () => {
        const payload = {
            name: 'Manuel',
            lastname: 'Rico',
            nickname: null,
            email: 'no-es-email',
            phoneNumber: '600123123',
            birthdate: '1990-01-01',
            category: 'PRIMERA',
        };
        const result = schemas_1.registerPlayerBodySchema.safeParse(payload);
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('getPlayerByIdParamsSchema', () => {
    (0, vitest_1.it)('acepta un UUID válido', () => {
        const result = schemas_1.getPlayerByIdParamsSchema.safeParse({
            playerId: '123e4567-e89b-12d3-a456-426614174000',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rechaza un UUID inválido', () => {
        const result = schemas_1.getPlayerByIdParamsSchema.safeParse({ playerId: 'not-uuid' });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('updatePlayerBodySchema', () => {
    (0, vitest_1.it)('acepta un payload con algunos campos opcionales', () => {
        const payload = {
            name: 'Nuevo nombre',
            email: 'nuevo@example.com',
        };
        const result = schemas_1.updatePlayerBodySchema.safeParse(payload);
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rechaza un body vacío', () => {
        const result = schemas_1.updatePlayerBodySchema.safeParse({});
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('listPlayersQuerySchema', () => {
    (0, vitest_1.it)('acepta query vacía y aplica defaults', () => {
        const result = schemas_1.listPlayersQuerySchema.safeParse({});
        (0, vitest_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, vitest_1.expect)(result.data.page).toBe(schemas_1.DEFAULT_LIST_PLAYERS_PAGE);
            (0, vitest_1.expect)(result.data.limit).toBe(schemas_1.DEFAULT_LIST_PLAYERS_LIMIT);
        }
    });
    (0, vitest_1.it)('acepta page y limit válidos (coerce desde string)', () => {
        const result = schemas_1.listPlayersQuerySchema.safeParse({ page: '2', limit: '10' });
        (0, vitest_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, vitest_1.expect)(result.data.page).toBe(2);
            (0, vitest_1.expect)(result.data.limit).toBe(10);
        }
    });
    (0, vitest_1.it)('rechaza page <= 0', () => {
        (0, vitest_1.expect)(schemas_1.listPlayersQuerySchema.safeParse({ page: 0 }).success).toBe(false);
        (0, vitest_1.expect)(schemas_1.listPlayersQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    });
    (0, vitest_1.it)('rechaza limit > 100', () => {
        (0, vitest_1.expect)(schemas_1.listPlayersQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });
    (0, vitest_1.it)('acepta q opcional y recorta espacios en blanco', () => {
        const result = schemas_1.listPlayersQuerySchema.safeParse({ q: '  ana  ' });
        (0, vitest_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, vitest_1.expect)(result.data.q).toBe('ana');
        }
    });
    (0, vitest_1.it)('transforma q vacío a undefined', () => {
        const result = schemas_1.listPlayersQuerySchema.safeParse({ q: '   ' });
        (0, vitest_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, vitest_1.expect)(result.data.q).toBeUndefined();
        }
    });
    (0, vitest_1.it)('rechaza q con más de 100 caracteres', () => {
        (0, vitest_1.expect)(schemas_1.listPlayersQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
    });
});
(0, vitest_1.describe)('playerMembershipsResponseSchema', () => {
    (0, vitest_1.it)('acepta una respuesta válida de membresías', () => {
        const result = schemas_1.playerMembershipsResponseSchema.safeParse({
            data: [
                {
                    teamSeasonId: '123e4567-e89b-12d3-a456-426614174000',
                    team: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Futbolin A' },
                    season: { id: '123e4567-e89b-12d3-a456-426614174002', year: 2026 },
                    league: { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Liga 981' },
                },
            ],
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
});
