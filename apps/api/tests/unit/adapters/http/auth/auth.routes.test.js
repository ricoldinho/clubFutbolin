"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const auth_routes_1 = require("@/adapters/http/auth/auth.routes");
const players_routes_1 = require("@/adapters/http/players/players.routes");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
const TEST_JWT_REFRESH_EXPIRES = '14d';
const TEST_SERVER_CONFIG = {
    PORT: 3000,
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    JWT_SECRET: TEST_JWT_SECRET,
    JWT_EXPIRES_IN: TEST_JWT_EXPIRES,
    JWT_REFRESH_EXPIRES_IN: TEST_JWT_REFRESH_EXPIRES,
    CORS_ORIGINS: '*',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    AUTH_RATE_LIMIT_MAX: 2,
    AUTH_RATE_LIMIT_WINDOW_MS: 60000,
    AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
    AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
    AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
    AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
    AUTH_COOKIE_SAME_SITE: 'lax',
    AUTH_COOKIE_SECURE: false,
};
function buildApp() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    app.decorate('config', TEST_SERVER_CONFIG);
    const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
    const passwordHasher = new FakePasswordHasher_1.FakePasswordHasher();
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    app.register(cookie_1.default);
    app.register(rate_limit_1.default, {
        max: TEST_SERVER_CONFIG.RATE_LIMIT_MAX,
        timeWindow: TEST_SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    app.register(auth_routes_1.authRoutes, { repository, passwordHasher, jwtService });
    app.register(players_routes_1.playersRoutes, { repository, passwordHasher, jwtService });
    return { app, repository, passwordHasher, jwtService };
}
const registerTestPlayer = async (app) => {
    await app.inject({
        method: 'POST',
        url: '/players',
        payload: {
            name: 'Ana',
            lastname: 'García',
            nickname: null,
            email: 'ana@example.com',
            phoneNumber: '600111222',
            birthdate: '1995-05-05',
            category: 'PRIMERA',
            password: 'mipassword123',
        },
    });
};
(0, vitest_1.describe)('auth routes', () => {
    let app;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildApp();
        app = built.app;
        await app.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await app.close();
    });
    (0, vitest_1.it)('POST /auth/login devuelve 200 con cookies de sesión cuando las credenciales son correctas', async () => {
        // Arrange
        await registerTestPlayer(app);
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'mipassword123' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toMatchObject({
            playerId: vitest_1.expect.any(String),
            role: 'USER',
            expiresIn: TEST_JWT_EXPIRES,
        });
        const setCookie = response.headers['set-cookie'];
        const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
        (0, vitest_1.expect)(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME);
        (0, vitest_1.expect)(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME);
    });
    (0, vitest_1.it)('POST /auth/login devuelve 401 cuando la contraseña es incorrecta', async () => {
        // Arrange
        await registerTestPlayer(app);
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'wrongpassword' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(401);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.any(String) });
    });
    (0, vitest_1.it)('POST /auth/login devuelve 401 cuando el email no existe', async () => {
        // Arrange
        // (sin jugador registrado)
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'noexiste@example.com', password: 'anypass' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('POST /auth/login devuelve 400 cuando el body es inválido (sin email)', async () => {
        // Arrange
        // body incompleto
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { password: 'secret' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
    });
    (0, vitest_1.it)('POST /auth/login devuelve 500 cuando el repositorio lanza (infra error)', async () => {
        // Arrange
        const throwingRepo = {
            findByEmail: async () => null,
            findById: async () => null,
            findAll: (async () => []),
            findLoginDataByEmail: async () => {
                throw new Error('DB connection lost');
            },
            save: async () => { },
            delete: async () => { },
        };
        const appWithFailingRepo = (0, fastify_1.default)({ logger: false }).withTypeProvider();
        appWithFailingRepo.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
        appWithFailingRepo.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
        appWithFailingRepo.decorate('config', TEST_SERVER_CONFIG);
        appWithFailingRepo.register(cookie_1.default);
        appWithFailingRepo.register(rate_limit_1.default, {
            max: TEST_SERVER_CONFIG.RATE_LIMIT_MAX,
            timeWindow: TEST_SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
        });
        const passwordHasher = new FakePasswordHasher_1.FakePasswordHasher();
        const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
        appWithFailingRepo.register(auth_routes_1.authRoutes, {
            repository: throwingRepo,
            passwordHasher,
            jwtService,
        });
        await appWithFailingRepo.ready();
        // Act
        const response = await appWithFailingRepo.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'any@example.com', password: 'any' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await appWithFailingRepo.close();
    });
    (0, vitest_1.it)('POST /auth/login devuelve 429 cuando se supera el rate limit de login', async () => {
        // Arrange
        await registerTestPlayer(app);
        // Act
        const first = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'wrongpassword' },
        });
        const second = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'wrongpassword' },
        });
        const third = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'wrongpassword' },
        });
        // Assert
        (0, vitest_1.expect)(first.statusCode).toBe(401);
        (0, vitest_1.expect)(second.statusCode).toBe(401);
        (0, vitest_1.expect)(third.statusCode).toBe(429);
    });
    (0, vitest_1.it)('POST /auth/refresh devuelve 200 y rota cookies cuando la refresh cookie es válida', async () => {
        // Arrange
        await registerTestPlayer(app);
        const login = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'mipassword123' },
        });
        const refreshCookie = login.cookies.find((cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME);
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/refresh',
            cookies: {
                [TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME]: refreshCookie?.value ?? '',
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toMatchObject({
            playerId: vitest_1.expect.any(String),
            role: 'USER',
            expiresIn: TEST_JWT_EXPIRES,
        });
        const setCookie = response.headers['set-cookie'];
        const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
        (0, vitest_1.expect)(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME);
        (0, vitest_1.expect)(cookiesAsText).toContain(TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME);
    });
    (0, vitest_1.it)('POST /auth/refresh devuelve 401 si no existe refresh cookie', async () => {
        // Arrange
        // sin cookie
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/refresh',
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('GET /auth/session devuelve 200 usando access cookie', async () => {
        // Arrange
        await registerTestPlayer(app);
        const login = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'mipassword123' },
        });
        const accessCookie = login.cookies.find((cookie) => cookie.name === TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME);
        // Act
        const response = await app.inject({
            method: 'GET',
            url: '/auth/session',
            cookies: {
                [TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME]: accessCookie?.value ?? '',
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toMatchObject({
            playerId: vitest_1.expect.any(String),
            role: 'USER',
        });
    });
    (0, vitest_1.it)('POST /auth/logout devuelve 204 y limpia cookies', async () => {
        // Arrange
        await registerTestPlayer(app);
        await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'ana@example.com', password: 'mipassword123' },
        });
        // Act
        const response = await app.inject({
            method: 'POST',
            url: '/auth/logout',
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(204);
        const setCookie = response.headers['set-cookie'];
        const cookiesAsText = Array.isArray(setCookie) ? setCookie.join(' ') : setCookie;
        (0, vitest_1.expect)(cookiesAsText).toContain(`${TEST_SERVER_CONFIG.AUTH_ACCESS_COOKIE_NAME}=`);
        (0, vitest_1.expect)(cookiesAsText).toContain(`${TEST_SERVER_CONFIG.AUTH_REFRESH_COOKIE_NAME}=`);
    });
});
