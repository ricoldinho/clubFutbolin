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
