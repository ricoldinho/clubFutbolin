import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { teamsRoutes } from '@/adapters/http/teams/teams.routes';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const repository = new InMemoryTeamRepository();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(teamsRoutes, { repository, jwtService });
  return { app, jwtService, repository };
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
      payload: { name: 'Equipo Zeta' },
    });
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: { name: 'Otro Club' },
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
      payload: { name: 'Equipo Alpha' },
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
      payload: { name: 'Equipo' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /teams/by-name/:name devuelve 200 cuando existe', async () => {
    const headers = await adminHeaders(jwtService);
    await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: { name: 'Equipo Beta' },
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
      payload: { name: 'Equipo Original' },
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
      payload: { name: 'Equipo ToDelete' },
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
      payload: { name: 'Equipo Duplicado' },
    });
    const response = await server.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: { name: 'Equipo Duplicado' },
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
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findAll').mockRejectedValue(new Error('infra findAll'));

    // Act
    const response = await built.app.inject({ method: 'GET', url: '/teams' });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('POST /teams devuelve 500 cuando falla save', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'save').mockRejectedValue(new Error('infra save'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'POST',
      url: '/teams',
      headers,
      payload: { name: 'Equipo Infra' },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('GET /teams/by-name/:name devuelve 500 cuando falla findByName', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findByName').mockRejectedValue(new Error('infra findByName'));

    // Act
    const response = await built.app.inject({
      method: 'GET',
      url: '/teams/by-name/Equipo',
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('PATCH /teams/:teamId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'PATCH',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: { name: 'Equipo X' },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });

  it('DELETE /teams/:teamId devuelve 500 cuando falla findById', async () => {
    // Arrange
    const built = buildServer();
    await built.app.ready();
    vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
    const headers = await adminHeaders(built.jwtService);

    // Act
    const response = await built.app.inject({
      method: 'DELETE',
      url: '/teams/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await built.app.close();
  });
});
