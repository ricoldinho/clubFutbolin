import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { playersRoutes } from '@/adapters/http/players/players.routes';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import type { IPlayerRepository, PlayerLoginData } from '@/application/ports/players/Player.repository';
import { Player } from '@/domain/players/Player.entity';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const repository = new InMemoryPlayerRepository();
  const passwordHasher = new FakePasswordHasher();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(playersRoutes, { repository, passwordHasher, jwtService });

  return { app, jwtService };
}

async function authHeaders(jwtService: JoseJwtService, playerId: string, role = 'USER') {
  const token = await jwtService.sign({ sub: playerId, role });
  return { Authorization: `Bearer ${token}` };
}

class FailingRepository implements IPlayerRepository {
  async findByEmail(): Promise<Player | null> {
    throw new Error('Infra error in findByEmail');
  }

  async findById(): Promise<Player | null> {
    throw new Error('Infra error in findById');
  }

  async findAll(): Promise<Player[]> {
    throw new Error('Infra error in findAll');
  }

  async findLoginDataByEmail(): Promise<PlayerLoginData | null> {
    return null;
  }

  async save(): Promise<void> {
    throw new Error('Infra error in save');
  }

  async delete(): Promise<void> {
    throw new Error('Infra error in delete');
  }
}

function buildServerWithFailingRepository() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const repository = new FailingRepository();
  const passwordHasher = new FakePasswordHasher();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  app.register(playersRoutes, { repository, passwordHasher, jwtService });

  return app;
}

