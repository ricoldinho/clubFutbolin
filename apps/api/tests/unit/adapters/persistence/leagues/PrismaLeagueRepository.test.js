"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const League_entity_1 = require("@/domain/leagues/League.entity");
function makePrismaRow(overrides = {}) {
    return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Liga Provincial',
        leagueCategory: 'PRIMERA',
        ...overrides,
    };
}
(0, vitest_1.describe)('PrismaLeagueRepository', () => {
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockDeleteMany = vitest_1.vi.fn();
    const mockCount = vitest_1.vi.fn();
    const mockCreateLeague = vitest_1.vi.fn();
    const mockCreateSeason = vitest_1.vi.fn();
    const mockTransaction = vitest_1.vi.fn();
    const mockPrisma = {
        league: {
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            count: mockCount,
            upsert: mockUpsert,
            deleteMany: mockDeleteMany,
            create: mockCreateLeague,
        },
        season: {
            count: mockCount,
            create: mockCreateSeason,
        },
        $transaction: mockTransaction,
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaLeagueRepository_1.PrismaLeagueRepository(mockPrisma);
    });
    (0, vitest_1.it)('findById devuelve null cuando no hay fila', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findById(LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000'));
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findById devuelve League cuando hay fila', async () => {
        const row = makePrismaRow();
        mockFindUnique.mockResolvedValue(row);
        const result = await repository.findById(LeagueId_value_object_1.LeagueId.fromString(row.id));
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.name).toBe('Liga Provincial');
        (0, vitest_1.expect)(result?.leagueCategory).toBe('PRIMERA');
    });
    (0, vitest_1.it)('findAll devuelve lista de leagues', async () => {
        const rows = [
            makePrismaRow(),
            makePrismaRow({ id: '223e4567-e89b-12d3-a456-426614174001', name: 'Liga B', leagueCategory: 'ELITE' }),
        ];
        mockFindMany.mockResolvedValue(rows);
        const result = await repository.findAll();
        (0, vitest_1.expect)(result).toHaveLength(2);
        (0, vitest_1.expect)(result[0].name).toBe('Liga Provincial');
        (0, vitest_1.expect)(result[1].name).toBe('Liga B');
    });
    (0, vitest_1.it)('findAll con paginación devuelve data + total y usa skip/take', async () => {
        const rows = [makePrismaRow({ id: '223e4567-e89b-12d3-a456-426614174001' })];
        mockFindMany.mockResolvedValue(rows);
        mockCount.mockResolvedValue(7);
        const result = await repository.findAll({ page: 2, limit: 3 });
        (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            skip: 3,
            take: 3,
            orderBy: { name: 'asc' },
        }));
        (0, vitest_1.expect)(result).toEqual({
            data: vitest_1.expect.any(Array),
            total: 7,
        });
        if ('data' in result) {
            (0, vitest_1.expect)(result.data).toHaveLength(1);
        }
    });
    (0, vitest_1.it)('save con league que tiene id llama upsert con update', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const league = League_entity_1.League.create({
            id: leagueId,
            name: 'Liga X',
            leagueCategory: 'PRIMERA',
        });
        mockUpsert.mockResolvedValue({ id: leagueId.value, name: 'Liga X', leagueCategory: 'PRIMERA' });
        await repository.save(league);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: leagueId.value },
            update: { name: 'Liga X', leagueCategory: 'PRIMERA' },
        }));
    });
    (0, vitest_1.it)('save con league sin id usa generate para create', async () => {
        const league = League_entity_1.League.create({
            name: 'Liga Nueva',
            leagueCategory: 'ELITE',
        });
        mockUpsert.mockResolvedValue({});
        await repository.save(league);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalled();
        const call = mockUpsert.mock.calls[0][0];
        (0, vitest_1.expect)(call.create.name).toBe('Liga Nueva');
        (0, vitest_1.expect)(call.where.id).toMatch(/^[0-9a-f-]{36}$/i);
    });
    (0, vitest_1.it)('delete llama a deleteMany', async () => {
        mockDeleteMany.mockResolvedValue({ count: 1 });
        const id = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        await repository.delete(id);
        (0, vitest_1.expect)(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
    });
    (0, vitest_1.it)('countSeasonsByLeagueId devuelve el conteo', async () => {
        mockCount.mockResolvedValue(3);
        const id = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const result = await repository.countSeasonsByLeagueId(id);
        (0, vitest_1.expect)(result).toBe(3);
    });
    (0, vitest_1.it)('createWithInitialSeason crea league + season dentro de transacción', async () => {
        // Arrange
        const leagueId = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const league = League_entity_1.League.create({
            id: leagueId,
            name: 'Liga Atomica',
            leagueCategory: 'PRIMERA',
        });
        mockCreateSeason.mockResolvedValue({
            id: '223e4567-e89b-12d3-a456-426614174000',
            year: 2026,
            leagueId: leagueId.value,
            championId: null,
            secondId: null,
        });
        mockTransaction.mockImplementation(async (cb) => cb({
            league: { create: mockCreateLeague },
            season: { create: mockCreateSeason },
        }));
        // Act
        const season = await repository.createWithInitialSeason(league, 2026);
        // Assert
        (0, vitest_1.expect)(mockTransaction).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(mockCreateLeague).toHaveBeenCalledWith({
            data: {
                id: leagueId.value,
                name: 'Liga Atomica',
                leagueCategory: 'PRIMERA',
            },
        });
        (0, vitest_1.expect)(mockCreateSeason).toHaveBeenCalledWith({
            data: {
                year: 2026,
                leagueId: leagueId.value,
            },
            select: {
                id: true,
                year: true,
                leagueId: true,
                championId: true,
                secondId: true,
            },
        });
        (0, vitest_1.expect)(season.year).toBe(2026);
        (0, vitest_1.expect)(season.leagueId.value).toBe(leagueId.value);
    });
});
