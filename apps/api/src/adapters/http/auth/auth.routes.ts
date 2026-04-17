import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { decodeJwt } from 'jose';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import type { IRefreshTokenSessionRepository } from '@/application/ports/auth/RefreshTokenSession.repository';
import { LoginPlayer } from '@/application/use-cases/players/LoginPlayer.use-case';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAuth } from '@/adapters/http/auth/auth-plugin';
import {
  loginBodySchema,
  type LoginBody,
} from '@/adapters/http/players/schemas';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface AuthRoutesOptions extends FastifyPluginOptions {
  repository?: IPlayerRepository;
  passwordHasher?: IPasswordHasher;
  jwtService?: IJwtService;
  loginPlayer?: LoginPlayer;
  refreshTokenSessionRepository?: IRefreshTokenSessionRepository;
  authRateLimitMax?: number;
  authRateLimitWindowMs?: number;
}

const authSessionResponseSchema = z.object({
  playerId: z.string(),
  role: z.string(),
});

const loginResponseSchema = z.object({
  playerId: z.string(),
  role: z.string(),
  expiresIn: z.string(),
});

const refreshResponseSchema = loginResponseSchema;
const csrfResponseSchema = z.object({
  csrfToken: z.string(),
});

const cookieSameSiteMap = {
  lax: 'lax',
  strict: 'strict',
  none: 'none',
} as const;

/**
 * POST /auth/login
 * Body: { email, password }. Responde 200 con datos de sesión y setea cookies httpOnly.
 */
