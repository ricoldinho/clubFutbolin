import { z } from 'zod';
import { MatchStatus } from '@/domain/matches/MatchStatus';

/**
 * Schemas Zod del recurso HTTP Matches.
 * Fuente de verdad para validación de params/body/query/response y OpenAPI.
 */
export const generateSeasonCalendarParamsSchema = z.object({
  seasonId: z.string().uuid(),
});

export const generateSeasonCalendarBodySchema = z
  .object({
    startDate: z.iso.datetime().optional(),
  })
  .optional();

export type GenerateSeasonCalendarBody = z.infer<
  typeof generateSeasonCalendarBodySchema
>;

export const updateMatchScoreParamsSchema = z.object({
  matchId: z.string().uuid(),
});

export const updateMatchScoreBodySchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export type UpdateMatchScoreBody = z.infer<typeof updateMatchScoreBodySchema>;

export const listSeasonMatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  round: z.coerce.number().int().positive().optional(),
});

export const matchResponseSchema = z.object({
  id: z.string().uuid(),
  seasonId: z.string().uuid(),
  homeTeamSeasonId: z.string().uuid(),
  awayTeamSeasonId: z.string().uuid(),
  homeScore: z.number().int().nonnegative().nullable(),
  awayScore: z.number().int().nonnegative().nullable(),
  date: z.iso.datetime(),
  round: z.number().int().positive(),
  status: z.enum([
    MatchStatus.SCHEDULED,
    MatchStatus.FINISHED,
    MatchStatus.POSTPONED,
    MatchStatus.CANCELLED,
  ]),
});

export const generateSeasonCalendarResponseSchema = z.object({
  matchesCount: z.number().int().nonnegative(),
});

export const updateMatchScoreResponseSchema = z.object({
  matchId: z.string().uuid(),
});

export const listSeasonMatchesResponseSchema = z.object({
  data: z.array(matchResponseSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    lastPage: z.number().int().nonnegative(),
  }),
});
