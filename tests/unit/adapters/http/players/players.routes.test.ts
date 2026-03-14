import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { playersRoutes } from '@/adapters/http/players/players.routes';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { Player } from '@/domain/players/Player.entity';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const repository = new InMemoryPlayerRepository();
  app.register(playersRoutes, { repository });

  return app;
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
  app.register(playersRoutes, { repository });

  return app;
}

describe('players routes - Zod + Fastify integration', () => {
  let server: ReturnType<typeof buildServer>;

  beforeEach(async () => {
    server = buildServer();
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
        phoneNumber: '600123123',
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
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
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
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

  it('devuelve 200 y lista vacía en GET /players cuando no hay registros', async () => {
    // Act
    const response = await server.inject({
      method: 'GET',
      url: '/players',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('devuelve 200 y lista con players en GET /players', async () => {
    // Arrange
    const payload = {
      name: 'Manuel',
      lastname: 'Rico',
      nickname: null,
      email: 'list@example.com',
      phoneNumber: '600123123',
      league: ['Liga 1'],
      birthdate: '1990-01-01',
      category: 'PRIMERA',
    };
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload,
    });
    expect(createResponse.statusCode).toBe(201);

    // Act
    const response = await server.inject({
      method: 'GET',
      url: '/players',
    });

    // Assert
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

  it('devuelve 400 cuando playerId de GET /players/:playerId no es UUID', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/players/not-a-uuid',
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 404 cuando el player no existe en GET /players/:playerId', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
    });

    expect(response.statusCode).toBe(404);
  });

  it('actualiza un player existente en PATCH /players/:playerId y devuelve 200', async () => {
    // Arrange: crear player primero
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'patch@example.com',
        phoneNumber: '600123123',
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };

    // Act
    const patchResponse = await server.inject({
      method: 'PATCH',
      url: `/players/${created.id}`,
      payload: {
        name: 'Manuel Actualizado',
        nickname: 'Manny',
      },
    });

    // Assert
    expect(patchResponse.statusCode).toBe(200);
    const body = patchResponse.json();
    expect(body.name).toBe('Manuel Actualizado');
    expect(body.nickname).toBe('Manny');
  });

  it('devuelve 404 en PATCH /players/:playerId cuando el player no existe', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      payload: {
        name: 'No existe',
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('devuelve 400 cuando el body de PATCH /players/:playerId es inválido (email incorrecto)', async () => {
    // Arrange: crear player primero
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'patch-invalid@example.com',
        phoneNumber: '600123123',
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };

    // Act
    const response = await server.inject({
      method: 'PATCH',
      url: `/players/${created.id}`,
      payload: {
        email: 'no-es-email',
      },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it('devuelve 409 cuando el email ya está en uso en PATCH /players/:playerId', async () => {
    // Arrange: crear dos players
    const payload1 = {
      name: 'Jugador 1',
      lastname: 'Uno',
      nickname: null,
      email: 'one-patch@example.com',
      phoneNumber: '600000001',
      league: ['Liga 1'],
      birthdate: '1990-01-01',
      category: 'PRIMERA',
    };
    const payload2 = {
      name: 'Jugador 2',
      lastname: 'Dos',
      nickname: null,
      email: 'two-patch@example.com',
      phoneNumber: '600000002',
      league: ['Liga 2'],
      birthdate: '1991-02-02',
      category: 'SEGUNDA',
    };

    const r1 = await server.inject({ method: 'POST', url: '/players', payload: payload1 });
    const r2 = await server.inject({ method: 'POST', url: '/players', payload: payload2 });
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const created2 = r2.json() as { id: string };

    // Act
    const response = await server.inject({
      method: 'PATCH',
      url: `/players/${created2.id}`,
      payload: {
        email: payload1.email,
      },
    });

    // Assert
    expect(response.statusCode).toBe(409);
  });

  it('elimina un player existente en DELETE /players/:playerId y devuelve 204', async () => {
    // Arrange: crear player primero
    const createResponse = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: 'delete@example.com',
        phoneNumber: '600123123',
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { id: string };

    // Act
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/players/${created.id}`,
    });

    // Assert
    expect(deleteResponse.statusCode).toBe(204);

    const getAfterDelete = await server.inject({
      method: 'GET',
      url: `/players/${created.id}`,
    });
    expect(getAfterDelete.statusCode).toBe(404);
  });

  it('devuelve 404 en DELETE /players/:playerId cuando el player no existe', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
    });

    expect(response.statusCode).toBe(404);
  });

  it('devuelve 400 cuando playerId de PATCH /players/:playerId no es UUID', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: '/players/not-a-uuid',
      payload: {
        name: 'Nuevo nombre',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('devuelve 400 cuando playerId de DELETE /players/:playerId no es UUID', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/players/not-a-uuid',
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
      league: ['Liga 1'],
      birthdate: '1990-01-01',
      category: 'PRIMERA',
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
        league: ['Liga 1'],
        birthdate: '1990-01-01',
        category: 'PRIMERA',
      },
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en GET /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en DELETE /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();

    const response = await server.inject({
      method: 'DELETE',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en GET /players', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/players',
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });

  it('devuelve 500 cuando el repositorio falla en PATCH /players/:playerId', async () => {
    const server = buildServerWithFailingRepository();
    await server.ready();

    const response = await server.inject({
      method: 'PATCH',
      url: '/players/123e4567-e89b-12d3-a456-426614174000',
      payload: { name: 'Test' },
    });

    await server.close();

    expect(response.statusCode).toBe(500);
  });
});
