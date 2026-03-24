import { z } from 'zod';

/**
 * Schema Zod para el body de POST /players.
 * Fuente de verdad del shape que acepta la API para registrar un Player.
 * Incluye password; el nuevo Player tiene siempre role USER.
 */
export const registerPlayerBodySchema = z.object({
  name: z.string().min(1),
  lastname: z.string().min(1),
  nickname: z.string().nullable().optional(),
  email: z.string().email(),
  phoneNumber: z.string().min(9).max(20),
  birthdate: z.string(), // Más adelante se puede refinar a ISO (yyyy-mm-dd)
  category: z.enum(['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type RegisterPlayerBody = z.infer<typeof registerPlayerBodySchema>;

/**
 * Schema Zod para el body de POST /auth/login.
 */
export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

/**
 * Schema Zod para el body de PATCH /players/:playerId.
 * Todos los campos son opcionales, pero debe venir al menos uno.
 */
export const updatePlayerBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    nickname: z.string().nullable().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(9).max(20).optional(),
    birthdate: z.string().optional(),
    category: z.enum(['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE']).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe enviarse al menos un campo para actualizar' },
  );

export type UpdatePlayerBody = z.infer<typeof updatePlayerBodySchema>;

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

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

/** Valores por defecto si el cliente envía solo `page` o solo `pageSize`. */
export const DEFAULT_LIST_PLAYERS_PAGE = 1;
export const DEFAULT_LIST_PLAYERS_PAGE_SIZE = 20;

/**
 * Si no hay ningún query param de paginación, devuelve `undefined` (listar todo).
 * Si viene al menos uno, aplica el otro por defecto.
 */
export function resolveListPlayersPagination(
  q: ListPlayersQuery,
): { page: number; pageSize: number } | undefined {
  if (q.page === undefined && q.pageSize === undefined) {
    return undefined;
  }
  return {
    page: q.page ?? DEFAULT_LIST_PLAYERS_PAGE,
    pageSize: q.pageSize ?? DEFAULT_LIST_PLAYERS_PAGE_SIZE,
  };
}

