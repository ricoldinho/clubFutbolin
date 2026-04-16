"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const leagues_routes_1 = require("@/adapters/http/leagues/leagues.routes");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
function buildServer() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
    const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository(seasonRepository);
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    app.register(leagues_routes_1.leaguesRoutes, { repository, seasonRepository, jwtService });
    return { app, jwtService, repository, seasonRepository };
}
async function adminHeaders(jwtService) {
    const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
    return { Authorization: `Bearer ${token}` };
}
(0, vitest_1.describe)('leagues routes', () => {
    let server;
    let jwtService;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildServer();
        server = built.app;
        jwtService = built.jwtService;
        await server.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await server.close();
    });
    (0, vitest_1.it)('GET /leagues devuelve 200 y lista vacía cuando no hay ligas', async () => {
        const response = await server.inject({ method: 'GET', url: '/leagues' });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({
            data: [],
            meta: { total: 0, page: 1, lastPage: 0 },
        });
    });
    (0, vitest_1.it)('POST /leagues requiere admin y devuelve 201', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Provincial', leagueCategory: 'PRIMERA' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        const body = response.json();
        (0, vitest_1.expect)(body.name).toBe('Liga Provincial');
        (0, vitest_1.expect)(body.leagueCategory).toBe('PRIMERA');
        (0, vitest_1.expect)(body.id).toBeDefined();
        (0, vitest_1.expect)(body.initialSeason.id).toBeDefined();
        (0, vitest_1.expect)(body.initialSeason.year).toBe(new Date().getFullYear());
        (0, vitest_1.expect)(body.initialSeason.leagueId).toBe(body.id);
    });
    (0, vitest_1.it)('POST /leagues devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/leagues',
            payload: { name: 'Liga', leagueCategory: 'ELITE' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('POST /leagues devuelve 403 con token USER', async () => {
        const token = await jwtService.sign({ sub: 'user-1', role: 'USER' });
        const response = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers: { Authorization: `Bearer ${token}` },
            payload: { name: 'Liga', leagueCategory: 'ELITE' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(403);
    });
    (0, vitest_1.it)('POST /leagues crea automáticamente la season inicial de la liga', async () => {
        // Arrange
        const headers = await adminHeaders(jwtService);
        // Act
        const createResponse = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Con Season', leagueCategory: 'MASTER' },
        });
        const created = createResponse.json();
        const seasonsResponse = await server.inject({
            method: 'GET',
            url: `/leagues/${created.id}/seasons`,
        });
        // Assert
        (0, vitest_1.expect)(createResponse.statusCode).toBe(201);
        (0, vitest_1.expect)(seasonsResponse.statusCode).toBe(200);
        (0, vitest_1.expect)(seasonsResponse.json()).toMatchObject({
            data: [
                {
                    year: new Date().getFullYear(),
                    leagueId: created.id,
                },
            ],
        });
    });
    (0, vitest_1.it)('GET /leagues/:leagueId devuelve 200 cuando existe', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga A', leagueCategory: 'PRO' },
        });
        const created = createRes.json();
        const getRes = await server.inject({
            method: 'GET',
            url: `/leagues/${created.id}`,
        });
        (0, vitest_1.expect)(getRes.statusCode).toBe(200);
        (0, vitest_1.expect)(getRes.json()).toMatchObject({ name: 'Liga A', leagueCategory: 'PRO' });
    });
    (0, vitest_1.it)('GET /leagues/:leagueId devuelve 404 cuando no existe', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('PATCH /leagues/:leagueId actualiza y requiere admin', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Original', leagueCategory: 'TERCERA' },
        });
        const created = createRes.json();
        const patchRes = await server.inject({
            method: 'PATCH',
            url: `/leagues/${created.id}`,
            headers,
            payload: { name: 'Liga Modificada' },
        });
        (0, vitest_1.expect)(patchRes.statusCode).toBe(200);
        (0, vitest_1.expect)(patchRes.json()).toMatchObject({ name: 'Liga Modificada', leagueCategory: 'TERCERA' });
    });
    (0, vitest_1.it)('DELETE /leagues/:leagueId devuelve 400 si la liga ya tiene seasons', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga ToDelete', leagueCategory: 'CUARTA' },
        });
        const created = createRes.json();
        const deleteRes = await server.inject({
            method: 'DELETE',
            url: `/leagues/${created.id}`,
            headers,
        });
        (0, vitest_1.expect)(deleteRes.statusCode).toBe(400);
    });
    (0, vitest_1.it)('DELETE /leagues/:leagueId devuelve 404 cuando la liga no existe', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'DELETE',
            url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
            headers,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('PATCH /leagues/:leagueId con leagueCategory actualiza categoría', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Cat', leagueCategory: 'TERCERA' },
        });
        const created = createRes.json();
        const patchRes = await server.inject({
            method: 'PATCH',
            url: `/leagues/${created.id}`,
            headers,
            payload: { name: 'Liga Cat', leagueCategory: 'ELITE' },
        });
        (0, vitest_1.expect)(patchRes.statusCode).toBe(200);
        (0, vitest_1.expect)(patchRes.json()).toMatchObject({ leagueCategory: 'ELITE' });
    });
    (0, vitest_1.it)('GET /leagues/:leagueId con UUID inválido devuelve 400', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/leagues/no-es-uuid',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
    });
    (0, vitest_1.it)('POST /leagues devuelve 409 cuando el nombre ya existe', async () => {
        const headers = await adminHeaders(jwtService);
        await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Duplicada', leagueCategory: 'PRIMERA' },
        });
        const response = await server.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Duplicada', leagueCategory: 'ELITE' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('Liga Duplicada') });
    });
});
(0, vitest_1.describe)('leagues routes - errores de infraestructura', () => {
    (0, vitest_1.it)('GET /leagues devuelve 500 cuando falla el repositorio', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findAll').mockRejectedValue(new Error('infra findAll'));
        // Act
        const response = await built.app.inject({ method: 'GET', url: '/leagues' });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('POST /leagues devuelve 500 cuando falla save', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'save').mockRejectedValue(new Error('infra save'));
        const headers = await adminHeaders(built.jwtService);
        // Act
        const response = await built.app.inject({
            method: 'POST',
            url: '/leagues',
            headers,
            payload: { name: 'Liga Infra', leagueCategory: 'PRIMERA' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('GET /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
        // Act
        const response = await built.app.inject({
            method: 'GET',
            url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('PATCH /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
        const headers = await adminHeaders(built.jwtService);
        // Act
        const response = await built.app.inject({
            method: 'PATCH',
            url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
            headers,
            payload: { name: 'Liga X' },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('DELETE /leagues/:leagueId devuelve 500 cuando falla findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
        const headers = await adminHeaders(built.jwtService);
        // Act
        const response = await built.app.inject({
            method: 'DELETE',
            url: '/leagues/123e4567-e89b-12d3-a456-426614174000',
            headers,
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
});
