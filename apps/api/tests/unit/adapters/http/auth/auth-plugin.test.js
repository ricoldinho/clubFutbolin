"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const vitest_1 = require("vitest");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const SECRET = 'plugin-test-secret';
const EXPIRES = '1h';
const TEST_SERVER_CONFIG = {
    PORT: 3000,
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    JWT_SECRET: SECRET,
    JWT_EXPIRES_IN: EXPIRES,
    JWT_REFRESH_EXPIRES_IN: '14d',
    CORS_ORIGINS: '*',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    AUTH_RATE_LIMIT_MAX: 5,
    AUTH_RATE_LIMIT_WINDOW_MS: 60000,
    AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
    AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
    AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
    AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
    AUTH_COOKIE_SAME_SITE: 'lax',
    AUTH_COOKIE_SECURE: false,
};
const buildApp = async () => {
    const app = (0, fastify_1.default)({ logger: false });
    app.decorate('config', TEST_SERVER_CONFIG);
    await app.register(cookie_1.default);
    return app;
};
(0, vitest_1.describe)('createRequireAuth', () => {
    const jwtService = new JoseJwtService_1.JoseJwtService(SECRET, EXPIRES);
    const requireAuth = (0, auth_plugin_1.createRequireAuth)(jwtService);
    (0, vitest_1.it)('responde 401 cuando no hay header Authorization', async () => {
        const app = await buildApp();
        app.addHook('preHandler', requireAuth);
        app.get('/protected', async () => ({ ok: true }));
        const response = await app.inject({
            method: 'GET',
            url: '/protected',
            headers: {},
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
        (0, vitest_1.expect)(response.json()).toMatchObject({
            message: 'Token de autenticación requerido',
        });
    });
    (0, vitest_1.it)('responde 401 cuando Authorization no empieza por Bearer ', async () => {
        const app = await buildApp();
        app.addHook('preHandler', requireAuth);
        app.get('/protected', async () => ({ ok: true }));
        const response = await app.inject({
            method: 'GET',
            url: '/protected',
            headers: { authorization: 'Basic xyz' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('responde 401 cuando el token es inválido', async () => {
        const app = await buildApp();
        app.addHook('preHandler', requireAuth);
        app.get('/protected', async () => ({ ok: true }));
        const response = await app.inject({
            method: 'GET',
            url: '/protected',
            headers: { authorization: 'Bearer invalid.token.here' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
        (0, vitest_1.expect)(response.json()).toMatchObject({
            message: 'Token inválido o caducado',
        });
    });
    (0, vitest_1.it)('adjunta request.user y deja pasar cuando el token es válido', async () => {
        const token = await jwtService.sign({
            sub: 'player-uuid-123',
            role: 'USER',
        });
        const app = await buildApp();
        app.addHook('preHandler', requireAuth);
        app.get('/protected', async (request) => {
            return { playerId: request.user.playerId, role: request.user.role };
        });
        const response = await app.inject({
            method: 'GET',
            url: '/protected',
            headers: { authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ playerId: 'player-uuid-123', role: 'USER' });
    });
    (0, vitest_1.it)('acepta token de acceso desde cookie cuando no hay header Authorization', async () => {
        // Arrange
        const token = await jwtService.sign({
            sub: 'player-cookie-1',
            role: 'USER',
            tokenType: 'access',
        });
        const app = await buildApp();
        app.addHook('preHandler', requireAuth);
        app.get('/protected', async (request) => ({ playerId: request.user.playerId }));
        // Act
        const response = await app.inject({
            method: 'GET',
            url: '/protected',
            cookies: {
                [TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME]: token,
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ playerId: 'player-cookie-1' });
    });
});
(0, vitest_1.describe)('createRequireAdmin', () => {
    const jwtService = new JoseJwtService_1.JoseJwtService(SECRET, EXPIRES);
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(jwtService);
    (0, vitest_1.it)('responde 403 cuando el token es de USER', async () => {
        const token = await jwtService.sign({ sub: 'player-1', role: 'USER' });
        const app = await buildApp();
        app.addHook('preHandler', requireAdmin);
        app.get('/admin-only', async () => ({ ok: true }));
        const response = await app.inject({
            method: 'GET',
            url: '/admin-only',
            headers: { authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(403);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('administrador') });
    });
    (0, vitest_1.it)('deja pasar cuando el token es de ADMIN', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const app = await buildApp();
        app.addHook('preHandler', requireAdmin);
        app.get('/admin-only', async (request) => ({ role: request.user.role }));
        const response = await app.inject({
            method: 'GET',
            url: '/admin-only',
            headers: { authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ role: 'ADMIN' });
    });
});
