import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { seasonsRoutes } from '@/adapters/http/seasons/seasons.routes';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const leagueRepo = new InMemoryLeagueRepository();
  const seasonRepo = new InMemorySeasonRepository();
  const teamRepo = new InMemoryTeamRepository();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(seasonsRoutes, {
    repository: seasonRepo,
    leagueRepository: leagueRepo,
    teamRepository: teamRepo,
    jwtService,
  });
  return { app, jwtService, leagueRepo, seasonRepo, teamRepo };
}

async function adminHeaders(jwtService: JoseJwtService) {
  const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
  return { Authorization: `Bearer ${token}` };
}

describe('seasons routes', () => {
  let server: ReturnType<typeof buildServer>['app'];
  let jwtService: JoseJwtService;
  let leagueId: LeagueId;

  beforeEach(async () => {
    const built = buildServer();
    server = built.app;
    jwtService = built.jwtService;
    leagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga Test', leagueCategory: 'PRIMERA' }),
    );
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /seasons devuelve 200 y lista vacía', async () => {
    const response = await server.inject({ method: 'GET', url: '/seasons' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });
  });

  it('POST /seasons requiere admin y devuelve 201', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2025, leagueId: leagueId.value },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as { id: string; year: number; leagueId: string };
    expect(body.year).toBe(2025);
    expect(body.leagueId).toBe(leagueId.value);
    expect(body.id).toBeDefined();
  });

  it('POST /seasons devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/seasons',
      payload: { year: 2025, leagueId: leagueId.value },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /seasons/:seasonId devuelve 200 cuando existe', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2025, leagueId: leagueId.value },
    });
    const created = createRes.json() as { id: string };
    const getRes = await server.inject({ method: 'GET', url: `/seasons/${created.id}` });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toMatchObject({ year: 2025 });
  });

  it('GET /seasons/:seasonId devuelve 404 cuando no existe', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/seasons/123e4567-e89b-12d3-a456-426614174000',
    });
    expect(response.statusCode).toBe(404);
  });

  it('PATCH /seasons/:seasonId/winners requiere admin y devuelve 200', async () => {
    const built = buildServer();
    await built.app.ready();
    const newLeagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({ id: newLeagueId, name: 'Liga W', leagueCategory: 'PRO' }),
    );
    const createSeason = new CreateSeason(built.seasonRepo, built.leagueRepo);
    const seasonRes = await createSeason.execute({ year: 2025, leagueId: newLeagueId });
    if (!seasonRes.ok) throw new Error('Expected season create');
    const createTeam = new CreateTeam(built.teamRepo);
    const team1Res = await createTeam.execute({ name: 'Campeón' });
    const team2Res = await createTeam.execute({ name: 'Subcampeón' });
    if (!team1Res.ok || !team2Res.ok) throw new Error('Expected team create');
    const headers = await adminHeaders(built.jwtService);
    const response = await built.app.inject({
      method: 'PATCH',
      url: `/seasons/${seasonRes.value.id!.value}/winners`,
      headers,
      payload: {
        championId: team1Res.value.id!.value,
        secondId: team2Res.value.id!.value,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { championId: string; secondId: string };
    expect(body.championId).toBe(team1Res.value.id!.value);
    expect(body.secondId).toBe(team2Res.value.id!.value);
  });

  it('PATCH /seasons/:seasonId/winners devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
      payload: {
        championId: '123e4567-e89b-12d3-a456-426614174000',
        secondId: '123e4567-e89b-12d3-a456-426614174001',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH /seasons/:seasonId/winners devuelve 404 cuando temporada no existe', async () => {
    const built = buildServer();
    await built.app.ready();
    const createTeam = new CreateTeam(built.teamRepo);
    const t1 = await createTeam.execute({ name: 'T1' });
    const t2 = await createTeam.execute({ name: 'T2' });
    if (!t1.ok || !t2.ok) throw new Error('Expected teams');
    const headers = await adminHeaders(built.jwtService);
    const response = await built.app.inject({
      method: 'PATCH',
      url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
      headers,
      payload: {
        championId: t1.value.id!.value,
        secondId: t2.value.id!.value,
      },
    });
    expect(response.statusCode).toBe(404);
  });

  it('POST /seasons devuelve 404 cuando la liga no existe', async () => {
    const headers = await adminHeaders(jwtService);
    const fakeLeagueId = '123e4567-e89b-12d3-a456-426614174099';
    const response = await server.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2030, leagueId: fakeLeagueId },
    });
    expect(response.statusCode).toBe(404);
  });

  it('POST /seasons devuelve 409 cuando ya existe temporada con mismo año en la liga', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2028, leagueId: leagueId.value },
    });
    const response = await server.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2028, leagueId: leagueId.value },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('año') });
  });

  it('PATCH /seasons/:seasonId/winners devuelve 400 cuando campeón y subcampeón son el mismo', async () => {
    const built = buildServer();
    await built.app.ready();
    const newLeagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({ id: newLeagueId, name: 'Liga S', leagueCategory: 'PRO' }),
    );
    const createSeason = new CreateSeason(built.seasonRepo, built.leagueRepo);
    const seasonRes = await createSeason.execute({ year: 2026, leagueId: newLeagueId });
    if (!seasonRes.ok) throw new Error('Expected season');
    const createTeam = new CreateTeam(built.teamRepo);
    const teamRes = await createTeam.execute({ name: 'Solo Uno' });
    if (!teamRes.ok) throw new Error('Expected team');
    const headers = await adminHeaders(built.jwtService);
    const response = await built.app.inject({
      method: 'PATCH',
      url: `/seasons/${seasonRes.value.id!.value}/winners`,
      headers,
      payload: {
        championId: teamRes.value.id!.value,
        secondId: teamRes.value.id!.value,
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('diferentes') });
  });
});

describe('seasons routes - errores de infraestructura', () => {
  it('GET /seasons devuelve 500 cuando falla findAll', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.seasonRepo, 'findAll').mockRejectedValue(new Error('infra findAll'));

    // Act
    const response = await built.app.inject({ method: 'GET', url: '/seasons' });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('POST /seasons devuelve 500 cuando falla findByLeagueId', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    const headers = await adminHeaders(built.jwtService);
    const existingLeagueId = LeagueId.generate();
    await built.leagueRepo.save(
      League.create({
        id: existingLeagueId,
        name: 'Liga Infra',
        leagueCategory: 'PRIMERA',
      }),
    );
    vi.spyOn(built.seasonRepo, 'findByLeagueId').mockRejectedValue(
      new Error('infra findByLeagueId'),
    );

    // Act
    const response = await built.app.inject({
      method: 'POST',
      url: '/seasons',
      headers,
      payload: { year: 2035, leagueId: existingLeagueId.value },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('GET /seasons/:seasonId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.seasonRepo, 'findById').mockRejectedValue(new Error('infra findById'));

    // Act
    const response = await built.app.inject({
      method: 'GET',
      url: '/seasons/123e4567-e89b-12d3-a456-426614174000',
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('PATCH /seasons/:seasonId/winners devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    const headers = await adminHeaders(built.jwtService);
    vi.spyOn(built.seasonRepo, 'findById').mockRejectedValue(new Error('infra findById'));

    // Act
    const response = await built.app.inject({
      method: 'PATCH',
      url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
      headers,
      payload: {
        championId: '123e4567-e89b-12d3-a456-426614174001',
        secondId: '123e4567-e89b-12d3-a456-426614174002',
      },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });
});
