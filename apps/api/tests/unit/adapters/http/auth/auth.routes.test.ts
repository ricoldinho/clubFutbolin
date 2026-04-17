import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
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
import type { IRefreshTokenSessionRepository } from '@/application/ports/auth/RefreshTokenSession.repository';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
const TEST_JWT_REFRESH_EXPIRES = '14d';
const TEST_SERVER_CONFIG = {
  PORT: 3000,
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  JWT_SECRET: TEST_JWT_SECRET,
  JWT_EXPIRES_IN: TEST_JWT_EXPIRES,
  JWT_REFRESH_EXPIRES_IN: TEST_JWT_REFRESH_EXPIRES,
  CORS_ORIGINS: '*',
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW_MS: 60000,
  AUTH_RATE_LIMIT_MAX: 2,
  AUTH_RATE_LIMIT_WINDOW_MS: 60000,
  AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
  AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
  AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
  AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
  AUTH_COOKIE_SAME_SITE: 'lax',
  AUTH_COOKIE_SECURE: false,
  AUTH_CSRF_COOKIE_NAME: 'clubfutbolin_csrf',
  AUTH_CSRF_HEADER_NAME: 'x-csrf-token',
  TRUST_PROXY: false,
};

function buildApp() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('config', TEST_SERVER_CONFIG);

  const repository = new InMemoryPlayerRepository();
  const passwordHasher = new FakePasswordHasher();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
  const sessions = new Map<
    string,
    {
      jti: string;
      family: string;
      playerId: string;
      expiresAt: Date;
      revokedAt: Date | null;
      replacedByJti: string | null;
      lastUsedAt: Date | null;
    }
  >();
  const refreshTokenSessionRepository: IRefreshTokenSessionRepository = {
    create: async (input) => {
      sessions.set(input.jti, {
        jti: input.jti,
        family: input.family,
        playerId: input.playerId,
        expiresAt: input.expiresAt,
        revokedAt: null,
        replacedByJti: null,
        lastUsedAt: null,
      });
    },
    findByJti: async (jti) => sessions.get(jti) ?? null,
    rotate: async (currentJti, nextJti, nextExpiresAt) => {
      const current = sessions.get(currentJti);
      if (!current) return;
      current.revokedAt = new Date();
      current.replacedByJti = nextJti;
      current.lastUsedAt = new Date();
      sessions.set(nextJti, {
        jti: nextJti,
        family: current.family,
        playerId: current.playerId,
        expiresAt: nextExpiresAt,
        revokedAt: null,
        replacedByJti: null,
        lastUsedAt: null,
      });
    },
    revokeFamily: async (family) => {
      for (const session of sessions.values()) {
        if (session.family === family) {
          session.revokedAt = new Date();
        }
      }
    },
    revokeByJti: async (jti) => {
      const current = sessions.get(jti);
      if (current) {
        current.revokedAt = new Date();
      }
    },
  };

  app.register(fastifyCookie);
  app.register(fastifyRateLimit, {
    max: TEST_SERVER_CONFIG.RATE_LIMIT_MAX,
    timeWindow: TEST_SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
  });
  app.register(authRoutes, {
    repository,
    passwordHasher,
    jwtService,
    refreshTokenSessionRepository,
  });
  app.register(playersRoutes, { repository, passwordHasher, jwtService });

  return { app, repository, passwordHasher, jwtService };
}

