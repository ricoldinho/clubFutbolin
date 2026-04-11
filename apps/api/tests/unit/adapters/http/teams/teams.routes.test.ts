import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { teamsRoutes } from '@/adapters/http/teams/teams.routes';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { buildCreateTeamUseCase } from '../../../../doubles/buildCreateTeamUseCase';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { Player } from '@/domain/players/Player.entity';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

/** Jugadores fijos para POST /teams (CreateTeam exige al menos 2 ids existentes). */
const PLAYER_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PLAYER_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function teamCreatePayload(name: string): { name: string; playerIds: string[] } {
  return { name, playerIds: [PLAYER_1, PLAYER_2] };
}

async function seedSeasonAndTwoPlayers(deps: {
  seasonRepository: InMemorySeasonRepository;
  playerRepository: InMemoryPlayerRepository;
}): Promise<void> {
  const leagueId = LeagueId.generate();
  await deps.seasonRepository.save(
    Season.create({
      id: SeasonId.generate(),
      year: 2026,
      leagueId,
    }),
  );

  const p1 = Player.create({
    id: PlayerId.fromString(PLAYER_1),
    name: 'Juan',
    lastname: 'Uno',
    nickname: null,
    email: Email.create('teams-route-p1@test.local'),
    phoneNumber: PhoneNumber.create('600000001'),
    birthdate: Birthdate.create('2000-01-01'),
    category: PlayerCategory.PRIMERA,
    role: PlayerRole.USER,
  });
  const p2 = Player.create({
    id: PlayerId.fromString(PLAYER_2),
    name: 'Pedro',
    lastname: 'Dos',
    nickname: null,
    email: Email.create('teams-route-p2@test.local'),
    phoneNumber: PhoneNumber.create('600000002'),
    birthdate: Birthdate.create('2001-02-02'),
    category: PlayerCategory.PRIMERA,
    role: PlayerRole.USER,
  });
  await deps.playerRepository.save(p1, 'x');
  await deps.playerRepository.save(p2, 'x');
}

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const repository = new InMemoryTeamRepository();
  const seasonRepository = new InMemorySeasonRepository();
  const rosterRepository = new InMemoryRosterRepository();
  const playerRepository = new InMemoryPlayerRepository();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  const createTeam = buildCreateTeamUseCase({
    teamRepository: repository,
    seasonRepository,
    rosterRepository,
    playerRepository,
  });
  app.register(teamsRoutes, {
    repository,
    rosterRepository,
    jwtService,
    createTeam,
  });
  return {
    app,
    jwtService,
    repository,
    seasonRepository,
    rosterRepository,
    playerRepository,
    createTeam,
  };
}

async function adminHeaders(jwtService: JoseJwtService) {
  const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
  return { Authorization: `Bearer ${token}` };
}

describe('teams routes', () => {
  let server: ReturnType<typeof buildServer>['app'];
  let jwtService: JoseJwtService;

  beforeEach(async () => {
    const built = buildServer();
    server = built.app;
    jwtService = built.jwtService;
    await seedSeasonAndTwoPlayers(built);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /teams devuelve 200 y lista vacía cuando no hay equipos', async () => {
    const response = await server.inject({ method: 'GET', url: '/teams' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });
  });

  it('devuelve 400 en GET /teams cuando q supera 100 caracteres', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/teams?q=${encodeURIComponent('a'.repeat(101))}`,
    });
    expect(response.statusCode).toBe(400);
  });

  it('GET /teams con q filtra por nombre', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Zeta'),
    });
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Otro Club'),
    });

    const response = await server.inject({
      method: 'GET',
      url: '/teams?q=Zeta',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: Array<{ name: string }>; meta: { total: number } };
    expect(body.meta.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Equipo Zeta');
  });

  it('POST /teams requiere admin y devuelve 201', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Alpha'),
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as { id: string; name: string };
    expect(body.name).toBe('Equipo Alpha');
    expect(body.id).toBeDefined();
  });

  it('POST /teams devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/teams',
      payload: teamCreatePayload('Equipo'),
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /teams/by-name/:name devuelve 200 cuando existe', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Beta'),
    });
    const response = await server.inject({
      method: 'GET',
      url: '/teams/by-name/Equipo%20Beta',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Equipo Beta' });
  });

  it('GET /teams/by-name/:name devuelve 404 cuando no existe', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/teams/by-name/NoExiste',
    });
    expect(response.statusCode).toBe(404);
  });

  it('PATCH /teams/:teamId actualiza y requiere admin', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Original'),
    });
    const created = createRes.json() as { id: string };
    const patchRes = await server.inject({
      method: 'PATCH',
      url: `/teams/${created.id}`,
      headers,
      payload: { name: 'Equipo Modificado' },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json()).toMatchObject({ name: 'Equipo Modificado' });
  });

  it('DELETE /teams/:teamId elimina y requiere admin', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo ToDelete'),
    });
    const created = createRes.json() as { id: string };
    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/teams/${created.id}`,
      headers,
    });
    expect(deleteRes.statusCode).toBe(204);
  });

  it('POST /teams devuelve 409 cuando el nombre ya existe', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Duplicado'),
    });
    const response = await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Duplicado'),
    });
    expect(response.statusCode).toBe(409);
  });

  it('PATCH /teams/:teamId devuelve 404 cuando no existe', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'PATCH',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: { name: 'Cualquier' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('DELETE /teams/:teamId devuelve 404 cuando no existe', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'DELETE',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('teams routes - errores de infraestructura', () => {
  it('GET /teams devuelve 500 cuando falla findAll', async () => {
    const built = buildServer();
    await seedSeasonAndTwoPlayers(built);
    await built.app.ready();
    vi.spyOn(built.repository, 'findAll').mockRejectedValue(new Error('infra findAll'));

    const response = await built.app.inject({ method: 'GET', url: '/teams' });

    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('POST /teams devuelve 500 cuando falla save', async () => {
    const built = buildServer();
    await seedSeasonAndTwoPlayers(built);
    await built.app.ready();
    vi.spyOn(built.repository, 'save').mockRejectedValue(new Error('infra save'));
    const headers = await adminHeaders(built.jwtService);

    const response = await built.app.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: teamCreatePayload('Equipo Infra'),
    });

    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('GET /teams/by-name/:name devuelve 500 cuando falla findByName', async () => {
    const built = buildServer();
    await seedSeasonAndTwoPlayers(built);
    await built.app.ready();
    vi.spyOn(built.repository, 'findByName').mockRejectedValue(new Error('infra findByName'));

    const response = await built.app.inject({
      method: 'GET',
      url: '/teams/by-name/Equipo',
    });

    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('PATCH /teams/:teamId devuelve 500 cuando falla findById', async () => {
    const built = buildServer();
    await seedSeasonAndTwoPlayers(built);
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    const response = await built.app.inject({
      method: 'PATCH',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: { name: 'Equipo X' },
    });

    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('DELETE /teams/:teamId devuelve 500 cuando falla findById', async () => {
    const built = buildServer();
    await seedSeasonAndTwoPlayers(built);
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    const response = await built.app.inject({
      method: 'DELETE',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    expect(response.statusCode).toBe(500);
    await built.app.close();
  });
});
