import { describe, it, expect } from 'vitest';
import {
  createSeasonBodySchema,
  getSeasonByIdParamsSchema,
  setSeasonWinnersBodySchema,
  updateSeasonBodySchema,
} from '@/adapters/http/seasons/schemas';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('seasons schemas', () => {
  describe('createSeasonBodySchema', () => {
    it('acepta payload válido', () => {
      const result = createSeasonBodySchema.safeParse({
        year: 2025,
        leagueId: validUuid,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza año fuera de rango', () => {
      const result = createSeasonBodySchema.safeParse({
        year: 1999,
        leagueId: validUuid,
      });
      expect(result.success).toBe(false);
    });

    it('rechaza leagueId no UUID', () => {
      const result = createSeasonBodySchema.safeParse({
        year: 2025,
        leagueId: 'no-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSeasonBodySchema', () => {
    it('acepta al menos year', () => {
      const result = updateSeasonBodySchema.safeParse({ year: 2026 });
      expect(result.success).toBe(true);
    });

    it('rechaza body vacío', () => {
      const result = updateSeasonBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('setSeasonWinnersBodySchema', () => {
    it('acepta championId y secondId UUID', () => {
      const result = setSeasonWinnersBodySchema.safeParse({
        championId: validUuid,
        secondId: '223e4567-e89b-12d3-a456-426614174001',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza UUID inválido', () => {
      const result = setSeasonWinnersBodySchema.safeParse({
        championId: 'x',
        secondId: validUuid,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getSeasonByIdParamsSchema', () => {
    it('acepta seasonId UUID', () => {
      const result = getSeasonByIdParamsSchema.safeParse({ seasonId: validUuid });
      expect(result.success).toBe(true);
    });

    it('rechaza seasonId no UUID', () => {
      const result = getSeasonByIdParamsSchema.safeParse({ seasonId: 'bad' });
      expect(result.success).toBe(false);
    });
  });
});
