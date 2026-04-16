"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeasonMatchesResponseSchema = exports.updateMatchStatusBodySchema = exports.updateSeasonRoundDateResponseSchema = exports.updateSeasonRoundDateBodySchema = exports.updateSeasonRoundDateParamsSchema = exports.updateMatchScoreResponseSchema = exports.generateSeasonCalendarResponseSchema = exports.matchResponseSchema = exports.listSeasonMatchesQuerySchema = exports.updateMatchScoreBodySchema = exports.updateMatchScoreParamsSchema = exports.generateSeasonCalendarBodySchema = exports.generateSeasonCalendarParamsSchema = void 0;
const zod_1 = require("zod");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
/**
 * Schemas Zod del recurso HTTP Matches.
 * Fuente de verdad para validación de params/body/query/response y OpenAPI.
 */
exports.generateSeasonCalendarParamsSchema = zod_1.z.object({
    seasonId: zod_1.z.string().uuid(),
});
exports.generateSeasonCalendarBodySchema = zod_1.z
    .object({
    startDate: zod_1.z.iso.datetime().optional(),
    doubleRoundRobin: zod_1.z.boolean().optional(),
})
    .optional();
exports.updateMatchScoreParamsSchema = zod_1.z.object({
    matchId: zod_1.z.string().uuid(),
});
exports.updateMatchScoreBodySchema = zod_1.z.object({
    homeScore: zod_1.z.number().int().min(0),
    awayScore: zod_1.z.number().int().min(0),
});
exports.listSeasonMatchesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    round: zod_1.z.coerce.number().int().positive().optional(),
});
exports.matchResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    seasonId: zod_1.z.string().uuid(),
    homeTeamSeasonId: zod_1.z.string().uuid(),
    awayTeamSeasonId: zod_1.z.string().uuid(),
    homeTeam: zod_1.z.object({
        teamId: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(1),
    }),
    awayTeam: zod_1.z.object({
        teamId: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(1),
    }),
    homeScore: zod_1.z.number().int().nonnegative().nullable(),
    awayScore: zod_1.z.number().int().nonnegative().nullable(),
    date: zod_1.z.iso.datetime(),
    round: zod_1.z.number().int().positive(),
    status: zod_1.z.enum([
        MatchStatus_1.MatchStatus.SCHEDULED,
        MatchStatus_1.MatchStatus.FINISHED,
        MatchStatus_1.MatchStatus.POSTPONED,
        MatchStatus_1.MatchStatus.CANCELLED,
    ]),
});
exports.generateSeasonCalendarResponseSchema = zod_1.z.object({
    matchesCount: zod_1.z.number().int().nonnegative(),
});
exports.updateMatchScoreResponseSchema = zod_1.z.object({
    matchId: zod_1.z.string().uuid(),
});
exports.updateSeasonRoundDateParamsSchema = zod_1.z.object({
    seasonId: zod_1.z.string().uuid(),
    round: zod_1.z.coerce.number().int().positive(),
});
exports.updateSeasonRoundDateBodySchema = zod_1.z.object({
    date: zod_1.z.iso.datetime(),
});
exports.updateSeasonRoundDateResponseSchema = zod_1.z.object({
    updatedMatches: zod_1.z.number().int().nonnegative(),
});
exports.updateMatchStatusBodySchema = zod_1.z.object({
    status: zod_1.z.enum([MatchStatus_1.MatchStatus.POSTPONED, MatchStatus_1.MatchStatus.CANCELLED]),
});
exports.listSeasonMatchesResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.matchResponseSchema),
    meta: zod_1.z.object({
        total: zod_1.z.number().int().nonnegative(),
        page: zod_1.z.number().int().positive(),
        lastPage: zod_1.z.number().int().nonnegative(),
    }),
});
