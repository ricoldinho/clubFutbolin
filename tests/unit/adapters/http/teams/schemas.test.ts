import { describe, it, expect } from 'vitest';
import {
  createTeamBodySchema,
  updateTeamBodySchema,
  getTeamByIdParamsSchema,
  getTeamByNameParamsSchema,
} from '@/adapters/http/teams/schemas';

describe('teams schemas', () => {
  describe('createTeamBodySchema', () => {
    it('acepta payload válido', () => {
      const result = createTeamBodySchema.safeParse({ name: 'Equipo Alpha' });
      expect(result.success).toBe(true);
    });

    it('rechaza name vacío', () => {
      const result = createTeamBodySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTeamBodySchema', () => {
    it('acepta name', () => {
      const result = updateTeamBodySchema.safeParse({ name: 'Nuevo nombre' });
      expect(result.success).toBe(true);
    });

    it('rechaza body vacío', () => {
      const result = updateTeamBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('getTeamByIdParamsSchema', () => {
    it('acepta UUID válido', () => {
      const result = getTeamByIdParamsSchema.safeParse({
        teamId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getTeamByNameParamsSchema', () => {
    it('acepta name no vacío', () => {
      const result = getTeamByNameParamsSchema.safeParse({ name: 'Equipo X' });
      expect(result.success).toBe(true);
    });
  });
});
