import Fastify, { type FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPlayerRepository } from "./adapters/persistence/players/PrismaPlayerRepository";
import { playersRoutes } from "./adapters/http/players/players.routes";
import { options } from "./shared/config/env";

export async function buildServer() {
  let prisma: PrismaClient | undefined;
  try {
    prisma = new PrismaClient();
    const playerRepository = new PrismaPlayerRepository(prisma);

    const server = Fastify({
      logger: true,
    }).withTypeProvider<ZodTypeProvider>();

    server.setValidatorCompiler(validatorCompiler);
    server.setSerializerCompiler(serializerCompiler);

    // Cerrar Prisma cuando Fastify se apaga (evita fugas de conexiones)
    if (prisma) {
      server.addHook("onClose", async () => {
        await prisma!.$disconnect();
      });
    }

    // 1. REGISTRO DE CONFIGURACIÓN (Primero que nada)
    await server.register(fastifyEnv, options);

    // 2. Rutas HTTP
    await server.register(playersRoutes, {
      repository: playerRepository,
    });

    // Healthcheck básico
    server.get("/", async (_request, _reply) => {
      return {
        status: "OK",
        env: server.config.NODE_ENV,
      };
    });

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
    server.log.info({ port }, "Server running");
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

if (process.env.NODE_ENV !== "test") {
  void start();
}
