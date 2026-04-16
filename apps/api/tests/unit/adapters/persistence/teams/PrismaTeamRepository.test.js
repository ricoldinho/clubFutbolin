"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaTeamRepository_1 = require("@/adapters/persistence/teams/PrismaTeamRepository");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Team_entity_1 = require("@/domain/teams/Team.entity");
function makePrismaRow(overrides = {}) {
    return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Equipo Alpha',
        createdAt: new Date('2024-01-01'),
        ...overrides,
    };
}
(0, vitest_1.describe)('PrismaTeamRepository', () => {
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockDeleteMany = vitest_1.vi.fn();
    const mockPrisma = {
        team: {
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            upsert: mockUpsert,
            deleteMany: mockDeleteMany,
        },
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaTeamRepository_1.PrismaTeamRepository(mockPrisma);
    });
    (0, vitest_1.it)('findById devuelve null cuando no hay fila', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findById(TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000'));
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findById devuelve Team cuando hay fila', async () => {
        const row = makePrismaRow();
        mockFindUnique.mockResolvedValue(row);
        const result = await repository.findById(TeamId_value_object_1.TeamId.fromString(row.id));
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.name).toBe('Equipo Alpha');
    });
    (0, vitest_1.it)('findByName devuelve Team cuando existe', async () => {
        const row = makePrismaRow();
        mockFindUnique.mockResolvedValue(row);
        const result = await repository.findByName('Equipo Alpha');
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.name).toBe('Equipo Alpha');
    });
    (0, vitest_1.it)('findByName devuelve null cuando no existe', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findByName('NoExiste');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findAll devuelve lista de teams', async () => {
        const rows = [
            makePrismaRow(),
            makePrismaRow({ id: '223e4567-e89b-12d3-a456-426614174001', name: 'Equipo Beta' }),
        ];
        mockFindMany.mockResolvedValue(rows);
        const result = await repository.findAll();
        (0, vitest_1.expect)(result).toHaveLength(2);
    });
    (0, vitest_1.it)('findAll con paginación devuelve data + total y usa skip/take', async () => {
        const mockCount = vitest_1.vi.fn().mockResolvedValue(5);
        const prismaWithCount = {
            ...mockPrisma,
            team: { ...mockPrisma.team, count: mockCount },
        };
        const paginatedRepository = new PrismaTeamRepository_1.PrismaTeamRepository(prismaWithCount);
        mockFindMany.mockResolvedValue([makePrismaRow()]);
        const result = await paginatedRepository.findAll({ page: 2, limit: 2 });
        (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: {},
            skip: 2,
            take: 2,
            orderBy: { createdAt: 'asc' },
        }));
        (0, vitest_1.expect)(mockCount).toHaveBeenCalledWith({ where: {} });
        (0, vitest_1.expect)(result).toEqual({
            data: vitest_1.expect.any(Array),
            total: 5,
        });
    });
    (0, vitest_1.it)('findAll con búsqueda pasa contains insensible a mayúsculas en name', async () => {
        const mockCount = vitest_1.vi.fn().mockResolvedValue(1);
        const prismaWithCount = {
            ...mockPrisma,
            team: { ...mockPrisma.team, count: mockCount },
        };
        const paginatedRepository = new PrismaTeamRepository_1.PrismaTeamRepository(prismaWithCount);
        mockFindMany.mockResolvedValue([makePrismaRow({ name: 'Beta FC' })]);
        await paginatedRepository.findAll({ page: 1, limit: 10 }, { searchQuery: '  beta  ' });
        const expectedWhere = { name: { contains: 'beta', mode: 'insensitive' } };
        (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: expectedWhere }));
        (0, vitest_1.expect)(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
    });
    (0, vitest_1.it)('save con id existente hace upsert con where/update correctos', async () => {
        const id = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const team = Team_entity_1.Team.create({
            id,
            name: 'Equipo Save',
            createdAt: new Date('2024-01-01'),
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.save(team);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: id.value },
            update: { name: 'Equipo Save' },
            create: vitest_1.expect.objectContaining({
                id: id.value,
                name: 'Equipo Save',
            }),
        }));
    });
    (0, vitest_1.it)('save sin id genera uuid para create', async () => {
        const team = Team_entity_1.Team.create({
            name: 'Equipo Nuevo',
            createdAt: new Date('2024-02-01'),
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.save(team);
        const payload = mockUpsert.mock.calls[0][0];
        (0, vitest_1.expect)(payload.where.id).toMatch(/^[0-9a-f-]{36}$/i);
        (0, vitest_1.expect)(payload.create.name).toBe('Equipo Nuevo');
    });
    (0, vitest_1.it)('delete llama a deleteMany con id', async () => {
        const id = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        mockDeleteMany.mockResolvedValue({ count: 1 });
        await repository.delete(id);
        (0, vitest_1.expect)(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
    });
});
