"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const seasons_routes_1 = require("@/adapters/http/seasons/seasons.routes");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
function buildServer() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
    const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    app.register(seasons_routes_1.seasonsRoutes, {
        repository: seasonRepo,
        leagueRepository: leagueRepo,
        teamRepository: teamRepo,
        jwtService,
    });
    return { app, jwtService, leagueRepo, seasonRepo, teamRepo };
}
async function adminHeaders(jwtService) {
    const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
    return { Authorization: `Bearer ${token}` };
}
(0, vitest_1.describe)('seasons routes', () => {
    let server;
    let jwtService;
    let leagueId;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildServer();
        server = built.app;
        jwtService = built.jwtService;
        leagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Test', leagueCategory: 'PRIMERA' }));
        await server.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await server.close();
    });
    (0, vitest_1.it)('GET /seasons devuelve 200 y lista vacía', async () => {
        const response = await server.inject({ method: 'GET', url: '/seasons' });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({
            data: [],
            meta: { total: 0, page: 1, lastPage: 0 },
        });
    });
    (0, vitest_1.it)('POST /seasons requiere admin y devuelve 201', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2025, leagueId: leagueId.value },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        const body = response.json();
        (0, vitest_1.expect)(body.year).toBe(2025);
        (0, vitest_1.expect)(body.leagueId).toBe(leagueId.value);
        (0, vitest_1.expect)(body.id).toBeDefined();
    });
    (0, vitest_1.it)('POST /seasons devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/seasons',
            payload: { year: 2025, leagueId: leagueId.value },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('GET /seasons/:seasonId devuelve 200 cuando existe', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2025, leagueId: leagueId.value },
        });
        const created = createRes.json();
        const getRes = await server.inject({ method: 'GET', url: `/seasons/${created.id}` });
        (0, vitest_1.expect)(getRes.statusCode).toBe(200);
        (0, vitest_1.expect)(getRes.json()).toMatchObject({ year: 2025 });
    });
    (0, vitest_1.it)('GET /seasons/:seasonId devuelve 404 cuando no existe', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/seasons/123e4567-e89b-12d3-a456-426614174000',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/winners requiere admin y devuelve 200', async () => {
        const built = buildServer();
        await built.app.ready();
        const newLeagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({ id: newLeagueId, name: 'Liga W', leagueCategory: 'PRO' }));
        const createSeason = new CreateSeason_use_case_1.CreateSeason(built.seasonRepo, built.leagueRepo);
        const seasonRes = await createSeason.execute({ year: 2025, leagueId: newLeagueId });
        if (!seasonRes.ok)
            throw new Error('Expected season create');
        const team1 = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'Campeón');
        const team2 = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'Subcampeón');
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'PATCH',
            url: `/seasons/${seasonRes.value.id.value}/winners`,
            headers,
            payload: {
                championId: team1.id.value,
                secondId: team2.id.value,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.championId).toBe(team1.id.value);
        (0, vitest_1.expect)(body.secondId).toBe(team2.id.value);
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/winners devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'PATCH',
            url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
            payload: {
                championId: '123e4567-e89b-12d3-a456-426614174000',
                secondId: '123e4567-e89b-12d3-a456-426614174001',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/winners devuelve 404 cuando temporada no existe', async () => {
        const built = buildServer();
        await built.app.ready();
        const t1 = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'T1');
        const t2 = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'T2');
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'PATCH',
            url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
            headers,
            payload: {
                championId: t1.id.value,
                secondId: t2.id.value,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('POST /seasons devuelve 404 cuando la liga no existe', async () => {
        const headers = await adminHeaders(jwtService);
        const fakeLeagueId = '123e4567-e89b-12d3-a456-426614174099';
        const response = await server.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2030, leagueId: fakeLeagueId },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('POST /seasons devuelve 409 cuando ya existe temporada con mismo año en la liga', async () => {
        const headers = await adminHeaders(jwtService);
        await server.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2028, leagueId: leagueId.value },
        });
        const response = await server.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2028, leagueId: leagueId.value },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('año') });
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/winners devuelve 400 cuando campeón y subcampeón son el mismo', async () => {
        const built = buildServer();
        await built.app.ready();
        const newLeagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({ id: newLeagueId, name: 'Liga S', leagueCategory: 'PRO' }));
        const createSeason = new CreateSeason_use_case_1.CreateSeason(built.seasonRepo, built.leagueRepo);
        const seasonRes = await createSeason.execute({ year: 2026, leagueId: newLeagueId });
        if (!seasonRes.ok)
            throw new Error('Expected season');
        const solo = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'Solo Uno');
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'PATCH',
            url: `/seasons/${seasonRes.value.id.value}/winners`,
            headers,
            payload: {
                championId: solo.id.value,
                secondId: solo.id.value,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('diferentes') });
    });
});
(0, vitest_1.describe)('seasons routes - errores de infraestructura', () => {
    (0, vitest_1.it)('GET /seasons devuelve 500 cuando falla findAll', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.seasonRepo, 'findAll').mockRejectedValue(new Error('infra findAll'));
        // Act
        const response = await built.app.inject({ method: 'GET', url: '/seasons' });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('POST /seasons devuelve 500 cuando falla findByLeagueId', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        const headers = await adminHeaders(built.jwtService);
        const existingLeagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({
            id: existingLeagueId,
            name: 'Liga Infra',
            leagueCategory: 'PRIMERA',
        }));
        vitest_1.vi.spyOn(built.seasonRepo, 'findByLeagueId').mockRejectedValue(new Error('infra findByLeagueId'));
        // Act
        const response = await built.app.inject({
            method: 'POST',
            url: '/seasons',
            headers,
            payload: { year: 2035, leagueId: existingLeagueId.value },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('GET /seasons/:seasonId devuelve 500 cuando falla findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        vitest_1.vi.spyOn(built.seasonRepo, 'findById').mockRejectedValue(new Error('infra findById'));
        // Act
        const response = await built.app.inject({
            method: 'GET',
            url: '/seasons/123e4567-e89b-12d3-a456-426614174000',
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/winners devuelve 500 cuando falla findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        const headers = await adminHeaders(built.jwtService);
        vitest_1.vi.spyOn(built.seasonRepo, 'findById').mockRejectedValue(new Error('infra findById'));
        // Act
        const response = await built.app.inject({
            method: 'PATCH',
            url: '/seasons/123e4567-e89b-12d3-a456-426614174000/winners',
            headers,
            payload: {
                championId: '123e4567-e89b-12d3-a456-426614174001',
                secondId: '123e4567-e89b-12d3-a456-426614174002',
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
});
