"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaMatchRepository_1 = require("@/adapters/persistence/matches/PrismaMatchRepository");
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
(0, vitest_1.describe)('PrismaMatchRepository', () => {
    const mockCount = vitest_1.vi.fn();
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockCreateMany = vitest_1.vi.fn();
    const mockPrisma = {
        match: {
            count: mockCount,
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            upsert: mockUpsert,
            createMany: mockCreateMany,
        },
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaMatchRepository_1.PrismaMatchRepository(mockPrisma);
    });
    (0, vitest_1.it)('existsBySeasonId devuelve true si hay partidos', async () => {
        mockCount.mockResolvedValue(1);
        const exists = await repository.existsBySeasonId(SeasonId_value_object_1.SeasonId.generate());
        (0, vitest_1.expect)(exists).toBe(true);
    });
    (0, vitest_1.it)('findById devuelve null cuando no existe', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findById(MatchId_value_object_1.MatchId.generate());
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findBySeasonId devuelve data y total', async () => {
        const row = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            seasonId: '223e4567-e89b-12d3-a456-426614174000',
            homeTeamSeasonId: '323e4567-e89b-12d3-a456-426614174000',
            awayTeamSeasonId: '423e4567-e89b-12d3-a456-426614174000',
            homeScore: null,
            awayScore: null,
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
            status: 'SCHEDULED',
        };
        mockFindMany.mockResolvedValue([row]);
        mockCount.mockResolvedValue(1);
        const result = await repository.findBySeasonId(SeasonId_value_object_1.SeasonId.fromString(row.seasonId), {
            page: 1,
            limit: 20,
        });
        (0, vitest_1.expect)(result.total).toBe(1);
        (0, vitest_1.expect)(result.data).toHaveLength(1);
        (0, vitest_1.expect)(result.data[0].id?.value).toBe(row.id);
    });
    (0, vitest_1.it)('saveMany hace createMany', async () => {
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        mockCreateMany.mockResolvedValue({ count: 1 });
        await repository.saveMany([match]);
        (0, vitest_1.expect)(mockCreateMany).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('save usa upsert', async () => {
        const match = Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: SeasonId_value_object_1.SeasonId.generate(),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            date: new Date('2026-04-01T10:00:00.000Z'),
            round: 1,
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.save(match);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledTimes(1);
    });
});
