"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamsQuerySchema = exports.getTeamByNameParamsSchema = exports.getTeamByIdParamsSchema = exports.updateTeamBodySchema = exports.createTeamBodySchema = exports.teamProfileResponseSchema = exports.listTeamsResponseSchema = exports.teamResponseSchema = void 0;
const zod_1 = require("zod");
exports.teamResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().nullable(),
    name: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
});
const paginationMetaResponseSchema = zod_1.z.object({
    total: zod_1.z.number().int().nonnegative(),
    page: zod_1.z.number().int().positive(),
    lastPage: zod_1.z.number().int().nonnegative(),
});
exports.listTeamsResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.teamResponseSchema),
    meta: paginationMetaResponseSchema,
});
exports.teamProfileResponseSchema = zod_1.z.object({
    team: exports.teamResponseSchema,
    leagues: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        leagueCategory: zod_1.z.string(),
        seasonId: zod_1.z.string().uuid(),
        seasonYear: zod_1.z.number().int(),
    })),
    players: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        lastname: zod_1.z.string(),
        nickname: zod_1.z.string().nullable(),
        category: zod_1.z.string(),
        isCurrent: zod_1.z.boolean(),
    })),
});
exports.createTeamBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    /** Mínimo 2 jugadores distintos; máximo 4 (tamaño de plantilla). */
    playerIds: zod_1.z
        .array(zod_1.z.string().uuid())
        .min(2, 'Se requieren al menos 2 jugadores')
        .max(4, 'Como máximo 4 jugadores en la plantilla inicial'),
});
exports.updateTeamBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });
exports.getTeamByIdParamsSchema = zod_1.z.object({
    teamId: zod_1.z.string().uuid(),
});
exports.getTeamByNameParamsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
exports.listTeamsQuerySchema = zod_1.z.object({
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
