"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaMatchRepository_1 = require("@/adapters/persistence/matches/PrismaMatchRepository");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const PrismaTeamRepository_1 = require("@/adapters/persistence/teams/PrismaTeamRepository");
const PrismaSeasonRepository_1 = require("@/adapters/persistence/seasons/PrismaSeasonRepository");
const PrismaRosterRepository_1 = require("@/adapters/persistence/rosters/PrismaRosterRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaMatchRepository_1.PrismaMatchRepository(prisma);
const leagueRepository = new PrismaLeagueRepository_1.PrismaLeagueRepository(prisma);
const teamRepository = new PrismaTeamRepository_1.PrismaTeamRepository(prisma);
const seasonRepository = new PrismaSeasonRepository_1.PrismaSeasonRepository(prisma);
const rosterRepository = new PrismaRosterRepository_1.PrismaRosterRepository(prisma);
async function clearAll() {
    await prisma.match.deleteMany({});
    await prisma.rosterPlayer.deleteMany({});
    await prisma.teamSeason.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.league.deleteMany({});
}
(0, vitest_1.describe)('PrismaMatchRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await clearAll();
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('saveMany + findBySeasonId persiste y lista partidos', async () => {
        const { seasonId, homeTeamSeasonId, awayTeamSeasonId } = await seedSeasonAndRoster();
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId,
            awayTeamSeasonId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await repository.saveMany([match]);
        const listed = await repository.findBySeasonId(seasonId, { page: 1, limit: 20 });
        (0, vitest_1.expect)(listed.total).toBe(1);
        (0, vitest_1.expect)(listed.data).toHaveLength(1);
        (0, vitest_1.expect)(listed.data[0].id?.value).toBe(match.id?.value);
    });
    (0, vitest_1.it)('save actualiza marcador y findById lo reconstruye', async () => {
        const { seasonId, homeTeamSeasonId, awayTeamSeasonId } = await seedSeasonAndRoster();
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId,
            homeTeamSeasonId,
            awayTeamSeasonId,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        await repository.save(match);
        await repository.save(match.updateScore(2, 1));
        const loaded = await repository.findById(match.id);
        (0, vitest_1.expect)(loaded).not.toBeNull();
        (0, vitest_1.expect)(loaded?.score.home).toBe(2);
        (0, vitest_1.expect)(loaded?.score.away).toBe(1);
        (0, vitest_1.expect)(loaded?.status).toBe('FINISHED');
    });
});
async function seedSeasonAndRoster() {
    const leagueId = LeagueId_value_object_1.LeagueId.generate();
    await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Match Integration', leagueCategory: 'PRIMERA' }));
    const homeTeamId = TeamId_value_object_1.TeamId.generate();
    const awayTeamId = TeamId_value_object_1.TeamId.generate();
    await teamRepository.save(Team_entity_1.Team.create({ id: homeTeamId, name: 'Home Team Match Integration' }));
    await teamRepository.save(Team_entity_1.Team.create({ id: awayTeamId, name: 'Away Team Match Integration' }));
    const seasonId = SeasonId_value_object_1.SeasonId.generate();
    await seasonRepository.save(Season_entity_1.Season.create({
        id: seasonId,
        year: 2032,
        leagueId,
    }));
    const homeTeamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
    const awayTeamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
    await rosterRepository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({
        teamSeasonId: homeTeamSeasonId,
        teamId: homeTeamId,
        seasonId,
    }));
    await rosterRepository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({
        teamSeasonId: awayTeamSeasonId,
        teamId: awayTeamId,
        seasonId,
    }));
    return { seasonId, homeTeamSeasonId, awayTeamSeasonId };
}
