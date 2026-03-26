import { z } from 'zod';
import { LEAGUE_CATEGORIES } from '@/domain/leagues/LeagueCategory';

const leagueCategorySchema = z.enum(LEAGUE_CATEGORIES as unknown as [string, ...string[]]);

export const createLeagueBodySchema = z.object({
  name: z.string().min(1),
  leagueCategory: leagueCategorySchema,
});

export type CreateLeagueBody = z.infer<typeof createLeagueBodySchema>;

export const updateLeagueBodySchema = z.object({
  name: z.string().min(1).optional(),
  leagueCategory: leagueCategorySchema.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });

export type UpdateLeagueBody = z.infer<typeof updateLeagueBodySchema>;

export const getLeagueByIdParamsSchema = z.object({
  leagueId: z.string().uuid(),
});

export const leagueResponseSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string(),
  leagueCategory: z.enum(LEAGUE_CATEGORIES as unknown as [string, ...string[]]),
});

const paginationMetaResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
});

export const listLeaguesResponseSchema = z.object({
  data: z.array(leagueResponseSchema),
  meta: paginationMetaResponseSchema,
});

export const listLeaguesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
