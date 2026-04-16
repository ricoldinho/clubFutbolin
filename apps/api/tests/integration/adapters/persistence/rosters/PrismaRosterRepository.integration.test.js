"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaRosterRepository_1 = require("@/adapters/persistence/rosters/PrismaRosterRepository");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const PrismaTeamRepository_1 = require("@/adapters/persistence/teams/PrismaTeamRepository");
const PrismaSeasonRepository_1 = require("@/adapters/persistence/seasons/PrismaSeasonRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaRosterRepository_1.PrismaRosterRepository(prisma);
const leagueRepository = new PrismaLeagueRepository_1.PrismaLeagueRepository(prisma);
const teamRepository = new PrismaTeamRepository_1.PrismaTeamRepository(prisma);
const seasonRepository = new PrismaSeasonRepository_1.PrismaSeasonRepository(prisma);
async function clearAll() {
    await prisma.match.deleteMany({});
    await prisma.rosterPlayer.deleteMany({});
    await prisma.teamSeason.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.league.deleteMany({});
    await prisma.player.deleteMany({});
}
(0, vitest_1.describe)('PrismaRosterRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await clearAll();
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('saveTeamSeason + findById + findTeamSeasonByTeamAndSeason: plantilla vacía', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'Liga R', leagueCategory: 'PRIMERA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'Equipo R' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonId, year: 2027, leagueId }));
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        const roster = TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId,
            teamId,
            seasonId,
            members: [],
        });
        await repository.saveTeamSeason(roster);
        const byId = await repository.findById(teamSeasonId);
        (0, vitest_1.expect)(byId).not.toBeNull();
        (0, vitest_1.expect)(byId.members).toHaveLength(0);
        (0, vitest_1.expect)(byId.teamId.value).toBe(teamId.value);
        (0, vitest_1.expect)(byId.seasonId.value).toBe(seasonId.value);
        const byPair = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);
        (0, vitest_1.expect)(byPair).not.toBeNull();
        (0, vitest_1.expect)(byPair.teamSeasonId.value).toBe(teamSeasonId.value);
    });
    (0, vitest_1.it)('findById: devuelve null si no existe el TeamSeason', async () => {
        (0, vitest_1.expect)(await repository.findById(TeamSeasonId_value_object_1.TeamSeasonId.generate())).toBeNull();
    });
    (0, vitest_1.it)('findTeamSeasonByTeamAndSeason: devuelve null si no hay inscripción', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L', leagueCategory: 'SEGUNDA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'T' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonId, year: 2028, leagueId }));
        const found = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('saveRoster: persiste miembros y findById los reconstruye', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L2', leagueCategory: 'TERCERA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'T2' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonId, year: 2029, leagueId }));
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        let roster = TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] });
        await repository.saveTeamSeason(roster);
        const playerId = PlayerId_value_object_1.PlayerId.generate();
        await prisma.player.create({
            data: {
                id: playerId.value,
                email: `roster-${playerId.value}@example.com`,
                name: 'Jugador',
                lastname: 'Test',
                nickname: null,
                phoneNumber: '611111111',
                birthdate: new Date('1991-02-02'),
                category: 'PRIMERA',
                role: 'USER',
                passwordHash: '$2b$10$testhashrosterintegration',
            },
        });
        roster = (await repository.findById(teamSeasonId));
        const withPlayer = roster.addPlayer(playerId, 'PORTERO');
        await repository.saveRoster(withPlayer);
        const loaded = await repository.findById(teamSeasonId);
        (0, vitest_1.expect)(loaded.members).toHaveLength(1);
        (0, vitest_1.expect)(loaded.members[0].playerId.value).toBe(playerId.value);
        (0, vitest_1.expect)(loaded.members[0].position).toBe('PORTERO');
    });
    (0, vitest_1.it)('saveRoster: sustituye la lista completa de jugadores', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L3', leagueCategory: 'CUARTA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'T3' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonId, year: 2030, leagueId }));
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        await repository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] }));
        const p1 = PlayerId_value_object_1.PlayerId.generate();
        const p2 = PlayerId_value_object_1.PlayerId.generate();
        for (const [pid, email] of [
            [p1, `r1-${p1.value}@example.com`],
            [p2, `r2-${p2.value}@example.com`],
        ]) {
            await prisma.player.create({
                data: {
                    id: pid.value,
                    email,
                    name: 'N',
                    lastname: 'A',
                    nickname: null,
                    phoneNumber: '622222222',
                    birthdate: new Date('1992-03-03'),
                    category: 'SEGUNDA',
                    role: 'USER',
                    passwordHash: '$2b$10$hash',
                },
            });
        }
        let roster = (await repository.findById(teamSeasonId));
        roster = roster.addPlayer(p1, 'PORTERO').addPlayer(p2, 'DELANTERO');
        await repository.saveRoster(roster);
        roster = (await repository.findById(teamSeasonId));
        const onlyP1 = roster.removePlayer(p2);
        await repository.saveRoster(onlyP1);
        const loaded = await repository.findById(teamSeasonId);
        (0, vitest_1.expect)(loaded.members).toHaveLength(1);
        (0, vitest_1.expect)(loaded.members[0].playerId.value).toBe(p1.value);
    });
    (0, vitest_1.it)('findMembershipsByPlayerId: devuelve equipos, temporada y liga del jugador', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Membresias', leagueCategory: 'PRIMERA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'Equipo Membresias' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonId, year: 2031, leagueId }));
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        await repository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] }));
        const playerId = PlayerId_value_object_1.PlayerId.generate();
        await prisma.player.create({
            data: {
                id: playerId.value,
                email: `membership-${playerId.value}@example.com`,
                name: 'Jugador',
                lastname: 'Membership',
                nickname: null,
                phoneNumber: '633333333',
                birthdate: new Date('1995-05-05'),
                category: 'PRIMERA',
                role: 'USER',
                passwordHash: '$2b$10$hashmembership',
            },
        });
        const roster = (await repository.findById(teamSeasonId));
        await repository.saveRoster(roster.addPlayer(playerId, 'DELANTERO'));
        const memberships = await repository.findMembershipsByPlayerId(playerId);
        (0, vitest_1.expect)(memberships).toHaveLength(1);
        (0, vitest_1.expect)(memberships[0]).toMatchObject({
            teamName: 'Equipo Membresias',
            seasonYear: 2031,
            leagueName: 'Liga Membresias',
            leagueId: leagueId.value,
        });
        (0, vitest_1.expect)(memberships[0].teamId.value).toBe(teamId.value);
        (0, vitest_1.expect)(memberships[0].seasonId.value).toBe(seasonId.value);
    });
    (0, vitest_1.it)('findPlayersByTeamId: marca isCurrent en la temporada de año máximo', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Current', leagueCategory: 'PRIMERA' }));
        const teamId = TeamId_value_object_1.TeamId.generate();
        await teamRepository.save(Team_entity_1.Team.create({ id: teamId, name: 'Equipo Current' }));
        const seasonOldId = SeasonId_value_object_1.SeasonId.generate();
        const seasonNewId = SeasonId_value_object_1.SeasonId.generate();
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonOldId, year: 2020, leagueId }));
        await seasonRepository.save(Season_entity_1.Season.create({ id: seasonNewId, year: 2035, leagueId }));
        const tsOld = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        const tsNew = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        await repository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({ teamSeasonId: tsOld, teamId, seasonId: seasonOldId, members: [] }));
        await repository.saveTeamSeason(TeamRoster_entity_1.TeamRoster.create({ teamSeasonId: tsNew, teamId, seasonId: seasonNewId, members: [] }));
        const pOld = PlayerId_value_object_1.PlayerId.generate();
        const pNew = PlayerId_value_object_1.PlayerId.generate();
        for (const [pid, email] of [
            [pOld, `old-${pOld.value}@example.com`],
            [pNew, `new-${pNew.value}@example.com`],
        ]) {
            await prisma.player.create({
                data: {
                    id: pid.value,
                    email,
                    name: 'N',
                    lastname: 'A',
                    nickname: null,
                    phoneNumber: '644444444',
                    birthdate: new Date('1990-01-01'),
                    category: 'PRIMERA',
                    role: 'USER',
                    passwordHash: '$2b$10$hashcurrent',
                },
            });
        }
        const rOld = (await repository.findById(tsOld));
        await repository.saveRoster(rOld.addPlayer(pOld, 'PORTERO'));
        const rNew = (await repository.findById(tsNew));
        await repository.saveRoster(rNew.addPlayer(pNew, 'DELANTERO'));
        const players = await repository.findPlayersByTeamId(teamId);
        const byId = Object.fromEntries(players.map((p) => [p.id, p]));
        (0, vitest_1.expect)(byId[pOld.value].isCurrent).toBe(false);
        (0, vitest_1.expect)(byId[pNew.value].isCurrent).toBe(true);
    });
});
