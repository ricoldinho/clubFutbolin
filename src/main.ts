import Fastify, { type FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaPlayerRepository } from "./adapters/persistence/players/PrismaPlayerRepository";
import { BcryptPasswordHasher } from "./adapters/auth/BcryptPasswordHasher";
import { JoseJwtService } from "./adapters/auth/JoseJwtService";
import { playersRoutes } from "./adapters/http/players/players.routes";
import { authRoutes } from "./adapters/http/auth/auth.routes";
import { options } from "./shared/config/env";

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

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL no está definida. Añádela a .env (ver .env.example)."
      );
    }
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
    const playerRepository = new PrismaPlayerRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JoseJwtService(
      server.config.JWT_SECRET,
      server.config.JWT_EXPIRES_IN,
    );

    server.addHook("onClose", async () => {
      await prisma!.$disconnect();
    });

    // 2. Rutas HTTP
    await server.register(authRoutes, {
      repository: playerRepository,
      passwordHasher,
      jwtService,
    });
    await server.register(playersRoutes, {
      repository: playerRepository,
      passwordHasher,
      jwtService,
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
