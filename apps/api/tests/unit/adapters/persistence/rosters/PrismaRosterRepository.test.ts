import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaRosterRepository } from '@/adapters/persistence/rosters/PrismaRosterRepository';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { RosterMember } from '@/domain/rosters/RosterMember';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

function makeRow(overrides: Partial<{
  id: string;
  teamId: string;
  seasonId: string;
  rosterPlayers: { playerId: string; position: string }[];
}> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    teamId: '223e4567-e89b-12d3-a456-426614174001',
    seasonId: '323e4567-e89b-12d3-a456-426614174002',
    rosterPlayers: [] as { playerId: string; position: string }[],
    ...overrides,
  };
}

describe('PrismaRosterRepository', () => {
  const mockFindFirst = vi.fn();
  const mockFindUnique = vi.fn();
  const mockUpsert = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockCreate = vi.fn();

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

  let repository: PrismaRosterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaRosterRepository(mockPrisma as never);
  });

  it('findById devuelve null cuando no hay fila', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findById(TeamSeasonId.fromString(makeRow().id));
    expect(result).toBeNull();
  });

  it('findById devuelve TeamRoster cuando hay fila', async () => {
    const row = makeRow({
      rosterPlayers: [{ playerId: '423e4567-e89b-12d3-a456-426614174003', position: 'PORTERO' }],
    });
    mockFindUnique.mockResolvedValue(row);
    const result = await repository.findById(TeamSeasonId.fromString(row.id));
    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
  });

  it('findTeamSeasonByTeamAndSeason devuelve null cuando no existe', async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await repository.findTeamSeasonByTeamAndSeason(
      TeamId.generate(),
      SeasonId.generate(),
    );
    expect(result).toBeNull();
  });

  it('findTeamSeasonByTeamAndSeason devuelve TeamRoster cuando existe', async () => {
    const row = makeRow();
    mockFindFirst.mockResolvedValue(row);
    const teamId = TeamId.fromString(row.teamId);
    const seasonId = SeasonId.fromString(row.seasonId);

    const result = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);

    expect(result).not.toBeNull();
    expect(result?.teamId.value).toBe(row.teamId);
    expect(result?.seasonId.value).toBe(row.seasonId);
  });

  it('saveTeamSeason llama a upsert con teamId/seasonId', async () => {
    const roster = TeamRoster.create({
      teamSeasonId: TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000'),
      teamId: TeamId.fromString('223e4567-e89b-12d3-a456-426614174001'),
      seasonId: SeasonId.fromString('323e4567-e89b-12d3-a456-426614174002'),
      members: [],
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.saveTeamSeason(roster);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { id: roster.teamSeasonId.value },
      update: {},
      create: {
        id: roster.teamSeasonId.value,
        teamId: roster.teamId.value,
        seasonId: roster.seasonId.value,
      },
    });
  });

  it('saveRoster elimina y recrea miembros', async () => {
    const roster = TeamRoster.create({
      teamSeasonId: TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000'),
      teamId: TeamId.fromString('223e4567-e89b-12d3-a456-426614174001'),
      seasonId: SeasonId.fromString('323e4567-e89b-12d3-a456-426614174002'),
      members: [
        RosterMember.create({
          playerId: PlayerId.fromString('423e4567-e89b-12d3-a456-426614174003'),
          position: 'PORTERO',
        }),
        RosterMember.create({
          playerId: PlayerId.fromString('523e4567-e89b-12d3-a456-426614174004'),
          position: 'DELANTERO',
        }),
      ],
    });
    mockDeleteMany.mockResolvedValue({ count: 2 });
    mockCreate.mockResolvedValue(undefined);

    await repository.saveRoster(roster);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { teamSeasonId: roster.teamSeasonId.value },
    });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          teamSeasonId: roster.teamSeasonId.value,
          playerId: '423e4567-e89b-12d3-a456-426614174003',
          position: 'PORTERO',
        }),
      }),
    );
  });
});
