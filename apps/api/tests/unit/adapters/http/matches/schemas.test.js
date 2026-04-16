"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schemas_1 = require("@/adapters/http/matches/schemas");
const validUuid = '123e4567-e89b-12d3-a456-426614174000';
(0, vitest_1.describe)('matches schemas', () => {
    (0, vitest_1.it)('acepta seasonId UUID para generar calendario', () => {
        const result = schemas_1.generateSeasonCalendarParamsSchema.safeParse({ seasonId: validUuid });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('acepta startDate ISO opcional en generate calendar body', () => {
        const result = schemas_1.generateSeasonCalendarBodySchema.safeParse({
            startDate: '2026-04-01T10:00:00.000Z',
            doubleRoundRobin: true,
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('acepta params de update date de jornada', () => {
        const result = schemas_1.updateSeasonRoundDateParamsSchema.safeParse({
            seasonId: validUuid,
            round: 3,
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('acepta body de update date de jornada', () => {
        const result = schemas_1.updateSeasonRoundDateBodySchema.safeParse({
            date: '2026-04-08T10:00:00.000Z',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rechaza marcador negativo al actualizar score', () => {
        const result = schemas_1.updateMatchScoreBodySchema.safeParse({
            homeScore: -1,
            awayScore: 2,
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('acepta matchId UUID en params de update score', () => {
        const result = schemas_1.updateMatchScoreParamsSchema.safeParse({ matchId: validUuid });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('aplica defaults de paginación en listado de partidos', () => {
        const result = schemas_1.listSeasonMatchesQuerySchema.safeParse({});
        (0, vitest_1.expect)(result.success).toBe(true);
        if (!result.success)
            return;
        (0, vitest_1.expect)(result.data.page).toBe(1);
        (0, vitest_1.expect)(result.data.limit).toBe(20);
    });
    (0, vitest_1.it)('acepta estado POSTPONED en update status', () => {
        const result = schemas_1.updateMatchStatusBodySchema.safeParse({ status: 'POSTPONED' });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rechaza estado FINISHED en update status', () => {
        const result = schemas_1.updateMatchStatusBodySchema.safeParse({ status: 'FINISHED' });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('acepta match response con equipos embebidos', () => {
        const result = schemas_1.matchResponseSchema.safeParse({
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
        (0, vitest_1.expect)(result.success).toBe(true);
    });
});
