"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const zod_1 = require("zod");
const LoginPlayer_use_case_1 = require("@/application/use-cases/players/LoginPlayer.use-case");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("@/adapters/http/players/schemas");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
const authSessionResponseSchema = zod_1.z.object({
    playerId: zod_1.z.string(),
    role: zod_1.z.string(),
});
const loginResponseSchema = zod_1.z.object({
    playerId: zod_1.z.string(),
    role: zod_1.z.string(),
    expiresIn: zod_1.z.string(),
});
const refreshResponseSchema = loginResponseSchema;
const cookieSameSiteMap = {
    lax: 'lax',
    strict: 'strict',
    none: 'none',
};
/**
 * POST /auth/login
 * Body: { email, password }. Responde 200 con datos de sesión y setea cookies httpOnly.
 */
async function authRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const cookieSameSite = cookieSameSiteMap[server.config.AUTH_COOKIE_SAME_SITE.toLowerCase()] ??
        'lax';
    const resolveLoginPlayer = (request) => options.loginPlayer ??
        (options.repository && options.passwordHasher && options.jwtService
            ? new LoginPlayer_use_case_1.LoginPlayer(options.repository, options.passwordHasher, options.jwtService)
            : request.container.cradle.loginPlayer);
    const resolveJwtService = (request) => options.jwtService ?? request.container.cradle.jwtService;
    const setAuthCookies = (reply, input) => {
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
    };
    const clearAuthCookies = (reply) => {
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
    };
    const authRateLimitMax = options.authRateLimitMax ?? server.config.AUTH_RATE_LIMIT_MAX;
    const authRateLimitWindowMs = options.authRateLimitWindowMs ?? server.config.AUTH_RATE_LIMIT_WINDOW_MS;
    zodServer.post('/auth/login', {
        schema: {
            body: schemas_1.loginBodySchema,
            response: {
                200: loginResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['auth'],
            summary: 'Login de player',
        },
        config: {
            rateLimit: {
                max: authRateLimitMax,
                timeWindow: authRateLimitWindowMs,
            },
        },
    }, async (request, reply) => {
        try {
            const loginPlayer = resolveLoginPlayer(request);
            const body = request.body;
            const result = await loginPlayer.execute({
                email: Email_value_object_1.Email.create(body.email),
                password: body.password,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            const jwtService = resolveJwtService(request);
            const refreshToken = await jwtService.sign({
                sub: result.value.playerId,
                role: result.value.role,
                tokenType: 'refresh',
            }, { expiresIn: server.config.JWT_REFRESH_EXPIRES_IN });
            setAuthCookies(reply, { accessToken: result.value.token, refreshToken });
            return reply.code(200).send({
                playerId: result.value.playerId,
                role: result.value.role,
                expiresIn: result.value.expiresIn,
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado en login');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * POST /auth/refresh
     *
     * Renueva sesión leyendo la refresh cookie. Rota refresh token y emite nueva access cookie.
     * - 200: sesión renovada
     * - 401: refresh token inválido o ausente
     */
    zodServer.post('/auth/refresh', {
        schema: {
            response: {
                200: refreshResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['auth'],
            summary: 'Renovar sesión con refresh cookie',
        },
    }, async (request, reply) => {
        try {
            const jwtService = resolveJwtService(request);
            const refreshToken = request.cookies?.[server.config.AUTH_REFRESH_COOKIE_NAME];
            if (!refreshToken) {
                return reply.code(401).send({ message: 'Refresh token requerido' });
            }
            const refreshPayload = await jwtService.verify(refreshToken, 'refresh');
            if (refreshPayload === null) {
                return reply.code(401).send({ message: 'Refresh token inválido o caducado' });
            }
            const accessToken = await jwtService.sign({
                sub: refreshPayload.sub,
                role: refreshPayload.role,
                tokenType: 'access',
            });
            const rotatedRefreshToken = await jwtService.sign({
                sub: refreshPayload.sub,
                role: refreshPayload.role,
                tokenType: 'refresh',
            }, { expiresIn: server.config.JWT_REFRESH_EXPIRES_IN });
            setAuthCookies(reply, { accessToken, refreshToken: rotatedRefreshToken });
            return reply.code(200).send({
                playerId: refreshPayload.sub,
                role: refreshPayload.role,
                expiresIn: jwtService.getExpiresIn(),
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado en refresh');
            }
            return reply.code(statusCode).send({ message });
        }
    });
    /**
     * POST /auth/logout
     *
     * Cierra sesión eliminando cookies de autenticación.
     * - 204: logout idempotente
     */
    zodServer.post('/auth/logout', {
        schema: {
            response: {
                204: zod_1.z.null(),
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['auth'],
            summary: 'Cerrar sesión y limpiar cookies',
            security: [{ sessionCookie: [] }],
        },
    }, async (_request, reply) => {
        clearAuthCookies(reply);
        return reply.code(204).send(null);
    });
    /**
     * GET /auth/session
     *
     * Devuelve la identidad autenticada a partir de la access cookie.
     * - 200: sesión válida
     * - 401: no autenticado
     */
    zodServer.get('/auth/session', {
        preHandler: async (request, reply) => {
            const requireAuth = (0, auth_plugin_1.createRequireAuth)(resolveJwtService(request));
            await requireAuth(request, reply);
        },
        schema: {
            response: {
                200: authSessionResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['auth'],
            summary: 'Obtener sesión autenticada actual',
            security: [{ sessionCookie: [] }],
        },
    }, async (request, reply) => {
        return reply.code(200).send({
            playerId: request.user.playerId,
            role: request.user.role,
        });
    });
}
