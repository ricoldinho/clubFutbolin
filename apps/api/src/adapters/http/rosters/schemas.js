"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlayerFromRosterResponseSchema = exports.addPlayerToRosterResponseSchema = exports.registerTeamToSeasonResponseSchema = exports.getRosterParamsSchema = exports.removePlayerFromRosterParamsSchema = exports.addPlayerToRosterBodySchema = exports.registerTeamToSeasonBodySchema = void 0;
const zod_1 = require("zod");
const Position_1 = require("@/domain/rosters/Position");
exports.registerTeamToSeasonBodySchema = zod_1.z.object({
    teamId: zod_1.z.string().uuid(),
    seasonId: zod_1.z.string().uuid(),
});
exports.addPlayerToRosterBodySchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    position: zod_1.z.enum(Position_1.POSITIONS),
});
exports.removePlayerFromRosterParamsSchema = zod_1.z.object({
    teamSeasonId: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
});
exports.getRosterParamsSchema = zod_1.z.object({
    teamSeasonId: zod_1.z.string().uuid(),
});
exports.registerTeamToSeasonResponseSchema = zod_1.z.object({
    teamSeasonId: zod_1.z.string().uuid(),
    teamId: zod_1.z.string().uuid(),
    seasonId: zod_1.z.string().uuid(),
    membersCount: zod_1.z.number().int().nonnegative(),
});
exports.addPlayerToRosterResponseSchema = zod_1.z.object({
    membersCount: zod_1.z.number().int().nonnegative(),
});
exports.removePlayerFromRosterResponseSchema = zod_1.z.object({
    membersCount: zod_1.z.number().int().nonnegative(),
});
