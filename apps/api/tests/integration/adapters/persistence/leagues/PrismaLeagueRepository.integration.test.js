"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaLeagueRepository_1.PrismaLeagueRepository(prisma);
(0, vitest_1.describe)('PrismaLeagueRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await prisma.match.deleteMany({});
        await prisma.rosterPlayer.deleteMany({});
        await prisma.teamSeason.deleteMany({});
        await prisma.season.deleteMany({});
        await prisma.league.deleteMany({});
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('save: persiste una liga nueva y findById la recupera', async () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        const league = League_entity_1.League.create({
            id,
            name: 'Liga Integración',
            leagueCategory: 'PRIMERA',
        });
        await repository.save(league);
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.name).toBe('Liga Integración');
        (0, vitest_1.expect)(found.leagueCategory).toBe('PRIMERA');
    });
    (0, vitest_1.it)('findById: devuelve null si la liga no existe', async () => {
        const found = await repository.findById(LeagueId_value_object_1.LeagueId.generate());
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('findAll: devuelve lista vacía y luego todas las ligas guardadas', async () => {
        (0, vitest_1.expect)(await repository.findAll()).toEqual([]);
        await repository.save(League_entity_1.League.create({ id: LeagueId_value_object_1.LeagueId.generate(), name: 'A', leagueCategory: 'SEGUNDA' }));
        await repository.save(League_entity_1.League.create({ id: LeagueId_value_object_1.LeagueId.generate(), name: 'B', leagueCategory: 'ELITE' }));
        const list = await repository.findAll();
        (0, vitest_1.expect)(list).toHaveLength(2);
        const names = list.map((l) => l.name).sort();
        (0, vitest_1.expect)(names).toEqual(['A', 'B']);
    });
    (0, vitest_1.it)('save: actualiza una liga existente', async () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        await repository.save(League_entity_1.League.create({ id, name: 'Nombre viejo', leagueCategory: 'CUARTA' }));
        await repository.save(League_entity_1.League.create({ id, name: 'Nombre nuevo', leagueCategory: 'MASTER' }));
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found.name).toBe('Nombre nuevo');
        (0, vitest_1.expect)(found.leagueCategory).toBe('MASTER');
    });
    (0, vitest_1.it)('delete: elimina la liga', async () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        await repository.save(League_entity_1.League.create({ id, name: 'Borrar', leagueCategory: 'PRO' }));
        await repository.delete(id);
        (0, vitest_1.expect)(await repository.findById(id)).toBeNull();
    });
    (0, vitest_1.it)('save: no permite dos ligas con el mismo nombre (UNIQUE en BD)', async () => {
        await repository.save(League_entity_1.League.create({ id: LeagueId_value_object_1.LeagueId.generate(), name: 'Mismo nombre', leagueCategory: 'PRIMERA' }));
        await (0, vitest_1.expect)(repository.save(League_entity_1.League.create({
            id: LeagueId_value_object_1.LeagueId.generate(),
            name: 'Mismo nombre',
            leagueCategory: 'SEGUNDA',
        }))).rejects.toThrow();
    });
    (0, vitest_1.it)('countSeasonsByLeagueId: cuenta temporadas de la liga', async () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        await repository.save(League_entity_1.League.create({ id, name: 'Con temporadas', leagueCategory: 'AVANZADO' }));
        await prisma.season.create({
            data: { year: 2024, leagueId: id.value },
        });
        await prisma.season.create({
            data: { year: 2025, leagueId: id.value },
        });
        const count = await repository.countSeasonsByLeagueId(id);
        (0, vitest_1.expect)(count).toBe(2);
    });
    (0, vitest_1.it)('createWithInitialSeason: crea liga y season inicial en una operación atómica', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        const league = League_entity_1.League.create({
            id: leagueId,
            name: 'Liga Atomic',
            leagueCategory: 'MASTER',
        });
        const initialSeason = await repository.createWithInitialSeason(league, 2026);
        const foundLeague = await repository.findById(leagueId);
        (0, vitest_1.expect)(foundLeague).not.toBeNull();
        (0, vitest_1.expect)(foundLeague.name).toBe('Liga Atomic');
        (0, vitest_1.expect)(initialSeason.year).toBe(2026);
        (0, vitest_1.expect)(initialSeason.leagueId.value).toBe(leagueId.value);
        const count = await repository.countSeasonsByLeagueId(leagueId);
        (0, vitest_1.expect)(count).toBe(1);
    });
});
