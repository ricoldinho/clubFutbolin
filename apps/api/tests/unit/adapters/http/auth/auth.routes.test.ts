import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authRoutes } from '@/adapters/http/auth/auth.routes';
import { playersRoutes } from '@/adapters/http/players/players.routes';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildApp() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const repository = new InMemoryPlayerRepository();
  const passwordHasher = new FakePasswordHasher();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);

  app.register(authRoutes, { repository, passwordHasher, jwtService });
  app.register(playersRoutes, { repository, passwordHasher, jwtService });

  return { app, repository, passwordHasher, jwtService };
}

describe('auth routes', () => {
  let app: ReturnType<typeof buildApp>['app'];

  beforeEach(async () => {
    const built = buildApp();
    app = built.app;
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login devuelve 200 con token y expiresIn cuando las credenciales son correctas', async () => {
    await app.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Ana',
        lastname: 'García',
        nickname: null,
        email: 'ana@example.com',
        phoneNumber: '600111222',
        birthdate: '1995-05-05',
        category: 'PRIMERA',
        password: 'mipassword123',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('expiresIn', TEST_JWT_EXPIRES);
    expect(typeof body.token).toBe('string');
  });

  it('POST /auth/login devuelve 401 cuando la contraseña es incorrecta', async () => {
    await app.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Ana',
        lastname: 'García',
        nickname: null,
        email: 'ana@example.com',
        phoneNumber: '600111222',
        birthdate: '1995-05-05',
        category: 'PRIMERA',
        password: 'mipassword123',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ message: expect.any(String) });
  });

  it('POST /auth/login devuelve 401 cuando el email no existe', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'noexiste@example.com', password: 'anypass' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /auth/login devuelve 400 cuando el body es inválido (sin email)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { password: 'secret' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /auth/login devuelve 500 cuando el repositorio lanza (infra error)', async () => {
    const throwingRepo: IPlayerRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      findAll: (async () => []) as unknown as IPlayerRepository['findAll'],
      findLoginDataByEmail: async () => {
        throw new Error('DB connection lost');
      },
      save: async () => {},
      delete: async () => {},
    };

    const appWithFailingRepo = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    appWithFailingRepo.setValidatorCompiler(validatorCompiler);
    appWithFailingRepo.setSerializerCompiler(serializerCompiler);
    const passwordHasher = new FakePasswordHasher();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    appWithFailingRepo.register(authRoutes, {
      repository: throwingRepo,
      passwordHasher,
      jwtService,
    });
    await appWithFailingRepo.ready();

    const response = await appWithFailingRepo.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'any@example.com', password: 'any' },
    });

    expect(response.statusCode).toBe(500);
    await appWithFailingRepo.close();
  });
});
