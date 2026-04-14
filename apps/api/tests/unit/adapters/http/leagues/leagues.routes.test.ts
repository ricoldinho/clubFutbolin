import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { leaguesRoutes } from '@/adapters/http/leagues/leagues.routes';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const seasonRepository = new InMemorySeasonRepository();
  const repository = new InMemoryLeagueRepository(seasonRepository);
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(leaguesRoutes, { repository, seasonRepository, jwtService });
  return { app, jwtService, repository, seasonRepository };
}

async function adminHeaders(jwtService: JoseJwtService) {
  const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
  return { Authorization: `Bearer ${token}` };
}

describe('leagues routes', () => {
  let server: ReturnType<typeof buildServer>['app'];
  let jwtService: JoseJwtService;

  beforeEach(async () => {
    const built = buildServer();
    server = built.app;
    jwtService = built.jwtService;
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /leagues devuelve 200 y lista vacía cuando no hay ligas', async () => {
    const response = await server.inject({ method: 'GET', url: '/leagues' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });
  });

  it('POST /leagues requiere admin y devuelve 201', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Provincial', leagueCategory: 'PRIMERA' },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as {
      id: string;
      name: string;
      leagueCategory: string;
      initialSeason: { id: string; year: number; leagueId: string };
    };
    expect(body.name).toBe('Liga Provincial');
    expect(body.leagueCategory).toBe('PRIMERA');
    expect(body.id).toBeDefined();
    expect(body.initialSeason.id).toBeDefined();
    expect(body.initialSeason.year).toBe(new Date().getFullYear());
    expect(body.initialSeason.leagueId).toBe(body.id);
  });

  it('POST /leagues devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/leagues',
      payload: { name: 'Liga', leagueCategory: 'ELITE' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST /leagues devuelve 403 con token USER', async () => {
    const token = await jwtService.sign({ sub: 'user-1', role: 'USER' });
    const response = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Liga', leagueCategory: 'ELITE' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('POST /leagues crea automáticamente la season inicial de la liga', async () => {
    // Arrange
    const headers = await adminHeaders(jwtService);

    // Act
    const createResponse = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Con Season', leagueCategory: 'MASTER' },
    });
    const created = createResponse.json() as { id: string };
    const seasonsResponse = await server.inject({
      method: 'GET',
      url: `/leagues/${created.id}/seasons`,
    });

    // Assert
    expect(createResponse.statusCode).toBe(201);
    expect(seasonsResponse.statusCode).toBe(200);
    expect(seasonsResponse.json()).toMatchObject({
      data: [
        {
          year: new Date().getFullYear(),
          leagueId: created.id,
        },
      ],
    });
  });

  it('GET /leagues/:leagueId devuelve 200 cuando existe', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga A', leagueCategory: 'PRO' },
    });
    const created = createRes.json() as { id: string };
    const getRes = await server.inject({
      method: 'GET',
      url: `/leagues/${created.id}`,
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toMatchObject({ name: 'Liga A', leagueCategory: 'PRO' });
  });

  it('GET /leagues/:leagueId devuelve 404 cuando no existe', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
    });
    expect(response.statusCode).toBe(404);
  });

  it('PATCH /leagues/:leagueId actualiza y requiere admin', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Original', leagueCategory: 'TERCERA' },
    });
    const created = createRes.json() as { id: string };
    const patchRes = await server.inject({
      method: 'PATCH',
      url: `/leagues/${created.id}`,
      headers,
      payload: { name: 'Liga Modificada' },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json()).toMatchObject({ name: 'Liga Modificada', leagueCategory: 'TERCERA' });
  });

  it('DELETE /leagues/:leagueId devuelve 400 si la liga ya tiene seasons', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga ToDelete', leagueCategory: 'CUARTA' },
    });
    const created = createRes.json() as { id: string };
    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/leagues/${created.id}`,
      headers,
    });
    expect(deleteRes.statusCode).toBe(400);
  });

  it('DELETE /leagues/:leagueId devuelve 404 cuando la liga no existe', async () => {
    const headers = await adminHeaders(jwtService);
    const response = await server.inject({
      method: 'DELETE',
      url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });
    expect(response.statusCode).toBe(404);
  });

  it('PATCH /leagues/:leagueId con leagueCategory actualiza categoría', async () => {
    const headers = await adminHeaders(jwtService);
    const createRes = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Cat', leagueCategory: 'TERCERA' },
    });
    const created = createRes.json() as { id: string };
    const patchRes = await server.inject({
      method: 'PATCH',
      url: `/leagues/${created.id}`,
      headers,
      payload: { name: 'Liga Cat', leagueCategory: 'ELITE' },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json()).toMatchObject({ leagueCategory: 'ELITE' });
  });

  it('GET /leagues/:leagueId con UUID inválido devuelve 400', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/leagues/no-es-uuid',
    });
    expect(response.statusCode).toBe(400);
  });

  it('POST /leagues devuelve 409 cuando el nombre ya existe', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Duplicada', leagueCategory: 'PRIMERA' },
    });
    const response = await server.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Duplicada', leagueCategory: 'ELITE' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ message: expect.stringContaining('Liga Duplicada') });
  });
});

describe('leagues routes - errores de infraestructura', () => {
  it('GET /leagues devuelve 500 cuando falla el repositorio', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findAll').mockRejectedValue(new Error('infra findAll'));

    // Act
    const response = await built.app.inject({ method: 'GET', url: '/leagues' });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('POST /leagues devuelve 500 cuando falla save', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'save').mockRejectedValue(new Error('infra save'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'POST',
      url: '/leagues',
      headers,
      payload: { name: 'Liga Infra', leagueCategory: 'PRIMERA' },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('GET /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));

    // Act
    const response = await built.app.inject({
      method: 'GET',
      url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('PATCH /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'PATCH',
      url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: { name: 'Liga X' },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('DELETE /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'DELETE',
      url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });
});
