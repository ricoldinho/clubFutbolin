import { describe, it, expect } from 'vitest';
import {
  createTeamBodySchema,
  updateTeamBodySchema,
  getTeamByIdParamsSchema,
  getTeamByNameParamsSchema,
  listTeamsQuerySchema,
  teamProfileResponseSchema,
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

  describe('listTeamsQuerySchema', () => {
    it('aplica defaults de paginación', () => {
      const result = listTeamsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('acepta q opcional y recorta espacios', () => {
      const result = listTeamsQuerySchema.safeParse({ q: '  fc  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe('fc');
      }
    });

    it('transforma q vacío a undefined', () => {
      const result = listTeamsQuerySchema.safeParse({ q: '   ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBeUndefined();
      }
    });

    it('rechaza q con más de 100 caracteres', () => {
      expect(listTeamsQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
    });
  });

  describe('teamProfileResponseSchema', () => {
    it('acepta perfil con isCurrent en jugadores', () => {
      const result = teamProfileResponseSchema.safeParse({
        team: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Equipo',
          createdAt: new Date().toISOString(),
        },
        leagues: [],
        players: [
          {
            id: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Juan',
            lastname: 'Pérez',
            nickname: null,
            category: 'PRIMERA',
            isCurrent: true,
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});
