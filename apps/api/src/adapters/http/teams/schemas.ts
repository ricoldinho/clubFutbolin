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
});
