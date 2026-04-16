"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const rosters_routes_1 = require("@/adapters/http/rosters/rosters.routes");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const result_1 = require("@/shared/result");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
function buildServer() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
    const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
    const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    app.register(rosters_routes_1.rostersRoutes, {
        repository: rosterRepo,
        teamRepository: teamRepo,
        seasonRepository: seasonRepo,
        jwtService,
    });
    return { app, jwtService, rosterRepo, teamRepo, seasonRepo, leagueRepo };
}
(0, vitest_1.describe)('rosters routes', () => {
    let server;
    let jwtService;
    let teamId;
    let seasonId;
    let teamSeasonId;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildServer();
        server = built.app;
        jwtService = built.jwtService;
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga R', leagueCategory: 'ELITE' }));
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'Equipo R');
        teamId = team.id.value;
        const seasonResult = await new CreateSeason_use_case_1.CreateSeason(built.seasonRepo, built.leagueRepo).execute({
            year: 2026,
            leagueId,
        });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        seasonId = seasonResult.value.id.value;
        const regResult = await new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(built.rosterRepo, built.teamRepo, built.seasonRepo).execute({ teamId: team.id, seasonId: seasonResult.value.id });
        if (!(0, result_1.isOk)(regResult))
            throw new Error('Expected register');
        teamSeasonId = regResult.value.teamSeasonId.value;
        await server.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await server.close();
    });
    (0, vitest_1.it)('POST /rosters/register devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/rosters/register',
            payload: { teamId, seasonId },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            payload: {
                playerId: '123e4567-e89b-12d3-a456-426614174000',
                position: 'PORTERO',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('POST /rosters/register devuelve 403 con token USER', async () => {
        const token = await jwtService.sign({ sub: 'user-1', role: 'USER' });
        const response = await server.inject({
            method: 'POST',
            url: '/rosters/register',
            headers: { Authorization: `Bearer ${token}` },
            payload: { teamId, seasonId },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(403);
    });
    (0, vitest_1.it)('POST /rosters/register devuelve 201 con admin cuando equipo y temporada existen', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const built = buildServer();
        await built.app.ready();
        const newLeagueId = LeagueId_value_object_1.LeagueId.generate();
        await built.leagueRepo.save(League_entity_1.League.create({ id: newLeagueId, name: 'Liga 2027', leagueCategory: 'ELITE' }));
        const teamRes = await (0, saveTeamInMemory_1.saveTeamInMemory)(built.teamRepo, 'Nuevo Equipo Reg');
        const createSeason = new CreateSeason_use_case_1.CreateSeason(built.seasonRepo, built.leagueRepo);
        const seasonRes = await createSeason.execute({ year: 2027, leagueId: newLeagueId });
        if (!(0, result_1.isOk)(seasonRes))
            throw new Error('Expected season');
        const response = await built.app.inject({
            method: 'POST',
            url: '/rosters/register',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
                teamId: teamRes.id.value,
                seasonId: seasonRes.value.id.value,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        const body = response.json();
        (0, vitest_1.expect)(body.teamSeasonId).toBeDefined();
        (0, vitest_1.expect)(body.teamId).toBe(teamRes.id.value);
        (0, vitest_1.expect)(body.membersCount).toBe(0);
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 200 con admin', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const playerId = '123e4567-e89b-12d3-a456-426614174000';
        const response = await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { playerId, position: 'PORTERO' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.membersCount).toBe(1);
    });
    (0, vitest_1.it)('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'DELETE',
            url: `/rosters/${teamSeasonId}/players/123e4567-e89b-12d3-a456-426614174000`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 200 con admin', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const playerId = '123e4567-e89b-12d3-a456-426614174001';
        await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { playerId, position: 'DELANTERO' },
        });
        const response = await server.inject({
            method: 'DELETE',
            url: `/rosters/${teamSeasonId}/players/${playerId}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.membersCount).toBe(0);
    });
    (0, vitest_1.it)('POST /rosters/register devuelve 404 cuando el equipo no existe', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const fakeTeamId = '123e4567-e89b-12d3-a456-426614174099';
        const response = await server.inject({
            method: 'POST',
            url: '/rosters/register',
            headers: { Authorization: `Bearer ${token}` },
            payload: { teamId: fakeTeamId, seasonId },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('POST /rosters/register devuelve 409 cuando ya está inscrito', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'POST',
            url: '/rosters/register',
            headers: { Authorization: `Bearer ${token}` },
            payload: { teamId, seasonId },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('inscrito') });
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 404 cuando roster no existe', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const fakeTsId = '123e4567-e89b-12d3-a456-426614174099';
        const response = await server.inject({
            method: 'POST',
            url: `/rosters/${fakeTsId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { playerId: '123e4567-e89b-12d3-a456-426614174000', position: 'PORTERO' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 400 cuando jugador duplicado', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const playerId = '123e4567-e89b-12d3-a456-426614174010';
        await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { playerId, position: 'PORTERO' },
        });
        const response = await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { playerId, position: 'DELANTERO' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('plantilla') });
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 400 cuando plantilla llena (max 4)', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const ids = [
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
            '123e4567-e89b-12d3-a456-426614174003',
            '123e4567-e89b-12d3-a456-426614174004',
        ];
        for (let i = 0; i < 4; i++) {
            await server.inject({
                method: 'POST',
                url: `/rosters/${teamSeasonId}/players`,
                headers: { Authorization: `Bearer ${token}` },
                payload: {
                    playerId: ids[i],
                    position: i === 0 ? 'PORTERO' : 'DELANTERO',
                },
            });
        }
        const response = await server.inject({
            method: 'POST',
            url: `/rosters/${teamSeasonId}/players`,
            headers: { Authorization: `Bearer ${token}` },
            payload: {
                playerId: '123e4567-e89b-12d3-a456-426614174005',
                position: 'DELANTERO',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('4 jugadores') });
    });
    (0, vitest_1.it)('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 400 cuando jugador no está en plantilla', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const playerNotInRoster = '123e4567-e89b-12d3-a456-426614174099';
        const response = await server.inject({
            method: 'DELETE',
            url: `/rosters/${teamSeasonId}/players/${playerNotInRoster}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toMatchObject({ message: vitest_1.expect.stringContaining('plantilla') });
    });
    (0, vitest_1.it)('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 404 cuando roster no existe', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const fakeTsId = '123e4567-e89b-12d3-a456-426614174099';
        const response = await server.inject({
            method: 'DELETE',
            url: `/rosters/${fakeTsId}/players/123e4567-e89b-12d3-a456-426614174000`,
            headers: { Authorization: `Bearer ${token}` },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
    });
});
(0, vitest_1.describe)('rosters routes - errores de infraestructura', () => {
    (0, vitest_1.it)('POST /rosters/register devuelve 500 cuando falla findById de team', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        const token = await built.jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        vitest_1.vi.spyOn(built.teamRepo, 'findById').mockRejectedValue(new Error('infra team findById'));
        // Act
        const response = await built.app.inject({
            method: 'POST',
            url: '/rosters/register',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
                teamId: '123e4567-e89b-12d3-a456-426614174010',
                seasonId: '123e4567-e89b-12d3-a456-426614174011',
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('POST /rosters/:teamSeasonId/players devuelve 500 cuando falla roster.findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        const token = await built.jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        vitest_1.vi.spyOn(built.rosterRepo, 'findById').mockRejectedValue(new Error('infra roster findById'));
        // Act
        const response = await built.app.inject({
            method: 'POST',
            url: '/rosters/123e4567-e89b-12d3-a456-426614174020/players',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
                playerId: '123e4567-e89b-12d3-a456-426614174021',
                position: 'PORTERO',
            },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
    (0, vitest_1.it)('DELETE /rosters/:teamSeasonId/players/:playerId devuelve 500 cuando falla roster.findById', async () => {
        // Arrange
        const built = buildServer();
        await built.app.ready();
        const token = await built.jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        vitest_1.vi.spyOn(built.rosterRepo, 'findById').mockRejectedValue(new Error('infra roster findById'));
        // Act
        const response = await built.app.inject({
            method: 'DELETE',
            url: '/rosters/123e4567-e89b-12d3-a456-426614174030/players/123e4567-e89b-12d3-a456-426614174031',
            headers: { Authorization: `Bearer ${token}` },
        });
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        await built.app.close();
    });
});
