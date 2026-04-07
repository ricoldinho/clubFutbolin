import { describe, expect, it } from 'vitest';
import {
  generateSeasonCalendarBodySchema,
  generateSeasonCalendarParamsSchema,
  listSeasonMatchesQuerySchema,
  matchResponseSchema,
  updateMatchScoreBodySchema,
  updateMatchScoreParamsSchema,
  updateMatchStatusBodySchema,
} from '@/adapters/http/matches/schemas';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('matches schemas', () => {
  it('acepta seasonId UUID para generar calendario', () => {
    const result = generateSeasonCalendarParamsSchema.safeParse({ seasonId: validUuid });
    expect(result.success).toBe(true);
  });

  it('acepta startDate ISO opcional en generate calendar body', () => {
    const result = generateSeasonCalendarBodySchema.safeParse({
      startDate: '2026-04-01T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza marcador negativo al actualizar score', () => {
    const result = updateMatchScoreBodySchema.safeParse({
      homeScore: -1,
      awayScore: 2,
    });
    expect(result.success).toBe(false);
  });

  it('acepta matchId UUID en params de update score', () => {
    const result = updateMatchScoreParamsSchema.safeParse({ matchId: validUuid });
    expect(result.success).toBe(true);
  });

  it('aplica defaults de paginación en listado de partidos', () => {
    const result = listSeasonMatchesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  it('acepta estado POSTPONED en update status', () => {
    const result = updateMatchStatusBodySchema.safeParse({ status: 'POSTPONED' });
    expect(result.success).toBe(true);
  });

  it('rechaza estado FINISHED en update status', () => {
    const result = updateMatchStatusBodySchema.safeParse({ status: 'FINISHED' });
    expect(result.success).toBe(false);
  });

  it('acepta match response con equipos embebidos', () => {
    const result = matchResponseSchema.safeParse({
      id: validUuid,
      seasonId: validUuid,
      homeTeamSeasonId: validUuid,
      awayTeamSeasonId: validUuid,
      homeTeam: { teamId: validUuid, name: 'Equipo Local' },
      awayTeam: { teamId: validUuid, name: 'Equipo Visitante' },
      homeScore: 4,
      awayScore: 0,
      date: '2026-04-01T10:00:00.000Z',
      round: 1,
      status: 'FINISHED',
    });
    expect(result.success).toBe(true);
  });
});
