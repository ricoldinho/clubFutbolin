import Fastify, { type FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { playersRoutes } from './adapters/http/players/players.routes';
import { authRoutes } from './adapters/http/auth/auth.routes';
import { leaguesRoutes } from './adapters/http/leagues/leagues.routes';
import { teamsRoutes } from './adapters/http/teams/teams.routes';
import { seasonsRoutes } from './adapters/http/seasons/seasons.routes';
import { rostersRoutes } from './adapters/http/rosters/rosters.routes';
import { matchesRoutes } from './adapters/http/matches/matches.routes';
import { registerOpenApi } from './adapters/http/register-openapi';
import { INSECURE_JWT_SECRETS, options } from './shared/config/env';
import { buildContainer } from './shared/di/container';
import { registerRequestScope } from './shared/di/request-scope';

const parseCorsOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

interface HttpMetrics {
  totalRequests: number;
  total4xx: number;
  total5xx: number;
  totalLatencyMs: number;
}

export async function buildServer() {
  let prisma: PrismaClient | undefined;
  try {
    const server = Fastify({
      logger: true,
      trustProxy: process.env.TRUST_PROXY === 'true',
    }).withTypeProvider<ZodTypeProvider>();

    server.setValidatorCompiler(validatorCompiler);
    server.setSerializerCompiler(serializerCompiler);

    // 1. Cargar config (incluye .env) antes de crear Prisma
    await server.register(fastifyEnv, options);
    await server.register(fastifyCookie);
    if (
      server.config.NODE_ENV === 'production' &&
      INSECURE_JWT_SECRETS.has(server.config.JWT_SECRET)
    ) {
      throw new Error(
        'JWT_SECRET inseguro en producción. Define un secreto robusto mediante variables de entorno.',
      );
    }
    if (server.config.NODE_ENV === 'production' && !server.config.AUTH_COOKIE_SECURE) {
      throw new Error(
        'AUTH_COOKIE_SECURE debe ser true en producción para proteger cookies de sesión bajo HTTPS.',
      );
    }

    const corsOrigins = parseCorsOrigins(server.config.CORS_ORIGINS);
    const allowAllOrigins = corsOrigins.includes('*');

    await server.register(fastifyCors, {
      origin: (origin, callback) => {
        if (allowAllOrigins || origin === undefined || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin "${origin}" no permitida por CORS`), false);
      },
      credentials: true,
    });

    await server.register(fastifyHelmet, {
      xFrameOptions: {
        action: 'deny',
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    });

    await server.register(fastifyRateLimit, {
      max: server.config.RATE_LIMIT_MAX,
      timeWindow: server.config.RATE_LIMIT_WINDOW_MS,
    });

    const requestStartTimes = new WeakMap<object, number>();
    const httpMetrics: HttpMetrics = {
      totalRequests: 0,
      total4xx: 0,
      total5xx: 0,
      totalLatencyMs: 0,
    };

    server.addHook('onRequest', async (request, reply) => {
      requestStartTimes.set(request, Date.now());
      reply.header('x-request-id', request.id);
    });

    server.addHook('preHandler', async (request, reply) => {
      const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
      if (!isStateChangingMethod) {
        return;
      }

      const accessCookie = request.cookies?.[server.config.AUTH_ACCESS_COOKIE_NAME];
      const refreshCookie = request.cookies?.[server.config.AUTH_REFRESH_COOKIE_NAME];
      const hasSessionCookies = Boolean(accessCookie || refreshCookie);
      if (!hasSessionCookies) {
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
    });

    server.addHook('onResponse', async (request, reply) => {
      const startedAt = requestStartTimes.get(request) ?? Date.now();
      const elapsedMs = Date.now() - startedAt;
      httpMetrics.totalRequests += 1;
      httpMetrics.totalLatencyMs += elapsedMs;
      if (reply.statusCode >= 500) {
        httpMetrics.total5xx += 1;
      } else if (reply.statusCode >= 400) {
        httpMetrics.total4xx += 1;
      }
    });

    await registerOpenApi(server);

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL no está definida. Copia .env.example a .env en la raíz del monorepo (o en apps/api) y define DATABASE_URL.',
      );
    }
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
    const prismaClient = prisma;
    const container = buildContainer({ prisma: prismaClient, config: server.config });
    server.decorate('container', container);
    await server.register(registerRequestScope);

    server.addHook('onClose', async () => {
      await prismaClient.$disconnect();
    });

    // 2. Rutas HTTP
    await server.register(authRoutes);
    await server.register(playersRoutes);
    await server.register(leaguesRoutes);
    await server.register(teamsRoutes);
    await server.register(seasonsRoutes);
    await server.register(rostersRoutes);
    await server.register(matchesRoutes);

    server.withTypeProvider<ZodTypeProvider>().get(
      '/health',
      {
        schema: {
          response: {
            200: z.object({
              status: z.literal('OK'),
              env: z.string(),
            }),
          },
          tags: ['health'],
          summary: 'Healthcheck',
        },
      },
      async () => ({
        status: 'OK' as const,
        env: server.config.NODE_ENV,
      }),
    );

    server.withTypeProvider<ZodTypeProvider>().get(
      '/ready',
      {
        schema: {
          response: {
            200: z.object({
              status: z.literal('READY'),
              db: z.literal('up'),
            }),
            503: z.object({
              status: z.literal('NOT_READY'),
              db: z.literal('down'),
            }),
          },
          tags: ['health'],
          summary: 'Readiness check de API y base de datos',
        },
      },
      async (request, reply) => {
        try {
          await prismaClient.$queryRawUnsafe('SELECT 1');
          return reply.code(200).send({ status: 'READY' as const, db: 'up' as const });
        } catch (error) {
          request.log.error({ err: error }, 'Readiness DB check failed');
          return reply.code(503).send({ status: 'NOT_READY' as const, db: 'down' as const });
        }
      },
    );

    server.withTypeProvider<ZodTypeProvider>().get(
      '/metrics',
      {
        schema: {
          response: {
            200: z.object({
              totalRequests: z.number().int().nonnegative(),
              total4xx: z.number().int().nonnegative(),
              total5xx: z.number().int().nonnegative(),
              avgLatencyMs: z.number().nonnegative(),
            }),
          },
          tags: ['health'],
          summary: 'Métricas básicas HTTP en memoria',
        },
      },
      async () => ({
        totalRequests: httpMetrics.totalRequests,
        total4xx: httpMetrics.total4xx,
        total5xx: httpMetrics.total5xx,
        avgLatencyMs:
          httpMetrics.totalRequests === 0
            ? 0
            : Number((httpMetrics.totalLatencyMs / httpMetrics.totalRequests).toFixed(2)),
      }),
    );

    // Compatibilidad retro: mantener la raíz como alias de health.
    server.withTypeProvider<ZodTypeProvider>().get(
      '/',
      {
        schema: {
          response: {
            200: z.object({
              status: z.literal('OK'),
              env: z.string(),
            }),
          },
          tags: ['health'],
          summary: 'Healthcheck (legacy)',
        },
      },
      async () => ({
        status: 'OK' as const,
        env: server.config.NODE_ENV,
      }),
    );

    return server;
  } catch (err) {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {
        // ignoramos errores al cerrar en fallo de arranque
      }
    }
    throw err;
  }
}

async function start() {
  let server: FastifyInstance | undefined;
  try {
    server = await buildServer();
    const port = server.config.PORT;
    await server.listen({ port });
    server.log.info({ port }, 'Server running');
  } catch (err) {
    // En producción queremos loguear y terminar el proceso
    // eslint-disable-next-line no-console
    console.error(err);
    if (server) {
      try {
        await server.close();
      } catch (closeErr) {
        // eslint-disable-next-line no-console
        console.error(closeErr);
      }
    }
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  void start();
}
