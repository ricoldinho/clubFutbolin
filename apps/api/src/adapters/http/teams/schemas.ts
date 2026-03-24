import { z } from 'zod';

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
