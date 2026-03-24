import { describe, it, expect } from 'vitest';
import {
  createLeagueBodySchema,
  updateLeagueBodySchema,
  getLeagueByIdParamsSchema,
} from '@/adapters/http/leagues/schemas';

describe('leagues schemas', () => {
  describe('createLeagueBodySchema', () => {
    it('acepta payload válido', () => {
      const result = createLeagueBodySchema.safeParse({
        name: 'Liga Provincial',
        leagueCategory: 'PRIMERA',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza leagueCategory inválido', () => {
      const result = createLeagueBodySchema.safeParse({
        name: 'Liga',
        leagueCategory: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateLeagueBodySchema', () => {
    it('acepta al menos un campo', () => {
      const result = updateLeagueBodySchema.safeParse({ name: 'Nuevo nombre' });
      expect(result.success).toBe(true);
    });

    it('rechaza body vacío', () => {
      const result = updateLeagueBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('getLeagueByIdParamsSchema', () => {
    it('acepta UUID válido', () => {
      const result = getLeagueByIdParamsSchema.safeParse({
        leagueId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });
  });
});
