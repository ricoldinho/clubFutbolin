"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLeaguesQuerySchema = exports.seasonTeamsByCategoryResponseSchema = exports.leagueSeasonsResponseSchema = exports.listLeaguesResponseSchema = exports.createdLeagueResponseSchema = exports.leagueResponseSchema = exports.getLeagueByIdParamsSchema = exports.updateLeagueBodySchema = exports.createLeagueBodySchema = void 0;
const zod_1 = require("zod");
const LeagueCategory_1 = require("@/domain/leagues/LeagueCategory");
const leagueCategorySchema = zod_1.z.enum(LeagueCategory_1.LEAGUE_CATEGORIES);
exports.createLeagueBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    leagueCategory: leagueCategorySchema,
});
exports.updateLeagueBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    leagueCategory: leagueCategorySchema.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });
exports.getLeagueByIdParamsSchema = zod_1.z.object({
    leagueId: zod_1.z.string().uuid(),
});
exports.leagueResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().nullable(),
    name: zod_1.z.string(),
    leagueCategory: zod_1.z.enum(LeagueCategory_1.LEAGUE_CATEGORIES),
});
exports.createdLeagueResponseSchema = zod_1.z.object({
    ...exports.leagueResponseSchema.shape,
    initialSeason: zod_1.z.object({
        id: zod_1.z.string().uuid().nullable(),
        year: zod_1.z.number().int(),
        leagueId: zod_1.z.string().uuid(),
        championId: zod_1.z.string().uuid().nullable(),
        secondId: zod_1.z.string().uuid().nullable(),
    }),
});
const paginationMetaResponseSchema = zod_1.z.object({
    total: zod_1.z.number().int().nonnegative(),
    page: zod_1.z.number().int().positive(),
    lastPage: zod_1.z.number().int().nonnegative(),
});
exports.listLeaguesResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.leagueResponseSchema),
    meta: paginationMetaResponseSchema,
});
exports.leagueSeasonsResponseSchema = zod_1.z.object({
    data: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        year: zod_1.z.number().int(),
        leagueId: zod_1.z.string().uuid(),
        championId: zod_1.z.string().uuid().nullable(),
        secondId: zod_1.z.string().uuid().nullable(),
    })),
});
exports.seasonTeamsByCategoryResponseSchema = zod_1.z.object({
    seasonId: zod_1.z.string().uuid(),
    categories: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string(),
        teams: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid(),
            name: zod_1.z.string(),
        })),
    })),
});
exports.listLeaguesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
