"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeasonsQuerySchema = exports.listSeasonsResponseSchema = exports.seasonResponseSchema = exports.getSeasonByIdParamsSchema = exports.setSeasonWinnersBodySchema = exports.updateSeasonBodySchema = exports.createSeasonBodySchema = void 0;
const zod_1 = require("zod");
exports.createSeasonBodySchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2000).max(2100),
    leagueId: zod_1.z.string().uuid(),
});
exports.updateSeasonBodySchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2000).max(2100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });
exports.setSeasonWinnersBodySchema = zod_1.z.object({
    championId: zod_1.z.string().uuid(),
    secondId: zod_1.z.string().uuid(),
});
exports.getSeasonByIdParamsSchema = zod_1.z.object({
    seasonId: zod_1.z.string().uuid(),
});
exports.seasonResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().nullable(),
    year: zod_1.z.number().int(),
    leagueId: zod_1.z.string().uuid(),
    championId: zod_1.z.string().uuid().nullable(),
    secondId: zod_1.z.string().uuid().nullable(),
});
const paginationMetaResponseSchema = zod_1.z.object({
    total: zod_1.z.number().int().nonnegative(),
    page: zod_1.z.number().int().positive(),
    lastPage: zod_1.z.number().int().nonnegative(),
});
exports.listSeasonsResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.seasonResponseSchema),
    meta: paginationMetaResponseSchema,
});
exports.listSeasonsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
