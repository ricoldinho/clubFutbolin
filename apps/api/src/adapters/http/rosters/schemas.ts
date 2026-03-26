import { z } from 'zod';
import { POSITIONS } from '@/domain/rosters/Position';

export const registerTeamToSeasonBodySchema = z.object({
  teamId: z.string().uuid(),
  seasonId: z.string().uuid(),
});

export type RegisterTeamToSeasonBody = z.infer<typeof registerTeamToSeasonBodySchema>;

export const addPlayerToRosterBodySchema = z.object({
  playerId: z.string().uuid(),
  position: z.enum(POSITIONS as unknown as [string, ...string[]]),
});

export type AddPlayerToRosterBody = z.infer<typeof addPlayerToRosterBodySchema>;

export const removePlayerFromRosterParamsSchema = z.object({
  teamSeasonId: z.string().uuid(),
  playerId: z.string().uuid(),
});

export const getRosterParamsSchema = z.object({
  teamSeasonId: z.string().uuid(),
});

export const registerTeamToSeasonResponseSchema = z.object({
  teamSeasonId: z.string().uuid(),
  teamId: z.string().uuid(),
  seasonId: z.string().uuid(),
  membersCount: z.number().int().nonnegative(),
});

export type RegisterTeamToSeasonResponse = z.infer<
  typeof registerTeamToSeasonResponseSchema
>;

export const addPlayerToRosterResponseSchema = z.object({
  membersCount: z.number().int().nonnegative(),
});

export type AddPlayerToRosterResponse = z.infer<typeof addPlayerToRosterResponseSchema>;

export const removePlayerFromRosterResponseSchema = z.object({
  membersCount: z.number().int().nonnegative(),
});

export type RemovePlayerFromRosterResponse = z.infer<
  typeof removePlayerFromRosterResponseSchema
>;
