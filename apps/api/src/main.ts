import Fastify, { type FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
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
import { registerOpenApi } from './adapters/http/register-openapi';
import { options } from './shared/config/env';
import { buildContainer } from './shared/di/container';
import { registerRequestScope } from './shared/di/request-scope';

export async function buildServer() {
  let prisma: PrismaClient | undefined;
  try {
    const server = Fastify({
      logger: true,
    }).withTypeProvider<ZodTypeProvider>();

    server.setValidatorCompiler(validatorCompiler);
    server.setSerializerCompiler(serializerCompiler);

    // 1. Cargar config (incluye .env) antes de crear Prisma
    await server.register(fastifyEnv, options);

    await registerOpenApi(server);

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL no está definida. Copia .env.example a .env en la raíz del monorepo (o en apps/api) y define DATABASE_URL.',
      );
    }
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
    const container = buildContainer({ prisma, config: server.config });
    server.decorate('container', container);
    await server.register(registerRequestScope);

    server.addHook('onClose', async () => {
      await prisma!.$disconnect();
    });

    // 2. Rutas HTTP
    await server.register(authRoutes);
    await server.register(playersRoutes);
    await server.register(leaguesRoutes);
    await server.register(teamsRoutes);
    await server.register(seasonsRoutes);
    await server.register(rostersRoutes);

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
          summary: 'Healthcheck',
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
