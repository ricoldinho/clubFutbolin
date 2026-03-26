import { z } from 'zod';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';

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

export const loginResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.string(),
});

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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

/** Valores por defecto de la paginación para GET /players. */
export const DEFAULT_LIST_PLAYERS_PAGE = 1;
export const DEFAULT_LIST_PLAYERS_LIMIT = 20;

const birthdateResponseSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthdate debe tener formato YYYY-MM-DD');

export const playerResponseSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string(),
  lastname: z.string(),
  nickname: z.string().nullable(),
  email: z.string().email(),
  phoneNumber: z.string().min(9).max(20),
  birthdate: birthdateResponseSchema,
  category: z.nativeEnum(PlayerCategory),
  role: z.nativeEnum(PlayerRole),
});

const paginationMetaResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
});

export const listPlayersResponseSchema = z.object({
  data: z.array(playerResponseSchema),
  meta: paginationMetaResponseSchema,
});

