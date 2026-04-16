"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const vitest_1 = require("vitest");
const matches_routes_1 = require("@/adapters/http/matches/matches.routes");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const InMemoryMatchRepository_1 = require("../../../../doubles/InMemoryMatchRepository");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';
function buildServer() {
    const app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    const matchRepository = new InMemoryMatchRepository_1.InMemoryMatchRepository();
    const rosterRepository = new InMemoryRosterRepository_1.InMemoryRosterRepository();
    const seasonRepository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
    const teamRepository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
    const jwtService = new JoseJwtService_1.JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);
    app.register(matches_routes_1.matchesRoutes, {
        repository: matchRepository,
        rosterRepository,
        seasonRepository,
        teamRepository,
        jwtService,
    });
    return { app, matchRepository, rosterRepository, seasonRepository, teamRepository, jwtService };
}
(0, vitest_1.describe)('matches routes', () => {
    let server;
    let seasonId;
    let teamSeasonAId;
    let teamSeasonBId;
    let jwtService;
    let matchRepository;
    (0, vitest_1.beforeEach)(async () => {
        const built = buildServer();
        server = built.app;
        jwtService = built.jwtService;
        matchRepository = built.matchRepository;
        seasonId = SeasonId_value_object_1.SeasonId.generate();
        await built.seasonRepository.save(Season_entity_1.Season.create({
            id: seasonId,
            year: 2026,
            leagueId: LeagueId_value_object_1.LeagueId.generate(),
        }));
        const teamA = Team_entity_1.Team.create({ id: TeamId_value_object_1.TeamId.generate(), name: 'Team A' });
        const teamB = Team_entity_1.Team.create({ id: TeamId_value_object_1.TeamId.generate(), name: 'Team B' });
        await built.teamRepository.save(teamA);
        await built.teamRepository.save(teamB);
        teamSeasonAId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        teamSeasonBId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        await built.rosterRepository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: teamSeasonAId,
            teamId: teamA.id,
            seasonId,
        }));
        await built.rosterRepository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: teamSeasonBId,
            teamId: teamB.id,
            seasonId,
        }));
        await server.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        await server.close();
    });
    (0, vitest_1.it)('POST /seasons/:seasonId/calendar/generate devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: `/seasons/${seasonId.value}/calendar/generate`,
            payload: {},
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('POST /seasons/:seasonId/calendar/generate devuelve 201 con admin', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'POST',
            url: `/seasons/${seasonId.value}/calendar/generate`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { startDate: '2026-04-01T10:00:00.000Z' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        (0, vitest_1.expect)(response.json()).toMatchObject({ matchesCount: 1 });
    });
    (0, vitest_1.it)('POST /seasons/:seasonId/calendar/generate permite ida y vuelta', async () => {
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'POST',
            url: `/seasons/${seasonId.value}/calendar/generate`,
            headers: { Authorization: `Bearer ${token}` },
            payload: {
                startDate: '2026-04-01T10:00:00.000Z',
                doubleRoundRobin: true,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(201);
        (0, vitest_1.expect)(response.json()).toMatchObject({ matchesCount: 2 });
    });
    (0, vitest_1.it)('GET /seasons/:seasonId/matches devuelve listado paginado', async () => {
        await matchRepository.save(Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonAId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        }));
        const response = await server.inject({
            method: 'GET',
            url: `/seasons/${seasonId.value}/matches?page=1&limit=20`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.data).toHaveLength(1);
        (0, vitest_1.expect)(body.data[0].seasonId).toBe(seasonId.value);
        (0, vitest_1.expect)(body.data[0].homeTeam.name.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(body.data[0].awayTeam.name.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(body.meta).toEqual({ total: 1, page: 1, lastPage: 1 });
    });
    (0, vitest_1.it)('GET /seasons/:seasonId/matches permite acceso público', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/seasons/${seasonId.value}/matches?page=1&limit=20`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
    });
    (0, vitest_1.it)('GET /seasons/:seasonId/matches devuelve 500 si un partido referencia TeamSeason sin roster', async () => {
        const orphanTeamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        await matchRepository.save(Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: orphanTeamSeasonId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        }));
        const response = await server.inject({
            method: 'GET',
            url: `/seasons/${seasonId.value}/matches?page=1&limit=20`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        (0, vitest_1.expect)(response.json().message).toBe('Error interno del servidor');
    });
    (0, vitest_1.it)('PATCH /matches/:matchId/score devuelve 200 con admin', async () => {
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonAId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await matchRepository.save(match);
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'PATCH',
            url: `/matches/${match.id.value}/score`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { homeScore: 2, awayScore: 0 },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ matchId: match.id.value });
    });
    (0, vitest_1.it)('GET /matches/:matchId devuelve 200 cuando existe', async () => {
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonAId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await matchRepository.save(match);
        const response = await server.inject({
            method: 'GET',
            url: `/matches/${match.id.value}`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toMatchObject({ id: match.id.value });
    });
    (0, vitest_1.it)('PATCH /matches/:matchId/status devuelve 401 sin token', async () => {
        const response = await server.inject({
            method: 'PATCH',
            url: `/matches/${MatchId_value_object_1.MatchId.generate().value}/status`,
            payload: { status: 'POSTPONED' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
    });
    (0, vitest_1.it)('PATCH /matches/:matchId/status devuelve 200 con admin', async () => {
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonAId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await matchRepository.save(match);
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'PATCH',
            url: `/matches/${match.id.value}/status`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { status: 'CANCELLED' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ matchId: match.id.value });
    });
    (0, vitest_1.it)('PATCH /seasons/:seasonId/rounds/:round/date actualiza jornada con admin', async () => {
        const matchA = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonAId,
            awayTeamSeasonId: teamSeasonBId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        const matchB = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId: teamSeasonBId,
            awayTeamSeasonId: teamSeasonAId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await matchRepository.save(matchA);
        await matchRepository.save(matchB);
        const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
        const response = await server.inject({
            method: 'PATCH',
            url: `/seasons/${seasonId.value}/rounds/1/date`,
            headers: { Authorization: `Bearer ${token}` },
            payload: { date: '2026-04-08T10:00:00.000Z' },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({ updatedMatches: 2 });
    });
});
