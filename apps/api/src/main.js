"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const env_1 = __importDefault(require("@fastify/env"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const players_routes_1 = require("./adapters/http/players/players.routes");
const auth_routes_1 = require("./adapters/http/auth/auth.routes");
const leagues_routes_1 = require("./adapters/http/leagues/leagues.routes");
const teams_routes_1 = require("./adapters/http/teams/teams.routes");
const seasons_routes_1 = require("./adapters/http/seasons/seasons.routes");
const rosters_routes_1 = require("./adapters/http/rosters/rosters.routes");
const matches_routes_1 = require("./adapters/http/matches/matches.routes");
const register_openapi_1 = require("./adapters/http/register-openapi");
const env_2 = require("./shared/config/env");
const container_1 = require("./shared/di/container");
const request_scope_1 = require("./shared/di/request-scope");
const parseCorsOrigins = (value) => value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
async function buildServer() {
    let prisma;
    try {
        const server = (0, fastify_1.default)({
            logger: true,
        }).withTypeProvider();
        server.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
        server.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
        // 1. Cargar config (incluye .env) antes de crear Prisma
        await server.register(env_1.default, env_2.options);
        await server.register(cookie_1.default);
        if (server.config.NODE_ENV === 'production' &&
            env_2.INSECURE_JWT_SECRETS.has(server.config.JWT_SECRET)) {
            throw new Error('JWT_SECRET inseguro en producción. Define un secreto robusto mediante variables de entorno.');
        }
        const corsOrigins = parseCorsOrigins(server.config.CORS_ORIGINS);
        const allowAllOrigins = corsOrigins.includes('*');
        await server.register(cors_1.default, {
            origin: (origin, callback) => {
                if (allowAllOrigins || origin === undefined || corsOrigins.includes(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error(`Origin "${origin}" no permitida por CORS`), false);
            },
            credentials: true,
        });
        await server.register(helmet_1.default, {
            // Swagger UI inyecta scripts inline; CSP estricta aquí rompería /documentation.
            contentSecurityPolicy: false,
        });
        await server.register(rate_limit_1.default, {
            max: server.config.RATE_LIMIT_MAX,
            timeWindow: server.config.RATE_LIMIT_WINDOW_MS,
        });
        const requestStartTimes = new WeakMap();
        const httpMetrics = {
            totalRequests: 0,
            total4xx: 0,
            total5xx: 0,
            totalLatencyMs: 0,
        };
        server.addHook('onRequest', async (request, reply) => {
            requestStartTimes.set(request, Date.now());
            reply.header('x-request-id', request.id);
        });
        server.addHook('onResponse', async (request, reply) => {
            const startedAt = requestStartTimes.get(request) ?? Date.now();
            const elapsedMs = Date.now() - startedAt;
            httpMetrics.totalRequests += 1;
            httpMetrics.totalLatencyMs += elapsedMs;
            if (reply.statusCode >= 500) {
                httpMetrics.total5xx += 1;
            }
            else if (reply.statusCode >= 400) {
                httpMetrics.total4xx += 1;
            }
        });
        await (0, register_openapi_1.registerOpenApi)(server);
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL no está definida. Copia .env.example a .env en la raíz del monorepo (o en apps/api) y define DATABASE_URL.');
        }
        const adapter = new adapter_pg_1.PrismaPg({ connectionString });
        prisma = new client_1.PrismaClient({ adapter });
        const prismaClient = prisma;
        const container = (0, container_1.buildContainer)({ prisma: prismaClient, config: server.config });
        server.decorate('container', container);
        await server.register(request_scope_1.registerRequestScope);
        server.addHook('onClose', async () => {
            await prismaClient.$disconnect();
        });
        // 2. Rutas HTTP
        await server.register(auth_routes_1.authRoutes);
        await server.register(players_routes_1.playersRoutes);
        await server.register(leagues_routes_1.leaguesRoutes);
        await server.register(teams_routes_1.teamsRoutes);
        await server.register(seasons_routes_1.seasonsRoutes);
        await server.register(rosters_routes_1.rostersRoutes);
        await server.register(matches_routes_1.matchesRoutes);
        server.withTypeProvider().get('/health', {
            schema: {
                response: {
                    200: zod_1.z.object({
                        status: zod_1.z.literal('OK'),
                        env: zod_1.z.string(),
                    }),
                },
                tags: ['health'],
                summary: 'Healthcheck',
            },
        }, async () => ({
            status: 'OK',
            env: server.config.NODE_ENV,
        }));
        server.withTypeProvider().get('/ready', {
            schema: {
                response: {
                    200: zod_1.z.object({
                        status: zod_1.z.literal('READY'),
                        db: zod_1.z.literal('up'),
                    }),
                    503: zod_1.z.object({
                        status: zod_1.z.literal('NOT_READY'),
                        db: zod_1.z.literal('down'),
                    }),
                },
                tags: ['health'],
                summary: 'Readiness check de API y base de datos',
            },
        }, async (request, reply) => {
            try {
                await prismaClient.$queryRawUnsafe('SELECT 1');
                return reply.code(200).send({ status: 'READY', db: 'up' });
            }
            catch (error) {
                request.log.error({ err: error }, 'Readiness DB check failed');
                return reply.code(503).send({ status: 'NOT_READY', db: 'down' });
            }
        });
        server.withTypeProvider().get('/metrics', {
            schema: {
                response: {
                    200: zod_1.z.object({
                        totalRequests: zod_1.z.number().int().nonnegative(),
                        total4xx: zod_1.z.number().int().nonnegative(),
                        total5xx: zod_1.z.number().int().nonnegative(),
                        avgLatencyMs: zod_1.z.number().nonnegative(),
                    }),
                },
                tags: ['health'],
                summary: 'Métricas básicas HTTP en memoria',
            },
        }, async () => ({
            totalRequests: httpMetrics.totalRequests,
            total4xx: httpMetrics.total4xx,
            total5xx: httpMetrics.total5xx,
            avgLatencyMs: httpMetrics.totalRequests === 0
                ? 0
                : Number((httpMetrics.totalLatencyMs / httpMetrics.totalRequests).toFixed(2)),
        }));
        // Compatibilidad retro: mantener la raíz como alias de health.
        server.withTypeProvider().get('/', {
            schema: {
                response: {
                    200: zod_1.z.object({
                        status: zod_1.z.literal('OK'),
                        env: zod_1.z.string(),
                    }),
                },
                tags: ['health'],
                summary: 'Healthcheck (legacy)',
            },
        }, async () => ({
            status: 'OK',
            env: server.config.NODE_ENV,
        }));
        return server;
    }
    catch (err) {
        if (prisma) {
            try {
                await prisma.$disconnect();
            }
            catch {
                // ignoramos errores al cerrar en fallo de arranque
            }
        }
        throw err;
    }
}
async function start() {
    let server;
    try {
        server = await buildServer();
        const port = server.config.PORT;
        await server.listen({ port });
        server.log.info({ port }, 'Server running');
    }
    catch (err) {
        // En producción queremos loguear y terminar el proceso
        // eslint-disable-next-line no-console
        console.error(err);
        if (server) {
            try {
                await server.close();
            }
            catch (closeErr) {
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
