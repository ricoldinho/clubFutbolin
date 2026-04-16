"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const teams_routes_1 = require("@/adapters/http/teams/teams.routes");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const buildCreateTeamUseCase_1 = require("../../../../doubles/buildCreateTeamUseCase");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const Player_entity_1 = require("@/domain/players/Player.entity");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
/** Jugadores fijos para POST /teams (CreateTeam exige al menos 2 ids existentes). */
const PLAYER_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PLAYER_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function teamCreatePayload(name) {
    return { name, playerIds: [PLAYER_1, PLAYER_2] };
}
async function seedSeasonAndTwoPlayers(deps) {
    const leagueId = LeagueId_value_object_1.LeagueId.generate();
    await deps.seasonRepository.save(Season_entity_1.Season.create({
        id: SeasonId_value_object_1.SeasonId.generate(),
        year: 2026,
        leagueId,
    }));
    const p1 = Player_entity_1.Player.create({
        id: PlayerId_value_object_1.PlayerId.fromString(PLAYER_1),
        name: 'Juan',
        lastname: 'Uno',
        nickname: null,
        email: Email_value_object_1.Email.create('teams-route-p1@test.local'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000001'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2000-01-01'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    });
    const p2 = Player_entity_1.Player.create({
        id: PlayerId_value_object_1.PlayerId.fromString(PLAYER_2),
        name: 'Pedro',
        lastname: 'Dos',
        nickname: null,
        email: Email_value_object_1.Email.create('teams-route-p2@test.local'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000002'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2001-02-02'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    });
    await deps.playerRepository.save(p1, 'x');
    await deps.playerRepository.save(p2, 'x');
}
function buildServer() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
    const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
    const rosterRepository = new InMemoryRosterRepository_1.InMemoryRosterRepository();
    const playerRepository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
        teamRepository: repository,
        seasonRepository,
        rosterRepository,
        playerRepository,
    });
    app.register(teams_routes_1.teamsRoutes, {
        repository,
        rosterRepository,
        jwtService,
        createTeam,
    });
    return {
        app,
        jwtService,
        repository,
        seasonRepository,
        rosterRepository,
        playerRepository,
        createTeam,
    };
}
async function adminHeaders(jwtService) {
    const token = await jwtService.sign({ sub: 'admin-uuid', role: 'ADMIN' });
    return { Authorization: `Bearer ${token}` };
}
(0, vitest_1.describe)('teams routes', () => {
    let server;
    let jwtService;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildServer();
        server = built.app;
        jwtService = built.jwtService;
        await seedSeasonAndTwoPlayers(built);
        await server.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await server.close();
    });
    (0, vitest_1.it)('GET /teams devuelve 200 y lista vacía cuando no hay equipos', async () => {
        const response = await server.inject({ method: 'GET', url: '/teams' });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({
            data: [],
            meta: { total: 0, page: 1, lastPage: 0 },
        });
    });
    (0, vitest_1.it)('devuelve 400 en GET /teams cuando q supera 100 caracteres', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/teams?q=${encodeURIComponent('a'.repeat(101))}`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
    });
    (0, vitest_1.it)('GET /teams con q filtra por nombre', async () => {
        const headers = await adminHeaders(jwtService);
        await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Zeta'),
        });
        await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Otro Club'),
        });
        const response = await server.inject({
            method: 'GET',
            url: '/teams?q=Zeta',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.meta.total).toBe(1);
        (0, vitest_1.expect)(body.data).toHaveLength(1);
        (0, vitest_1.expect)(body.data[0].name).toBe('Equipo Zeta');
    });
    (0, vitest_1.it)('POST /teams requiere admin y devuelve 201', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Alpha'),
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        const body = response.json();
        (0, vitest_1.expect)(body.name).toBe('Equipo Alpha');
        (0, vitest_1.expect)(body.id).toBeDefined();
    });
    (0, vitest_1.it)('POST /teams devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/teams',
            payload: teamCreatePayload('Equipo'),
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('GET /teams/by-name/:name devuelve 200 cuando existe', async () => {
        const headers = await adminHeaders(jwtService);
        await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Beta'),
        });
        const response = await server.inject({
            method: 'GET',
            url: '/teams/by-name/Equipo%20Beta',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toMatchObject({ name: 'Equipo Beta' });
    });
    (0, vitest_1.it)('GET /teams/by-name/:name devuelve 404 cuando no existe', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/teams/by-name/NoExiste',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('PATCH /teams/:teamId actualiza y requiere admin', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Original'),
        });
        const created = createRes.json();
        const patchRes = await server.inject({
            method: 'PATCH',
            url: `/teams/${created.id}`,
            headers,
            payload: { name: 'Equipo Modificado' },
        });
        (0, vitest_1.expect)(patchRes.statusCode).toBe(200);
        (0, vitest_1.expect)(patchRes.json()).toMatchObject({ name: 'Equipo Modificado' });
    });
    (0, vitest_1.it)('DELETE /teams/:teamId elimina y requiere admin', async () => {
        const headers = await adminHeaders(jwtService);
        const createRes = await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo ToDelete'),
        });
        const created = createRes.json();
        const deleteRes = await server.inject({
            method: 'DELETE',
            url: `/teams/${created.id}`,
            headers,
        });
        (0, vitest_1.expect)(deleteRes.statusCode).toBe(204);
    });
    (0, vitest_1.it)('POST /teams devuelve 409 cuando el nombre ya existe', async () => {
        const headers = await adminHeaders(jwtService);
        await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Duplicado'),
        });
        const response = await server.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Duplicado'),
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
    });
    (0, vitest_1.it)('PATCH /teams/:teamId devuelve 404 cuando no existe', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'PATCH',
            url: '/teams/123e4567-e89b-12d3-a456-426614174000',
            headers,
            payload: { name: 'Cualquier' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('DELETE /teams/:teamId devuelve 404 cuando no existe', async () => {
        const headers = await adminHeaders(jwtService);
        const response = await server.inject({
            method: 'DELETE',
            url: '/teams/123e4567-e89b-12d3-a456-426614174000',
            headers,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
});
(0, vitest_1.describe)('teams routes - errores de infraestructura', () => {
    (0, vitest_1.it)('GET /teams devuelve 500 cuando falla findAll', async () => {
        const built = buildServer();
        await seedSeasonAndTwoPlayers(built);
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findAll').mockRejectedValue(new Error('infra findAll'));
        const response = await built.app.inject({ method: 'GET', url: '/teams' });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('POST /teams devuelve 500 cuando falla save', async () => {
        const built = buildServer();
        await seedSeasonAndTwoPlayers(built);
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'save').mockRejectedValue(new Error('infra save'));
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'POST',
            url: '/teams',
            headers,
            payload: teamCreatePayload('Equipo Infra'),
        });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('GET /teams/by-name/:name devuelve 500 cuando falla findByName', async () => {
        const built = buildServer();
        await seedSeasonAndTwoPlayers(built);
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findByName').mockRejectedValue(new Error('infra findByName'));
        const response = await built.app.inject({
            method: 'GET',
            url: '/teams/by-name/Equipo',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('PATCH /teams/:teamId devuelve 500 cuando falla findById', async () => {
        const built = buildServer();
        await seedSeasonAndTwoPlayers(built);
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'PATCH',
            url: '/teams/123e4567-e89b-12d3-a456-426614174000',
            headers,
            payload: { name: 'Equipo X' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('DELETE /teams/:teamId devuelve 500 cuando falla findById', async () => {
        const built = buildServer();
        await seedSeasonAndTwoPlayers(built);
        await built.app.ready();
        vitest_1.vi.spyOn(built.repository, 'findById').mockRejectedValue(new Error('infra findById'));
        const headers = await adminHeaders(built.jwtService);
        const response = await built.app.inject({
            method: 'DELETE',
            url: '/teams/123e4567-e89b-12d3-a456-426614174000',
            headers,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
});
