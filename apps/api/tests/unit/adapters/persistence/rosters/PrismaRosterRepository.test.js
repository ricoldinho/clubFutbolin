"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaRosterRepository_1 = require("@/adapters/persistence/rosters/PrismaRosterRepository");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const RosterMember_1 = require("@/domain/rosters/RosterMember");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
function makeRow(overrides = {}) {
    return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        teamId: '223e4567-e89b-12d3-a456-426614174001',
        seasonId: '323e4567-e89b-12d3-a456-426614174002',
        rosterPlayers: [],
        ...overrides,
    };
}
(0, vitest_1.describe)('PrismaRosterRepository', () => {
    const mockFindFirst = vitest_1.vi.fn();
    const mockFindUnique = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockDeleteMany = vitest_1.vi.fn();
    const mockCreate = vitest_1.vi.fn();
    const mockPrisma = {
        teamSeason: {
            findFirst: mockFindFirst,
            findUnique: mockFindUnique,
            upsert: mockUpsert,
        },
        rosterPlayer: {
            deleteMany: mockDeleteMany,
            create: mockCreate,
        },
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaRosterRepository_1.PrismaRosterRepository(mockPrisma);
    });
    (0, vitest_1.it)('findById devuelve null cuando no hay fila', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await repository.findById(TeamSeasonId_value_object_1.TeamSeasonId.fromString(makeRow().id));
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findById devuelve TeamRoster cuando hay fila', async () => {
        const row = makeRow({
            rosterPlayers: [{ playerId: '423e4567-e89b-12d3-a456-426614174003', position: 'PORTERO' }],
        });
        mockFindUnique.mockResolvedValue(row);
        const result = await repository.findById(TeamSeasonId_value_object_1.TeamSeasonId.fromString(row.id));
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.members).toHaveLength(1);
    });
    (0, vitest_1.it)('findTeamSeasonByTeamAndSeason devuelve null cuando no existe', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await repository.findTeamSeasonByTeamAndSeason(TeamId_value_object_1.TeamId.generate(), SeasonId_value_object_1.SeasonId.generate());
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('findTeamSeasonByTeamAndSeason devuelve TeamRoster cuando existe', async () => {
        const row = makeRow();
        mockFindFirst.mockResolvedValue(row);
        const teamId = TeamId_value_object_1.TeamId.fromString(row.teamId);
        const seasonId = SeasonId_value_object_1.SeasonId.fromString(row.seasonId);
        const result = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.teamId.value).toBe(row.teamId);
        (0, vitest_1.expect)(result?.seasonId.value).toBe(row.seasonId);
    });
    (0, vitest_1.it)('saveTeamSeason llama a upsert con teamId/seasonId', async () => {
        const roster = TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000'),
            teamId: TeamId_value_object_1.TeamId.fromString('223e4567-e89b-12d3-a456-426614174001'),
            seasonId: SeasonId_value_object_1.SeasonId.fromString('323e4567-e89b-12d3-a456-426614174002'),
            members: [],
        });
        mockUpsert.mockResolvedValue(undefined);
        await repository.saveTeamSeason(roster);
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith({
            where: { id: roster.teamSeasonId.value },
            update: {},
            create: {
                id: roster.teamSeasonId.value,
                teamId: roster.teamId.value,
                seasonId: roster.seasonId.value,
            },
        });
    });
    (0, vitest_1.it)('saveRoster elimina y recrea miembros', async () => {
        const roster = TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000'),
            teamId: TeamId_value_object_1.TeamId.fromString('223e4567-e89b-12d3-a456-426614174001'),
            seasonId: SeasonId_value_object_1.SeasonId.fromString('323e4567-e89b-12d3-a456-426614174002'),
            members: [
                RosterMember_1.RosterMember.create({
                    playerId: PlayerId_value_object_1.PlayerId.fromString('423e4567-e89b-12d3-a456-426614174003'),
                    position: 'PORTERO',
                }),
                RosterMember_1.RosterMember.create({
                    playerId: PlayerId_value_object_1.PlayerId.fromString('523e4567-e89b-12d3-a456-426614174004'),
                    position: 'DELANTERO',
                }),
            ],
        });
        mockDeleteMany.mockResolvedValue({ count: 2 });
        mockCreate.mockResolvedValue(undefined);
        await repository.saveRoster(roster);
        (0, vitest_1.expect)(mockDeleteMany).toHaveBeenCalledWith({
            where: { teamSeasonId: roster.teamSeasonId.value },
        });
        (0, vitest_1.expect)(mockCreate).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(mockCreate).toHaveBeenNthCalledWith(1, vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({
                teamSeasonId: roster.teamSeasonId.value,
                playerId: '423e4567-e89b-12d3-a456-426614174003',
                position: 'PORTERO',
            }),
        }));
    });
});
