import type { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/**
 * Registra OpenAPI (@fastify/swagger) y Swagger UI (@fastify/swagger-ui).
 * Debe llamarse **antes** de registrar las rutas que definen `schema`, para que la spec los incluya.
 * La transformación Zod → JSON Schema usa `jsonSchemaTransform` (incluye skipList por defecto para `/documentation/*`).
 */
export async function registerOpenApi(server: FastifyInstance): Promise<void> {
  await server.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'clubFutbolin API',
        description:
          'API REST del club: jugadores, autenticación JWT, ligas, equipos, temporadas y rosters.',
        version: '1.0.0',
      },
      servers: [{ url: '/', description: 'Servidor actual (misma origen que la API)' }],
      tags: [
        { name: 'health', description: 'Estado del servicio' },
        { name: 'auth', description: 'Login y token JWT' },
        { name: 'players', description: 'Registro y gestión de jugadores' },
        { name: 'leagues', description: 'Ligas' },
        { name: 'teams', description: 'Equipos' },
        { name: 'seasons', description: 'Temporadas' },
        { name: 'rosters', description: 'Plantillas por temporada' },
        { name: 'matches', description: 'Partidos y calendario de temporada' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await server.register(fastifySwaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
