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
