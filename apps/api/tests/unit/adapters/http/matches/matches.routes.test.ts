import Fastify from 'fastify';
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { matchesRoutes } from '@/adapters/http/matches/matches.routes';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { InMemoryMatchRepository } from '../../../../doubles/InMemoryMatchRepository';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { Team } from '@/domain/teams/Team.entity';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES = '1h';

function buildServer() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const matchRepository = new InMemoryMatchRepository();
  const rosterRepository = new InMemoryRosterRepository();
  const seasonRepository = new InMemorySeasonRepository();
  const teamRepository = new InMemoryTeamRepository();
  const jwtService = new JoseJwtService(TEST_JWT_SECRET, TEST_JWT_EXPIRES);

  app.register(matchesRoutes, {
    repository: matchRepository,
    rosterRepository,
    seasonRepository,
    teamRepository,
    jwtService,
  });

  return { app, matchRepository, rosterRepository, seasonRepository, teamRepository, jwtService };
}

describe('matches routes', () => {
  let server: ReturnType<typeof buildServer>['app'];
  let seasonId: SeasonId;
  let teamSeasonAId: TeamSeasonId;
  let teamSeasonBId: TeamSeasonId;
  let jwtService: JoseJwtService;
  let matchRepository: InMemoryMatchRepository;

  beforeEach(async () => {
    const built = buildServer();
    server = built.app;
    jwtService = built.jwtService;
    matchRepository = built.matchRepository;

    seasonId = SeasonId.generate();
    await built.seasonRepository.save(
      Season.create({
        id: seasonId,
        year: 2026,
        leagueId: LeagueId.generate(),
      }),
    );
    const teamA = Team.create({ id: TeamId.generate(), name: 'Team A' });
    const teamB = Team.create({ id: TeamId.generate(), name: 'Team B' });
    await built.teamRepository.save(teamA);
    await built.teamRepository.save(teamB);

    teamSeasonAId = TeamSeasonId.generate();
    teamSeasonBId = TeamSeasonId.generate();
    await built.rosterRepository.saveTeamSeason(
      TeamRoster.create({
        teamSeasonId: teamSeasonAId,
        teamId: teamA.id!,
        seasonId,
      }),
    );
    await built.rosterRepository.saveTeamSeason(
      TeamRoster.create({
        teamSeasonId: teamSeasonBId,
        teamId: teamB.id!,
        seasonId,
      }),
    );

    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('POST /seasons/:seasonId/calendar/generate devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/seasons/${seasonId.value}/calendar/generate`,
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST /seasons/:seasonId/calendar/generate devuelve 201 con admin', async () => {
    const token = await jwtService.sign({ sub: 'admin-1', role: 'ADMIN' });
    const response = await server.inject({
      method: 'POST',
      url: `/seasons/${seasonId.value}/calendar/generate`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { startDate: '2026-04-01T10:00:00.000Z' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ matchesCount: 1 });
  });

  it('GET /seasons/:seasonId/matches devuelve listado paginado', async () => {
    await matchRepository.save(
      Match.create({
        id: MatchId.generate(),
        seasonId,
        homeTeamSeasonId: teamSeasonAId,
        awayTeamSeasonId: teamSeasonBId,
        date: new Date('2026-04-01T10:00:00.000Z'),
        round: 1,
      }),
    );
    const response = await server.inject({
      method: 'GET',
      url: `/seasons/${seasonId.value}/matches?page=1&limit=20`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      data: Array<{ seasonId: string; homeTeam: { name: string }; awayTeam: { name: string } }>;
      meta: { total: number; page: number; lastPage: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].seasonId).toBe(seasonId.value);
    expect(body.data[0].homeTeam.name.length).toBeGreaterThan(0);
    expect(body.data[0].awayTeam.name.length).toBeGreaterThan(0);
    expect(body.meta).toEqual({ total: 1, page: 1, lastPage: 1 });
  });

  it('GET /seasons/:seasonId/matches permite acceso público', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/seasons/${seasonId.value}/matches?page=1&limit=20`,
    });

    expect(response.statusCode).toBe(200);
  });

  it('PATCH /matches/:matchId/score devuelve 200 con admin', async () => {
    const match = Match.create({
      id: MatchId.generate(),
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
      url: `/matches/${match.id!.value}/score`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { homeScore: 2, awayScore: 0 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ matchId: match.id!.value });
  });

  it('GET /matches/:matchId devuelve 200 cuando existe', async () => {
    const match = Match.create({
      id: MatchId.generate(),
      seasonId,
      homeTeamSeasonId: teamSeasonAId,
      awayTeamSeasonId: teamSeasonBId,
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });
    await matchRepository.save(match);

    const response = await server.inject({
      method: 'GET',
      url: `/matches/${match.id!.value}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: match.id!.value });
  });

  it('PATCH /matches/:matchId/status devuelve 401 sin token', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: `/matches/${MatchId.generate().value}/status`,
      payload: { status: 'POSTPONED' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('PATCH /matches/:matchId/status devuelve 200 con admin', async () => {
    const match = Match.create({
      id: MatchId.generate(),
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
      url: `/matches/${match.id!.value}/status`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: 'CANCELLED' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ matchId: match.id!.value });
  });
});
