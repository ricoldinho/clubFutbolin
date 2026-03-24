import { describe, it, expect } from 'vitest';
import {
  addPlayerToRosterBodySchema,
  getRosterParamsSchema,
  registerTeamToSeasonBodySchema,
  removePlayerFromRosterParamsSchema,
} from '@/adapters/http/rosters/schemas';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';
const otherUuid = '223e4567-e89b-12d3-a456-426614174001';

describe('rosters schemas', () => {
  describe('registerTeamToSeasonBodySchema', () => {
    it('acepta teamId y seasonId UUID', () => {
      const result = registerTeamToSeasonBodySchema.safeParse({
        teamId: validUuid,
        seasonId: otherUuid,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza teamId inválido', () => {
      const result = registerTeamToSeasonBodySchema.safeParse({
        teamId: 'x',
        seasonId: otherUuid,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('addPlayerToRosterBodySchema', () => {
    it('acepta posición PORTERO', () => {
      const result = addPlayerToRosterBodySchema.safeParse({
        playerId: validUuid,
        position: 'PORTERO',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza posición desconocida', () => {
      const result = addPlayerToRosterBodySchema.safeParse({
        playerId: validUuid,
        position: 'MEDIO',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('removePlayerFromRosterParamsSchema', () => {
    it('acepta params UUID', () => {
      const result = removePlayerFromRosterParamsSchema.safeParse({
        teamSeasonId: validUuid,
        playerId: otherUuid,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza playerId no UUID', () => {
      const result = removePlayerFromRosterParamsSchema.safeParse({
        teamSeasonId: validUuid,
        playerId: 'nope',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getRosterParamsSchema', () => {
    it('acepta teamSeasonId UUID', () => {
      const result = getRosterParamsSchema.safeParse({ teamSeasonId: validUuid });
      expect(result.success).toBe(true);
    });
  });
});
