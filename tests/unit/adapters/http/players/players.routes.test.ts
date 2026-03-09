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

  async save(): Promise<void> {
    throw new Error('Infra error in save');
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
});
