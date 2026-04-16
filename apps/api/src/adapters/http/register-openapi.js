"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOpenApi = registerOpenApi;
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
/**
 * Registra OpenAPI (@fastify/swagger) y Swagger UI (@fastify/swagger-ui).
 * Debe llamarse **antes** de registrar las rutas que definen `schema`, para que la spec los incluya.
 * La transformación Zod → JSON Schema usa `jsonSchemaTransform` (incluye skipList por defecto para `/documentation/*`).
 */
async function registerOpenApi(server) {
    await server.register(swagger_1.default, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'clubFutbolin API',
                description: 'API REST del club: jugadores, autenticación JWT, ligas, equipos, temporadas y rosters.',
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
                    sessionCookie: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'clubfutbolin_at',
                    },
                },
            },
        },
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    await server.register(swagger_ui_1.default, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });
}
