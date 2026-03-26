import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
