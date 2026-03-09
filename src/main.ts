import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { options } from "./shared/config/env";

const server = Fastify({
  logger: true, // Usaremos la config luego para el nivel de log
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
    // 1. REGISTRO DE CONFIGURACIÓN (Primero que nada)
    // Usamos await porque fastify-env necesita leer el disco y validar.
    await server.register(fastifyEnv, options);

    // Ahora TypeScript sabe que server.config existe y qué propiedades tiene.
    // Fíjate que server.config.PORT es un 'number', no un 'string'.
    const port = server.config.PORT;

    // 2. RUTAS (Ejemplo temporal)
    server.get("/", async (_request, _reply) => {
      // Podemos acceder a la config desde cualquier parte
      return {
        status: "OK",
        env: server.config.NODE_ENV,
      };
    });

    // 3. INICIO DEL SERVIDOR
    await server.listen({ port });
    server.log.info({ port }, 'Server running');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