export async function authRoutes(
  server: FastifyInstance,
  options: AuthRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const cookieSameSite =
    cookieSameSiteMap[server.config.AUTH_COOKIE_SAME_SITE.toLowerCase() as 'lax' | 'strict' | 'none'] ??
    'lax';

  const resolveLoginPlayer = (request: FastifyRequest) =>
    options.loginPlayer ??
    (options.repository && options.passwordHasher && options.jwtService
      ? new LoginPlayer(options.repository, options.passwordHasher, options.jwtService)
      : request.container.cradle.loginPlayer);
  const resolveJwtService = (request: FastifyRequest) =>
    options.jwtService ?? request.container.cradle.jwtService;
  const resolveRefreshTokenSessionRepository = (request: FastifyRequest) =>
    options.refreshTokenSessionRepository ?? request.container.cradle.refreshTokenSessionRepository;

  const resolveTokenExpiryDate = (token: string): Date => {
    const decoded = decodeJwt(token);
    if (typeof decoded.exp !== 'number') {
      return new Date(Date.now() + server.config.AUTH_REFRESH_COOKIE_MAX_AGE_SEC * 1000);
    }
    return new Date(decoded.exp * 1000);
  };

  const setAuthCookies = (
    reply: {
      setCookie: (
        name: string,
        value: string,
        options: {
          httpOnly: boolean;
          secure: boolean;
          sameSite: 'lax' | 'strict' | 'none';
          path: string;
          maxAge: number;
        },
      ) => void;
    },
    input: { accessToken: string; refreshToken: string; csrfToken: string },
  ) => {
    reply.setCookie(server.config.AUTH_ACCESS_COOKIE_NAME, input.accessToken, {
      httpOnly: true,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
      path: '/',
      maxAge: server.config.AUTH_ACCESS_COOKIE_MAX_AGE_SEC,
    });
    reply.setCookie(server.config.AUTH_REFRESH_COOKIE_NAME, input.refreshToken, {
      httpOnly: true,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
      path: '/',
      maxAge: server.config.AUTH_REFRESH_COOKIE_MAX_AGE_SEC,
    });
    reply.setCookie(server.config.AUTH_CSRF_COOKIE_NAME, input.csrfToken, {
      // double-submit token: debe ser legible por JS para enviarse en header.
      httpOnly: false,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
      path: '/',
      maxAge: server.config.AUTH_REFRESH_COOKIE_MAX_AGE_SEC,
    });
  };

  const clearAuthCookies = (reply: {
    clearCookie: (
      name: string,
      options: { path: string; httpOnly: boolean; secure: boolean; sameSite: 'lax' | 'strict' | 'none' },
    ) => void;
  }) => {
    reply.clearCookie(server.config.AUTH_ACCESS_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
    });
    reply.clearCookie(server.config.AUTH_REFRESH_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
    });
    reply.clearCookie(server.config.AUTH_CSRF_COOKIE_NAME, {
      path: '/',
      httpOnly: false,
      secure: server.config.AUTH_COOKIE_SECURE,
      sameSite: cookieSameSite,
    });
  };

  const authRateLimitMax = options.authRateLimitMax ?? server.config.AUTH_RATE_LIMIT_MAX;
  const authRateLimitWindowMs =
    options.authRateLimitWindowMs ?? server.config.AUTH_RATE_LIMIT_WINDOW_MS;
  const loginRateLimitStore = new Map<string, { count: number; resetAt: number }>();

  const requireCsrfWithSessionCookies = async (request: FastifyRequest, reply: FastifyReply) => {
    const accessCookie = request.cookies?.[server.config.AUTH_ACCESS_COOKIE_NAME];
    const refreshCookie = request.cookies?.[server.config.AUTH_REFRESH_COOKIE_NAME];
    if (!accessCookie && !refreshCookie) {
      return;
    }
    const csrfCookie = request.cookies?.[server.config.AUTH_CSRF_COOKIE_NAME];
    const csrfHeaderRaw = request.headers[server.config.AUTH_CSRF_HEADER_NAME.toLowerCase()];
    const csrfHeader = Array.isArray(csrfHeaderRaw) ? csrfHeaderRaw[0] : csrfHeaderRaw;
    if (
      typeof csrfCookie !== 'string'
      || csrfCookie.length === 0
      || typeof csrfHeader !== 'string'
      || csrfHeader.length === 0
      || csrfHeader !== csrfCookie
    ) {
      return reply.code(403).send({ message: 'CSRF token inválido o ausente' });
    }
  };

  const enforceLoginAttemptRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Partial<LoginBody> | undefined;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const key = `${request.ip}:${email || 'anonymous'}`;
    const now = Date.now();
    const current = loginRateLimitStore.get(key);
    if (!current || current.resetAt <= now) {
      loginRateLimitStore.set(key, { count: 1, resetAt: now + authRateLimitWindowMs });
      return;
    }
    if (current.count >= authRateLimitMax) {
      return reply.code(429).send({ message: 'Too Many Requests' });
    }
    current.count += 1;
  };

  /**
   * GET /auth/csrf
   *
   * Emite (o re-emite) un token CSRF para el patrón double-submit cookie.
   * - 200: token disponible
   */
  zodServer.get(
    '/auth/csrf',
    {
      schema: {
        response: {
          200: csrfResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Emitir token CSRF',
      },
    },
    async (_request, reply) => {
      const csrfToken = randomUUID();
      reply.setCookie(server.config.AUTH_CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        secure: server.config.AUTH_COOKIE_SECURE,
        sameSite: cookieSameSite,
        path: '/',
        maxAge: server.config.AUTH_REFRESH_COOKIE_MAX_AGE_SEC,
      });
      return reply.code(200).send({ csrfToken });
    },
  );

  zodServer.post(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Login de player',
      },
      preHandler: enforceLoginAttemptRateLimit,
    },
    async (request, reply) => {
      try {
        const loginPlayer = resolveLoginPlayer(request);
        const body = request.body as LoginBody;
        const result = await loginPlayer.execute({
          email: Email.create(body.email),
          password: body.password,
        });

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 500)
            .send({ message });
        }

        const jwtService = resolveJwtService(request);
        const csrfToken = randomUUID();
        const refreshJti = randomUUID();
        const refreshFamily = randomUUID();
        const refreshToken = await jwtService.sign(
          {
            sub: result.value.playerId,
            role: result.value.role,
            tokenType: 'refresh',
            jti: refreshJti,
            tokenFamily: refreshFamily,
          },
          { expiresIn: server.config.JWT_REFRESH_EXPIRES_IN },
        );
        await resolveRefreshTokenSessionRepository(request).create({
          jti: refreshJti,
          family: refreshFamily,
          playerId: result.value.playerId,
          expiresAt: resolveTokenExpiryDate(refreshToken),
        });
        setAuthCookies(reply, { accessToken: result.value.token, refreshToken, csrfToken });

        return reply.code(200).send({
          playerId: result.value.playerId,
          role: result.value.role,
          expiresIn: result.value.expiresIn,
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado en login');
        }
        return reply
          .code(statusCode as 400 | 401 | 500)
          .send({ message });
      }
    },
  );

  /**
   * POST /auth/refresh
   *
   * Renueva sesión leyendo la refresh cookie. Rota refresh token y emite nueva access cookie.
   * - 200: sesión renovada
   * - 401: refresh token inválido o ausente
   */
  zodServer.post(
    '/auth/refresh',
    {
      preHandler: requireCsrfWithSessionCookies,
      schema: {
        response: {
          200: refreshResponseSchema,
          401: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Renovar sesión con refresh cookie',
        security: [{ sessionCookie: [] }, { csrfHeader: [] }],
      },
    },
    async (request, reply) => {
      try {
        const jwtService = resolveJwtService(request);
        const refreshToken = request.cookies?.[server.config.AUTH_REFRESH_COOKIE_NAME];
        if (!refreshToken) {
          return reply.code(401).send({ message: 'Refresh token requerido' });
        }

        const refreshPayload = await jwtService.verify(refreshToken, 'refresh');
        if (
          refreshPayload === null
          || refreshPayload.jti === null
          || refreshPayload.tokenFamily === null
        ) {
          clearAuthCookies(reply);
          return reply.code(401).send({ message: 'Refresh token inválido o caducado' });
        }
        const refreshSessions = resolveRefreshTokenSessionRepository(request);
        const storedSession = await refreshSessions.findByJti(refreshPayload.jti);
        if (
          storedSession === null
          || storedSession.revokedAt !== null
          || storedSession.replacedByJti !== null
        ) {
          await refreshSessions.revokeFamily(refreshPayload.tokenFamily);
          clearAuthCookies(reply);
          return reply.code(401).send({ message: 'Refresh token inválido o reutilizado' });
        }
        if (storedSession.expiresAt.getTime() <= Date.now()) {
          await refreshSessions.revokeByJti(refreshPayload.jti);
          clearAuthCookies(reply);
          return reply.code(401).send({ message: 'Refresh token inválido o caducado' });
        }

        const accessToken = await jwtService.sign({
          sub: refreshPayload.sub,
          role: refreshPayload.role,
          tokenType: 'access',
        });
        const csrfToken = randomUUID();
        const nextRefreshJti = randomUUID();
        const rotatedRefreshToken = await jwtService.sign(
          {
            sub: refreshPayload.sub,
            role: refreshPayload.role,
            tokenType: 'refresh',
            jti: nextRefreshJti,
            tokenFamily: refreshPayload.tokenFamily,
          },
          { expiresIn: server.config.JWT_REFRESH_EXPIRES_IN },
        );
        await refreshSessions.rotate(
          refreshPayload.jti,
          nextRefreshJti,
          resolveTokenExpiryDate(rotatedRefreshToken),
        );
        setAuthCookies(reply, { accessToken, refreshToken: rotatedRefreshToken, csrfToken });

        return reply.code(200).send({
          playerId: refreshPayload.sub,
          role: refreshPayload.role,
          expiresIn: jwtService.getExpiresIn(),
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado en refresh');
        }
        return reply.code(statusCode as 401 | 500).send({ message });
      }
    },
  );

  /**
   * POST /auth/logout
   *
   * Cierra sesión eliminando cookies de autenticación.
   * - 204: logout idempotente
   */
  zodServer.post(
    '/auth/logout',
    {
      preHandler: requireCsrfWithSessionCookies,
      schema: {
        response: {
          204: z.null(),
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Cerrar sesión y limpiar cookies',
        security: [{ sessionCookie: [] }, { csrfHeader: [] }],
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies?.[server.config.AUTH_REFRESH_COOKIE_NAME];
      if (refreshToken) {
        const jwtService = resolveJwtService(request);
        const refreshPayload = await jwtService.verify(refreshToken, 'refresh');
        if (refreshPayload?.tokenFamily) {
          await resolveRefreshTokenSessionRepository(request).revokeFamily(refreshPayload.tokenFamily);
        } else if (refreshPayload?.jti) {
          await resolveRefreshTokenSessionRepository(request).revokeByJti(refreshPayload.jti);
        }
      }
      clearAuthCookies(reply);
      return reply.code(204).send(null);
    },
  );

  /**
   * GET /auth/session
   *
   * Devuelve la identidad autenticada a partir de la access cookie.
   * - 200: sesión válida
   * - 401: no autenticado
   */
  zodServer.get(
    '/auth/session',
    {
      preHandler: async (request, reply) => {
        const requireAuth = createRequireAuth(resolveJwtService(request));
        await requireAuth(request, reply);
      },
      schema: {
        response: {
          200: authSessionResponseSchema,
          401: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Obtener sesión autenticada actual',
        security: [{ sessionCookie: [] }],
      },
    },
    async (request, reply) => {
      return reply.code(200).send({
        playerId: request.user!.playerId,
        role: request.user!.role,
      });
    },
  );
}
