import Fastify, { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import { options } from "./shared/config/env";

const server: FastifyInstance = Fastify({
  logger: true, // Usaremos la config luego para el nivel de log
});

const start = async () => {
  try {
    // 1. REGISTRO DE CONFIGURACIÓN (Primero que nada)
    // Usamos await porque fastify-env necesita leer el disco y validar.
    await server.register(fastifyEnv, options);

    // Ahora TypeScript sabe que server.config existe y qué propiedades tiene.
    // Fíjate que server.config.PORT es un 'number', no un 'string'.
    const port = server.config.PORT;

    // 2. RUTAS (Ejemplo temporal)
    server.get("/", async (request, reply) => {
      // Podemos acceder a la config desde cualquier parte
      return {
        status: "OK",
        env: server.config.NODE_ENV,
      };
    });

    // 3. INICIO DEL SERVIDOR
    await server.listen({ port });
    console.log(`🚀 Server running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
