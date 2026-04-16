"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaSeasonRepository_1 = require("@/adapters/persistence/seasons/PrismaSeasonRepository");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const League_entity_1 = require("@/domain/leagues/League.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaSeasonRepository_1.PrismaSeasonRepository(prisma);
const leagueRepository = new PrismaLeagueRepository_1.PrismaLeagueRepository(prisma);
async function clearSeasonRelated() {
    await prisma.match.deleteMany({});
    await prisma.rosterPlayer.deleteMany({});
    await prisma.teamSeason.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.league.deleteMany({});
}
(0, vitest_1.describe)('PrismaSeasonRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await clearSeasonRelated();
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('save: persiste temporada y findById la recupera', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'Liga S', leagueCategory: 'PRIMERA' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const season = Season_entity_1.Season.create({
            id: seasonId,
            year: 2026,
            leagueId,
            championId: null,
            secondId: null,
        });
        await repository.save(season);
        const found = await repository.findById(seasonId);
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.year).toBe(2026);
        (0, vitest_1.expect)(found.leagueId.value).toBe(leagueId.value);
    });
    (0, vitest_1.it)('findById: devuelve null si no existe', async () => {
        (0, vitest_1.expect)(await repository.findById(SeasonId_value_object_1.SeasonId.generate())).toBeNull();
    });
    (0, vitest_1.it)('findByLeagueId: filtra por liga', async () => {
        const l1 = LeagueId_value_object_1.LeagueId.generate();
        const l2 = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: l1, name: 'L1', leagueCategory: 'SEGUNDA' }));
        await leagueRepository.save(League_entity_1.League.create({ id: l2, name: 'L2', leagueCategory: 'SEGUNDA' }));
        await repository.save(Season_entity_1.Season.create({ year: 2020, leagueId: l1 }));
        await repository.save(Season_entity_1.Season.create({ year: 2021, leagueId: l1 }));
        await repository.save(Season_entity_1.Season.create({ year: 2020, leagueId: l2 }));
        const forL1 = await repository.findByLeagueId(l1);
        (0, vitest_1.expect)(forL1).toHaveLength(2);
        const years = forL1.map((s) => s.year).sort();
        (0, vitest_1.expect)(years).toEqual([2020, 2021]);
    });
    (0, vitest_1.it)('findAll: devuelve todas las temporadas', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L', leagueCategory: 'TERCERA' }));
        await repository.save(Season_entity_1.Season.create({ year: 2019, leagueId: leagueId }));
        await repository.save(Season_entity_1.Season.create({ year: 2020, leagueId: leagueId }));
        const all = await repository.findAll();
        (0, vitest_1.expect)(all).toHaveLength(2);
    });
    (0, vitest_1.it)('save: actualiza año y ganadores', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L', leagueCategory: 'ELITE' }));
        const t1 = await prisma.team.create({ data: { name: 'Campeón' } });
        const t2 = await prisma.team.create({ data: { name: 'Sub' } });
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await repository.save(Season_entity_1.Season.create({
            id: seasonId,
            year: 2022,
            leagueId,
        }));
        const updated = (await repository.findById(seasonId)).setWinners(TeamId_value_object_1.TeamId.fromString(t1.id), TeamId_value_object_1.TeamId.fromString(t2.id));
        await repository.save(updated);
        const found = await repository.findById(seasonId);
        (0, vitest_1.expect)(found.championId.value).toBe(t1.id);
        (0, vitest_1.expect)(found.secondId.value).toBe(t2.id);
    });
    (0, vitest_1.it)('delete: elimina la temporada', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepository.save(League_entity_1.League.create({ id: leagueId, name: 'L', leagueCategory: 'CUARTA' }));
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        await repository.save(Season_entity_1.Season.create({ id: seasonId, year: 2030, leagueId }));
        await repository.delete(seasonId);
        (0, vitest_1.expect)(await repository.findById(seasonId)).toBeNull();
    });
});