const registerTestPlayer = async (app: ReturnType<typeof buildApp>['app']) => {
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
};

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

  it('POST /auth/login devuelve 200 con cookies de sesión cuando las credenciales son correctas', async () => {
    // Arrange
    await registerTestPlayer(app);

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      playerId: expect.any(String),
      role: 'USER',
      expiresIn: TEST_JWT_EXPIRES,
    });
    const setCookie = response.headers['set-cookie'];
    const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME);
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME);
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME);
  });

  it('POST /auth/login devuelve 401 cuando la contraseña es incorrecta', async () => {
    // Arrange
    await registerTestPlayer(app);

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });

    // Assert
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ message: expect.any(String) });
  });

  it('POST /auth/login devuelve 401 cuando el email no existe', async () => {
    // Arrange
    // (sin jugador registrado)

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'noexiste@example.com', password: 'anypass' },
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });

  it('POST /auth/login devuelve 400 cuando el body es inválido (sin email)', async () => {
    // Arrange
    // body incompleto

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { password: 'secret' },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it('POST /auth/login devuelve 500 cuando el repositorio lanza (infra error)', async () => {
    // Arrange
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
    appWithFailingRepo.decorate('config', TEST_SERVER_CONFIG);
    appWithFailingRepo.register(fastifyCookie);
    appWithFailingRepo.register(fastifyRateLimit, {
      max: TEST_SERVER_CONFIG.RATE_LIMIT_MAX,
      timeWindow: TEST_SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    const passwordHasher = new FakePasswordHasher();
    const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    appWithFailingRepo.register(authRoutes, {
      repository: throwingRepo,
      passwordHasher,
      jwtService,
      refreshTokenSessionRepository: {
        create: async () => {},
        findByJti: async () => null,
        rotate: async () => {},
        revokeFamily: async () => {},
        revokeByJti: async () => {},
      },
    });
    await appWithFailingRepo.ready();

    // Act
    const response = await appWithFailingRepo.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'any@example.com', password: 'any' },
    });

    // Assert
    expect(response.statusCode).toBe(500);
    await appWithFailingRepo.close();
  });

  it('POST /auth/login devuelve 429 cuando se supera el rate limit de login', async () => {
    // Arrange
    await registerTestPlayer(app);

    // Act
    const first = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });
    const third = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });

    // Assert
    expect(first.statusCode).toBe(401);
    expect(second.statusCode).toBe(401);
    expect(third.statusCode).toBe(429);
  });

  it('POST /auth/login permite intentar con otro email sin compartir bucket de rate-limit', async () => {
    // Arrange
    await registerTestPlayer(app);

    // Act
    const firstKnownEmail = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });
    const secondKnownEmail = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'wrongpassword' },
    });
    const firstUnknownEmail = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'other@example.com', password: 'wrongpassword' },
    });

    // Assert
    expect(firstKnownEmail.statusCode).toBe(401);
    expect(secondKnownEmail.statusCode).toBe(401);
    expect(firstUnknownEmail.statusCode).toBe(401);
  });

  it('POST /auth/refresh devuelve 200 y rota cookies cuando la refresh cookie es válida', async () => {
    // Arrange
    await registerTestPlayer(app);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });
    const refreshCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME,
    );
    const csrfCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME,
    );

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME]: refreshCookie?.value ?? '',
        [TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME]: csrfCookie?.value ?? '',
      },
      headers: {
        [TEST_SERVER_CONFIG.AUTH_CSRF_HEADER_NAME]: csrfCookie?.value ?? '',
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      playerId: expect.any(String),
      role: 'USER',
      expiresIn: TEST_JWT_EXPIRES,
    });
    const setCookie = response.headers['set-cookie'];
    const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME);
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME);
  });

  it('POST /auth/refresh devuelve 401 si no existe refresh cookie', async () => {
    // Arrange
    // sin cookie

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });

  it('POST /auth/refresh devuelve 403 si falta header CSRF con cookie de sesión', async () => {
    // Arrange
    await registerTestPlayer(app);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });
    const refreshCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME,
    );
    const csrfCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME,
    );

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME]: refreshCookie?.value ?? '',
        [TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME]: csrfCookie?.value ?? '',
      },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it('POST /auth/refresh devuelve 401 si se reutiliza un refresh token ya rotado', async () => {
    // Arrange
    await registerTestPlayer(app);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });
    const refreshCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME,
    );
    const csrfCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME,
    );
    const firstRefresh = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME]: refreshCookie?.value ?? '',
        [TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME]: csrfCookie?.value ?? '',
      },
      headers: {
        [TEST_SERVER_CONFIG.AUTH_CSRF_HEADER_NAME]: csrfCookie?.value ?? '',
      },
    });
    expect(firstRefresh.statusCode).toBe(200);

    // Act
    const reusedToken = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME]: refreshCookie?.value ?? '',
        [TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME]: csrfCookie?.value ?? '',
      },
      headers: {
        [TEST_SERVER_CONFIG.AUTH_CSRF_HEADER_NAME]: csrfCookie?.value ?? '',
      },
    });

    // Assert
    expect(reusedToken.statusCode).toBe(401);
  });

  it('GET /auth/session devuelve 200 usando access cookie', async () => {
    // Arrange
    await registerTestPlayer(app);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });
    const accessCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME,
    );

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/auth/session',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME]: accessCookie?.value ?? '',
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      playerId: expect.any(String),
      role: 'USER',
    });
  });

  it('POST /auth/logout devuelve 204 y limpia cookies', async () => {
    // Arrange
    await registerTestPlayer(app);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ana@example.com', password: 'mipassword123' },
    });
    const accessCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME,
    );
    const csrfCookie = login.cookies.find(
      (cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME,
    );

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: {
        [TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME]: accessCookie?.value ?? '',
        [TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME]: csrfCookie?.value ?? '',
      },
      headers: {
        [TEST_SERVER_CONFIG.AUTH_CSRF_HEADER_NAME]: csrfCookie?.value ?? '',
      },
    });

    // Assert
    expect(response.statusCode).toBe(204);
    const setCookie = response.headers['set-cookie'];
    const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
    expect(cookiesAsText).toContain(`${TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME}=`);
    expect(cookiesAsText).toContain(`${TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME}=`);
    expect(cookiesAsText).toContain(`${TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME}=`);
  });

  it('GET /auth/csrf devuelve 200 y setea cookie CSRF', async () => {
    // Arrange
    // sin preparación adicional

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/auth/csrf',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      csrfToken: expect.any(String),
    });
    const setCookie = response.headers['set-cookie'];
    const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
    expect(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_CSRF_COOKIE_NAME);
  });
});
