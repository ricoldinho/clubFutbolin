"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaSeasonRepository_1 = require("@/adapters/persistence/seasons/PrismaSeasonRepository");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
function makeRow(overrides = {}) {
    return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        year: 2025,
        leagueId: '223e4567-e89b-12d3-a456-426614174001',
        championId: null,
        secondId: null,
        ...overrides,
    };
}
(0, vitest_1.describe)('PrismaSeasonRepository', () => {
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockFindFirst = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockDeleteMany = vitest_1.vi.fn();
    const mockPrisma = {
        season: {
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            findFirst: mockFindFirst,
            upsert: mockUpsert,
            deleteMany: mockDeleteMany,
        },
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaSeasonRepository_1.PrismaSeasonRepository(mockPrisma);
    });
    (0, vitest_1.it)('findById devuelve null cuando no hay fila', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findById(SeasonId_value_object_1.SeasonId.fromString(makeRow().id));
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findById devuelve Season cuando hay fila', async () => {
        const row = makeRow();
        mockFindUnique.mockResolvedValue(row);
        const result = await repository.findById(SeasonId_value_object_1.SeasonId.fromString(row.id));
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.year).toBe(2025);
    });
    (0, vitest_1.it)('findLatestByYear usa findFirst ordenado por año desc e id asc', async () => {
        const row = makeRow({ year: 2030 });
        mockFindFirst.mockResolvedValue(row);
        const result = await repository.findLatestByYear();
        (0, vitest_1.expect)(mockFindFirst).toHaveBeenCalledWith({
            select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
            orderBy: [{ year: 'desc' }, { id: 'asc' }],
        });
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.year).toBe(2030);
    });
    (0, vitest_1.it)('findLatestByYear devuelve null si no hay temporadas', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await repository.findLatestByYear();
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findAll devuelve lista', async () => {
        mockFindMany.mockResolvedValue([
            makeRow(),
            makeRow({ id: '323e4567-e89b-12d3-a456-426614174002', year: 2024 }),
        ]);
        const result = await repository.findAll();
        (0, vitest_1.expect)(result).toHaveLength(2);
    });
    (0, vitest_1.it)('findAll con paginación devuelve data + total y usa skip/take', async () => {
        const mockCount = vitest_1.vi.fn().mockResolvedValue(9);
        const prismaWithCount = {
            ...mockPrisma,
            season: { ...mockPrisma.season, count: mockCount },
        };
        const paginatedRepository = new PrismaSeasonRepository_1.PrismaSeasonRepository(prismaWithCount);
        mockFindMany.mockResolvedValue([makeRow()]);
        const result = await paginatedRepository.findAll({ page: 3, limit: 4 });
        (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            skip: 8,
            take: 4,
            orderBy: [{ year: 'asc' }, { id: 'asc' }],
        }));
        (0, vitest_1.expect)(result).toEqual({
            data: vitest_1.expect.any(Array),
            total: 9,
        });
    });
    (0, vitest_1.it)('findByLeagueId filtra por liga', async () => {
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        mockFindMany.mockResolvedValue([makeRow({ leagueId: leagueId.value })]);
        const result = await repository.findByLeagueId(leagueId);
        (0, vitest_1.expect)(result).toHaveLength(1);
    });
    (0, vitest_1.it)('save con id existente hace upsert con campeon/subcampeon', async () => {
        const id = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const leagueId = LeagueId_value_object_1.LeagueId.fromString('223e4567-e89b-12d3-a456-426614174001');
        const championId = TeamId_value_object_1.TeamId.fromString('323e4567-e89b-12d3-a456-426614174002');
        const secondId = TeamId_value_object_1.TeamId.fromString('423e4567-e89b-12d3-a456-426614174003');
        const season = Season_entity_1.Season.create({
            id,
            year: 2027,
            leagueId,
            championId,
            secondId,
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.save(season);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: id.value },
            update: vitest_1.expect.objectContaining({
                year: 2027,
                leagueId: leagueId.value,
                championId: championId.value,
                secondId: secondId.value,
            }),
        }));
    });
    (0, vitest_1.it)('save sin id genera uuid y admite null en campeon/subcampeon', async () => {
        const season = Season_entity_1.Season.create({
            year: 2028,
            leagueId: LeagueId_value_object_1.LeagueId.fromString('223e4567-e89b-12d3-a456-426614174001'),
            championId: null,
            secondId: null,
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.save(season);
        const call = mockUpsert.mock.calls[0][0];
        (0, vitest_1.expect)(call.where.id).toMatch(/^[0-9a-f-]{36}$/i);
        (0, vitest_1.expect)(call.create.championId).toBeNull();
        (0, vitest_1.expect)(call.create.secondId).toBeNull();
    });
    (0, vitest_1.it)('delete llama a deleteMany con el id', async () => {
        const id = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
        mockDeleteMany.mockResolvedValue({ count: 1 });
        await repository.delete(id);
        (0, vitest_1.expect)(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
    });
});
