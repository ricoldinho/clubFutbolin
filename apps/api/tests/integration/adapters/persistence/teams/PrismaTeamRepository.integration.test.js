"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaTeamRepository_1 = require("@/adapters/persistence/teams/PrismaTeamRepository");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaTeamRepository_1.PrismaTeamRepository(prisma);
async function clearTeamRelated() {
    await prisma.match.deleteMany({});
    await prisma.rosterPlayer.deleteMany({});
    await prisma.teamSeason.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.league.deleteMany({});
}
(0, vitest_1.describe)('PrismaTeamRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await clearTeamRelated();
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('save: persiste un equipo nuevo y findById lo recupera', async () => {
        const id = TeamId_value_object_1.TeamId.generate();
        const createdAt = new Date('2024-06-01T12:00:00.000Z');
        const team = Team_entity_1.Team.create({
            id,
            name: 'Equipo Integración',
            createdAt,
        });
        await repository.save(team);
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.name).toBe('Equipo Integración');
        (0, vitest_1.expect)(found.createdAt.getTime()).toBe(createdAt.getTime());
    });
    (0, vitest_1.it)('findById: devuelve null si el equipo no existe', async () => {
        (0, vitest_1.expect)(await repository.findById(TeamId_value_object_1.TeamId.generate())).toBeNull();
    });
    (0, vitest_1.it)('findByName: busca con trim sobre el valor almacenado', async () => {
        await repository.save(Team_entity_1.Team.create({ name: 'Nombre Único' }));
        const found = await repository.findByName('  Nombre Único  ');
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.name).toBe('Nombre Único');
    });
    (0, vitest_1.it)('findAll: lista vacía y luego todos los equipos', async () => {
        (0, vitest_1.expect)(await repository.findAll()).toEqual([]);
        await repository.save(Team_entity_1.Team.create({ name: 'T1' }));
        await repository.save(Team_entity_1.Team.create({ name: 'T2' }));
        const list = await repository.findAll();
        (0, vitest_1.expect)(list).toHaveLength(2);
        const names = list.map((t) => t.name).sort();
        (0, vitest_1.expect)(names).toEqual(['T1', 'T2']);
    });
    (0, vitest_1.it)('findAll con paginación y searchQuery filtra por nombre', async () => {
        await repository.save(Team_entity_1.Team.create({ name: 'Alfa Club' }));
        await repository.save(Team_entity_1.Team.create({ name: 'Beta United' }));
        const filtered = await repository.findAll({ page: 1, limit: 10 }, { searchQuery: 'alfa' });
        (0, vitest_1.expect)(filtered.total).toBe(1);
        (0, vitest_1.expect)(filtered.data[0].name).toBe('Alfa Club');
    });
    (0, vitest_1.it)('save: actualiza nombre del equipo', async () => {
        const id = TeamId_value_object_1.TeamId.generate();
        await repository.save(Team_entity_1.Team.create({ id, name: 'Viejo' }));
        await repository.save(Team_entity_1.Team.create({ id, name: 'Nuevo' }));
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found.name).toBe('Nuevo');
    });
    (0, vitest_1.it)('delete: elimina el equipo', async () => {
        const id = TeamId_value_object_1.TeamId.generate();
        await repository.save(Team_entity_1.Team.create({ id, name: 'Borrar' }));
        await repository.delete(id);
        (0, vitest_1.expect)(await repository.findById(id)).toBeNull();
    });
});
