import { z } from 'zod';
export const teamResponseSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

const paginationMetaResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
});

export const listTeamsResponseSchema = z.object({
  data: z.array(teamResponseSchema),
  meta: paginationMetaResponseSchema,
});

export const teamProfileResponseSchema = z.object({
  team: teamResponseSchema,
  leagues: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      leagueCategory: z.string(),
      seasonId: z.string().uuid(),
      seasonYear: z.number().int(),
    }),
  ),
  players: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      lastname: z.string(),
      nickname: z.string().nullable(),
      category: z.string(),
      isCurrent: z.boolean(),
    }),
  ),
});

export const createTeamBodySchema = z.object({
  name: z.string().min(1),
});

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>;

export const updateTeamBodySchema = z.object({
  name: z.string().min(1).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviarse al menos un campo' });

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>;

export const getTeamByIdParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getTeamByNameParamsSchema = z.object({
  name: z.string().min(1),
});


export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z
    .string()
    .max(100, 'q no puede superar 100 caracteres')
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const t = val.trim();
      return t.length === 0 ? undefined : t;
    }),
});

export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