describe('players routes - Zod + Fastify integration', () => {
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

  it('devuelve 400 cuando el body de POST /players es inválido (email incorrecto)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'no-es-email',
        phoneNumber: '60012345678',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('crea un player válido en POST /players y devuelve 201', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'test@example.com',
        phoneNumber: '600123123',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toMatchObject({
      name: 'Manuel',
      lastname: 'Rico',
      email: 'test@example.com',
    });
    expect(body.id).toBeDefined();
  });

  it('devuelve 401 en GET /players sin token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/players',
    });
    expect(response.statusCode).toBe(401);
  });

  it('devuelve 200 y lista vacía en GET /players cuando no hay registros', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players',
      headers,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('devuelve 400 en GET /players cuando page es inválida', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players?page=0',
      headers,
    });
    expect(response.statusCode).toBe(400);
  });

  it('devuelve 400 en GET /players cuando pageSize supera el máximo', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players?pageSize=101',
      headers,
    });
    expect(response.statusCode).toBe(400);
  });

  it('devuelve 200 en GET /players con query de paginación válida', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players?page=1&pageSize=10',
      headers,
    });
    expect(response.statusCode).toBe(200);
  });

  it('devuelve 200 y lista con players en GET /players', async () => {
    const payload = {
      name: 'Manuel',
      lastname: 'Rico',
      nickname: null,
      email: 'list@example.com',
      phoneNumber: '600123123',
      birthdate: '1990-01-01',
      category: 'PRIMERA',
      password: 'password123',
    };
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload,
    });
    expect(createResponse.statusCode).toBe(201);

    const headers = await authHeaders(jwtService, createResponse.json().id);
    const response = await server.inject({
      method: 'GET',
      url: '/players',
      headers,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      name: 'Manuel',
      lastname: 'Rico',
      email: 'list@example.com',
    });
  });

  it('devuelve 401 en GET /players/:playerId sin token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
    });
    expect(response.statusCode).toBe(401);
  });

  it('devuelve 400 cuando playerId de GET /players/:playerId no es UUID', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players/not-a-uuid',
      headers,
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 404 cuando el player no existe en GET /players/:playerId', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'GET',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    expect(response.statusCode).toBe(404);
  });

  it('devuelve 403 en GET /players/:playerId cuando un USER pide otro jugador', async () => {
    const [r1, r2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Usuario',
          lastname: 'Uno',
          nickname: null,
          email: 'user1-forbidden@example.com',
          phoneNumber: '600111111',
          birthdate: '1990-01-01',
          category: 'PRIMERA',
          password: 'password123',
        },
      }),
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Otro',
          lastname: 'Jugador',
          nickname: null,
          email: 'user2-forbidden@example.com',
          phoneNumber: '600222222',
          birthdate: '1991-01-01',
          category: 'PRIMERA',
          password: 'password456',
        },
      }),
    ]);
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const id1 = (r1.json() as { id: string }).id;
    const id2 = (r2.json() as { id: string }).id;
    const headers = await authHeaders(jwtService, id1, 'USER');

    const response = await server.inject({
      method: 'GET',
      url: `/players/${id2}`,
      headers,
    });

    expect(response.statusCode).toBe(403);
  });

  it('actualiza un player existente en PATCH /players/:playerId y devuelve 200', async () => {
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'patch@example.com',
        phoneNumber: '600123123',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };
    const headers = await authHeaders(jwtService, created.id);

    const patchResponse = await server.inject({
      method: 'PATCH',
      url: `/players/${created.id}`,
      headers,
      payload: {
        name: 'Manuel Actualizado',
        nickname: 'Manny',
      },
    });

    expect(patchResponse.statusCode).toBe(200);
    const body = patchResponse.json();
    expect(body.name).toBe('Manuel Actualizado');
    expect(body.nickname).toBe('Manny');
  });

  it('devuelve 404 en PATCH /players/:playerId cuando el player no existe', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'PATCH',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: {
        name: 'No existe',
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('devuelve 403 en PATCH /players/:playerId cuando un USER intenta actualizar otro jugador', async () => {
    const [r1, r2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Usuario',
          lastname: 'Uno',
          nickname: null,
          email: 'user1-patch-forbidden@example.com',
          phoneNumber: '600111111',
          birthdate: '1990-01-01',
          category: 'PRIMERA',
          password: 'password123',
        },
      }),
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Otro',
          lastname: 'Jugador',
          nickname: null,
          email: 'user2-patch-forbidden@example.com',
          phoneNumber: '600222222',
          birthdate: '1991-01-01',
          category: 'PRIMERA',
          password: 'password456',
        },
      }),
    ]);
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const id1 = (r1.json() as { id: string }).id;
    const id2 = (r2.json() as { id: string }).id;
    const headers = await authHeaders(jwtService, id1, 'USER');

    const response = await server.inject({
      method: 'PATCH',
      url: `/players/${id2}`,
      headers,
      payload: { name: 'Intentando cambiar otro' },
    });

    expect(response.statusCode).toBe(403);
  });

  it('devuelve 400 cuando el body de PATCH /players/:playerId es inválido (email incorrecto)', async () => {
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'patch-invalid@example.com',
        phoneNumber: '600123123',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };
    const headers = await authHeaders(jwtService, created.id);

    const response = await server.inject({
      method: 'PATCH',
      url: `/players/${created.id}`,
      headers,
      payload: {
        email: 'no-es-email',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 409 cuando el email ya está en uso en PATCH /players/:playerId', async () => {
    const payload1 = {
      name: 'Jugador 1',
      lastname: 'Uno',
      nickname: null,
      email: 'one-patch@example.com',
      phoneNumber: '600000001',
      birthdate: '1990-01-01',
      category: 'PRIMERA',
      password: 'password1',
    };
    const payload2 = {
      name: 'Jugador 2',
      lastname: 'Dos',
      nickname: null,
      email: 'two-patch@example.com',
      phoneNumber: '600000002',
      birthdate: '1991-02-02',
      category: 'SEGUNDA',
      password: 'password2',
    };

    const r1 = await server.inject({ method: 'POST', url: '/players', payload: payload1 });
    const r2 = await server.inject({ method: 'POST', url: '/players', payload: payload2 });
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const created2 = r2.json() as { id: string };
    const headers = await authHeaders(jwtService, created2.id);

    const response = await server.inject({
      method: 'PATCH',
      url: `/players/${created2.id}`,
      headers,
      payload: {
        email: payload1.email,
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('elimina un player existente en DELETE /players/:playerId y devuelve 204', async () => {
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'delete@example.com',
        phoneNumber: '600123123',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };
    const headers = await authHeaders(jwtService, created.id);

    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/players/${created.id}`,
      headers,
    });

    expect(deleteResponse.statusCode).toBe(204);

    const getAfterDelete = await server.inject({
      method: 'GET',
      url: `/players/${created.id}`,
      headers,
    });
    expect(getAfterDelete.statusCode).toBe(404);
  });

  it('devuelve 404 en DELETE /players/:playerId cuando el player no existe', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'DELETE',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    expect(response.statusCode).toBe(404);
  });

  it('devuelve 403 en DELETE /players/:playerId cuando un USER intenta eliminar otro jugador', async () => {
    const [r1, r2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Usuario',
          lastname: 'Uno',
          nickname: null,
          email: 'user1-delete-forbidden@example.com',
          phoneNumber: '600111111',
          birthdate: '1990-01-01',
          category: 'PRIMERA',
          password: 'password123',
        },
      }),
      server.inject({
        method: 'POST',
        url: '/players',
        payload: {
          name: 'Otro',
          lastname: 'Jugador',
          nickname: null,
          email: 'user2-delete-forbidden@example.com',
          phoneNumber: '600222222',
          birthdate: '1991-01-01',
          category: 'PRIMERA',
          password: 'password456',
        },
      }),
    ]);
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const id1 = (r1.json() as { id: string }).id;
    const id2 = (r2.json() as { id: string }).id;
    const headers = await authHeaders(jwtService, id1, 'USER');

    const response = await server.inject({
      method: 'DELETE',
      url: `/players/${id2}`,
      headers,
    });

    expect(response.statusCode).toBe(403);
  });

  it('devuelve 400 cuando playerId de PATCH /players/:playerId no es UUID', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'PATCH',
      url: '/players/not-a-uuid',
      headers,
      payload: {
        name: 'Nuevo nombre',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 400 cuando playerId de DELETE /players/:playerId no es UUID', async () => {
    const headers = await authHeaders(jwtService, PlayerId.generate().value);
    const response = await server.inject({
      method: 'DELETE',
      url: '/players/not-a-uuid',
      headers,
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 409 cuando el email ya está en uso en POST /players', async () => {
    const payload = {
      name: 'Manuel',
      lastname: 'Rico',
      nickname: null,
      email: 'duplicado@example.com',
      phoneNumber: '600123123',
      birthdate: '1990-01-01',
      category: 'PRIMERA',
      password: 'password123',
    };
    const first = await server.inject({ method: 'POST', url: '/players', payload });
    expect(first.statusCode).toBe(201);

    const second = await server.inject({ method: 'POST', url: '/players', payload });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ message: expect.stringContaining('email') });
  });
});

describe('players routes - errores de infraestructura', () => {
  it('devuelve 500 cuando el repositorio falla en POST /players', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'infra@example.com',
        phoneNumber: '600123123',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        password: 'password123',
      },
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en GET /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    const headers = await authHeaders(jwtService, '123e4567-e89b-12d3-a456-426614174000');

    const response = await server.inject({
      method: 'GET',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en DELETE /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    const headers = await authHeaders(jwtService, '123e4567-e89b-12d3-a456-426614174000');

    const response = await server.inject({
      method: 'DELETE',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en GET /players', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    const headers = await authHeaders(jwtService, PlayerId.generate().value);

    const response = await server.inject({
      method: 'GET',
      url: '/players',
      headers,
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en PATCH /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    const headers = await authHeaders(jwtService, '123e4567-e89b-12d3-a456-426614174000');

    const response = await server.inject({
      method: 'PATCH',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      headers,
      payload: { name: 'Test' },
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });
});
