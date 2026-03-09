import { z } from 'zod';

/**
 * Schema Zod para el body de POST /players.
 * Fuente de verdad del shape que acepta la API para registrar un Player.
 */
export const registerPlayerBodySchema = z.object({
  name: z.string().min(1),
  lastname: z.string().min(1),
  nickname: z.string().nullable().optional(),
  email: z.string().email(),
  phoneNumber: z.string().min(9).max(20),
  league: z.array(z.string()).default([]),
  birthdate: z.string(), // Más adelante se puede refinar a ISO (yyyy-mm-dd)
  category: z.enum(['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE']),
});

export type RegisterPlayerBody = z.infer<typeof registerPlayerBodySchema>;

/**
 * Schema Zod para los params de GET /players/:playerId.
 */
export const getPlayerByIdParamsSchema = z.object({
  playerId: z.string().uuid(),
});

/**
 * Schema Zod para los query params de GET /players (paginación/filtros futuros).
 */
export const listPlayersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

