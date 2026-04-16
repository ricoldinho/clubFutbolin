"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlayersResponseSchema = exports.playerResponseSchema = exports.DEFAULT_LIST_PLAYERS_LIMIT = exports.DEFAULT_LIST_PLAYERS_PAGE = exports.listPlayersQuerySchema = exports.playerMembershipsResponseSchema = exports.playerMembershipSchema = exports.getPlayerByIdParamsSchema = exports.updatePlayerBodySchema = exports.loginResponseSchema = exports.loginBodySchema = exports.registerPlayerBodySchema = void 0;
const zod_1 = require("zod");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
/**
 * Schema Zod para el body de POST /players.
 * Fuente de verdad del shape que acepta la API para registrar un Player.
 * Incluye password; el nuevo Player tiene siempre role USER.
 */
exports.registerPlayerBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    lastname: zod_1.z.string().min(1),
    nickname: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.string().min(9).max(20),
    birthdate: zod_1.z.string(), // Más adelante se puede refinar a ISO (yyyy-mm-dd)
    category: zod_1.z.enum(['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE']),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
/**
 * Schema Zod para el body de POST /auth/login.
 */
exports.loginBodySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.loginResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    expiresIn: zod_1.z.string(),
});
/**
 * Schema Zod para el body de PATCH /players/:playerId.
 * Todos los campos son opcionales, pero debe venir al menos uno.
 */
exports.updatePlayerBodySchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).optional(),
    lastname: zod_1.z.string().min(1).optional(),
    nickname: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().min(9).max(20).optional(),
    birthdate: zod_1.z.string().optional(),
    category: zod_1.z.enum(['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE']).optional(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional(),
})
    .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviarse al menos un campo para actualizar' });
/**
 * Schema Zod para los params de GET /players/:playerId.
 */
exports.getPlayerByIdParamsSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
});
exports.playerMembershipSchema = zod_1.z.object({
    teamSeasonId: zod_1.z.string().uuid(),
    team: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(1),
    }),
    season: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        year: zod_1.z.number().int(),
    }),
    league: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(1),
    }),
});
exports.playerMembershipsResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.playerMembershipSchema),
});
/**
 * Schema Zod para los query params de GET /players (paginación y búsqueda opcional).
 */
exports.listPlayersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    q: zod_1.z
        .string()
        .max(100, 'q no puede superar 100 caracteres')
        .optional()
        .transform((val) => {
        if (val === undefined)
            return undefined;
        const t = val.trim();
        return t.length === 0 ? undefined : t;
    }),
});
/** Valores por defecto de la paginación para GET /players. */
exports.DEFAULT_LIST_PLAYERS_PAGE = 1;
exports.DEFAULT_LIST_PLAYERS_LIMIT = 20;
const birthdateResponseSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthdate debe tener formato YYYY-MM-DD');
exports.playerResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().nullable(),
    name: zod_1.z.string(),
    lastname: zod_1.z.string(),
    nickname: zod_1.z.string().nullable(),
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.string().min(9).max(20),
    birthdate: birthdateResponseSchema,
    category: zod_1.z.nativeEnum(PlayerCategory_1.PlayerCategory),
    role: zod_1.z.nativeEnum(PlayerRole_1.PlayerRole),
});
const paginationMetaResponseSchema = zod_1.z.object({
    total: zod_1.z.number().int().nonnegative(),
    page: zod_1.z.number().int().positive(),
    lastPage: zod_1.z.number().int().nonnegative(),
});
exports.listPlayersResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.playerResponseSchema),
    meta: paginationMetaResponseSchema,
});
