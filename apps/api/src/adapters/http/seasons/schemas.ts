import { z } from 'zod';

export const createSeasonBodySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  leagueId: z.string().uuid(),
});

export type CreateSeasonBody = z.infer<typeof createSeasonBodySchema>;

export const updateSeasonBodySchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });

export const setSeasonWinnersBodySchema = z.object({
  championId: z.string().uuid(),
  secondId: z.string().uuid(),
});

export const getSeasonByIdParamsSchema = z.object({
  seasonId: z.string().uuid(),
});

export const seasonResponseSchema = z.object({
  id: z.string().uuid().nullable(),
  year: z.number().int(),
  leagueId: z.string().uuid(),
  championId: z.string().uuid().nullable(),
  secondId: z.string().uuid().nullable(),
});

const paginationMetaResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
});

export const listSeasonsResponseSchema = z.object({
  data: z.array(seasonResponseSchema),
  meta: paginationMetaResponseSchema,
});

export const listSeasonsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
