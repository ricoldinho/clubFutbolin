import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rostersRoutes } from '@/adapters/http/rosters/rosters.routes';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { isOk } from '@/shared/result';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const rosterRepo = new InMemoryRosterRepository();
  const teamRepo = new InMemoryTeamRepository();
  const seasonRepo = new InMemorySeasonRepository();
  const leagueRepo = new InMemoryLeagueRepository();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(rostersRoutes, {
    repository: rosterRepo,
    teamRepository: teamRepo,
    seasonRepository: seasonRepo,
    jwtService,
  });
  return { app, jwtService, rosterRepo, teamRepo, seasonRepo, leagueRepo };
}

describe('rosters routes', () => {
  let server: ReturnType<typeof buildServer>['app'];
  let jwtService: JoseJwtService;
  let teamId: string;
  let seasonId: string;
  let teamSeasonId: string;

  beforeEach(async () => {
    const built = buildServer();
    server = built.app;
    jwtService = built.jwtService;
    const leagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga R', leagueCategory: 'ELITE' }),
    );
    const teamResult = await new CreateTeam(built.teamRepo).execute({ name: 'Equipo R' });
    if (!isOk(teamResult)) throw new Error('Expected team create');
    teamId = teamResult.value.id!.value;
    const seasonResult = await new CreateSeason(built.seasonRepo, built.leagueRepo).execute({
      year: 2026,
      leagueId,
    });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    seasonId = seasonResult.value.id!.value;
    const regResult = await new RegisterTeamToSeason(
      built.rosterRepo,
      built.teamRepo,
      built.seasonRepo,
    ).execute({ teamId: teamResult.value.id!, seasonId: seasonResult.value.id! });
    if (!isOk(regResult)) throw new Error('Expected register');
    teamSeasonId = regResult.value.teamSeasonId.value;
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('POST /rosters/register devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/rosters/register',
      payload: { teamId, seasonId },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST /rosters/:teamSeasonId/players devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      payload: {
        playerId: '123e4567-e89b-12d3-a456-426614174000',
        position: 'PORTERO',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST /rosters/register devuelve 403 con token USER', async () => {
    const token = await jwtService.sign({ sub: 'user-1', role: 'USER' });
    const response = await server.inject({
      method: 'POST',
      url: '/rosters/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: { teamId, seasonId },
    });
    expect(response.statusCode).toBe(403);
  });

  it('POST /rosters/register devuelve 201 con admin cuando equipo y temporada existen', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const built = buildServer();
    await built.app.ready();
    const newLeagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({ id: newLeagueId, name: 'Liga 2027', leagueCategory: 'ELITE' }),
    );
    const createTeam = new CreateTeam(built.teamRepo);
    const teamRes = await createTeam.execute({ name: 'Nuevo Equipo Reg' });
    if (!isOk(teamRes)) throw new Error('Expected team');
    const createSeason = new CreateSeason(built.seasonRepo, built.leagueRepo);
    const seasonRes = await createSeason.execute({ year: 2027, leagueId: newLeagueId });
    if (!isOk(seasonRes)) throw new Error('Expected season');
    const response = await built.app.inject({
      method: 'POST',
      url: '/rosters/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        teamId: teamRes.value.id!.value,
        seasonId: seasonRes.value.id!.value,
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as { teamSeasonId: string; teamId: string; seasonId: string; membersCount: number };
    expect(body.teamSeasonId).toBeDefined();
    expect(body.teamId).toBe(teamRes.value.id!.value);
    expect(body.membersCount).toBe(0);
  });

  it('POST /rosters/:teamSeasonId/players devuelve 200 con admin', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const playerId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { playerId, position: 'PORTERO' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { membersCount: number };
    expect(body.membersCount).toBe(1);
  });

  it('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/rosters/${teamSeasonId}/players/123e4567-e89b-12d3-a456-426614174000`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 200 con admin', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const playerId = '123e4567-e89b-12d3-a456-426614174001';
    await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { playerId, position: 'DELANTERO' },
    });
    const response = await server.inject({
      method: 'DELETE',
      url: `/rosters/${teamSeasonId}/players/${playerId}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { membersCount: number };
    expect(body.membersCount).toBe(0);
  });

  it('POST /rosters/register devuelve 404 cuando el equipo no existe', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const fakeTeamId = '123e4567-e89b-12d3-a456-426614174099';
    const response = await server.inject({
      method: 'POST',
      url: '/rosters/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: { teamId: fakeTeamId, seasonId },
    });
    expect(response.statusCode).toBe(404);
  });

  it('POST /rosters/register devuelve 409 cuando ya está inscrito', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const response = await server.inject({
      method: 'POST',
      url: '/rosters/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: { teamId, seasonId },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('inscrito') });
  });

  it('POST /rosters/:teamSeasonId/players devuelve 404 cuando roster no existe', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const fakeTsId = '123e4567-e89b-12d3-a456-426614174099';
    const response = await server.inject({
      method: 'POST',
      url: `/rosters/${fakeTsId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { playerId: '123e4567-e89b-12d3-a456-426614174000', position: 'PORTERO' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('POST /rosters/:teamSeasonId/players devuelve 400 cuando jugador duplicado', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const playerId = '123e4567-e89b-12d3-a456-426614174010';
    await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { playerId, position: 'PORTERO' },
    });
    const response = await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { playerId, position: 'DELANTERO' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('plantilla') });
  });

  it('POST /rosters/:teamSeasonId/players devuelve 400 cuando plantilla llena (max 4)', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const ids = [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
      '123e4567-e89b-12d3-a456-426614174003',
      '123e4567-e89b-12d3-a456-426614174004',
    ];
    for (let i = 0; i < 4; i++) {
      await server.inject({
        method: 'POST',
        url: `/rosters/${teamSeasonId}/players`,
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          playerId: ids[i],
          position: i === 0 ? 'PORTERO' : 'DELANTERO',
        },
      });
    }
    const response = await server.inject({
      method: 'POST',
      url: `/rosters/${teamSeasonId}/players`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        playerId: '123e4567-e89b-12d3-a456-426614174005',
        position: 'DELANTERO',
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('4 jugadores') });
  });

  it('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 400 cuando jugador no está en plantilla', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const playerNotInRoster = '123e4567-e89b-12d3-a456-426614174099';
    const response = await server.inject({
      method: 'DELETE',
      url: `/rosters/${teamSeasonId}/players/${playerNotInRoster}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('plantilla') });
  });

  it('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 404 cuando roster no existe', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const fakeTsId = '123e4567-e89b-12d3-a456-426614174099';
    const response = await server.inject({
      method: 'DELETE',
      url: `/rosters/${fakeTsId}/players/123e4567-e89b-12d3-a456-426614174000`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(404);
  });
});
