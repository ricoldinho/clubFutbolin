import { describe, it, expect } from 'vitest';
import {
  registerPlayerBodySchema,
  getPlayerByIdParamsSchema,
  listPlayersQuerySchema,
  DEFAULT_LIST_PLAYERS_PAGE,
  DEFAULT_LIST_PLAYERS_LIMIT,
  updatePlayerBodySchema,
} from '@/adapters/http/players/schemas';

describe('registerPlayerBodySchema', () => {
  it('acepta un payload válido con password', () => {
    const payload = {
      name: 'Manuel',
      lastname: 'Rico',
      nickname: null,
      email: 'test@example.com',
      phoneNumber: '600123123',
      birthdate: '1990-01-01',
      category: 'PRIMERA',
      password: 'password123',
    };

    const result = registerPlayerBodySchema.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it('rechaza un email inválido', () => {
    const payload = {
      name: 'Manuel',
      lastname: 'Rico',
      nickname: null,
      email: 'no-es-email',
      phoneNumber: '600123123',
      birthdate: '1990-01-01',
      category: 'PRIMERA',
    };

    const result = registerPlayerBodySchema.safeParse(payload);

    expect(result.success).toBe(false);
  });
});

describe('getPlayerByIdParamsSchema', () => {
  it('acepta un UUID válido', () => {
    const result = getPlayerByIdParamsSchema.safeParse({
      playerId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza un UUID inválido', () => {
    const result = getPlayerByIdParamsSchema.safeParse({ playerId: 'not-uuid' });

    expect(result.success).toBe(false);
  });
});

describe('updatePlayerBodySchema', () => {
  it('acepta un payload con algunos campos opcionales', () => {
    const payload = {
      name: 'Nuevo nombre',
      email: 'nuevo@example.com',
    };

    const result = updatePlayerBodySchema.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it('rechaza un body vacío', () => {
    const result = updatePlayerBodySchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe('listPlayersQuerySchema', () => {
  it('acepta query vacía y aplica defaults', () => {
    const result = listPlayersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(DEFAULT_LIST_PLAYERS_PAGE);
      expect(result.data.limit).toBe(DEFAULT_LIST_PLAYERS_LIMIT);
    }
  });

  it('acepta page y limit válidos (coerce desde string)', () => {
    const result = listPlayersQuerySchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('rechaza page <= 0', () => {
    expect(listPlayersQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(listPlayersQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it('rechaza limit > 100', () => {
    expect(listPlayersQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});


