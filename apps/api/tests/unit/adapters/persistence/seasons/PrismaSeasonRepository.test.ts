import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaSeasonRepository } from '@/adapters/persistence/seasons/PrismaSeasonRepository';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { Season } from '@/domain/seasons/Season.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';

function makeRow(overrides: Partial<{
  id: string;
  year: number;
  leagueId: string;
  championId: string | null;
  secondId: string | null;
}> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    year: 2025,
    leagueId: '223e4567-e89b-12d3-a456-426614174001',
    championId: null as string | null,
    secondId: null as string | null,
    ...overrides,
  };
}

describe('PrismaSeasonRepository', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpsert = vi.fn();
  const mockDeleteMany = vi.fn();

  const mockPrisma = {
    season: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
    },
  };

  let repository: PrismaSeasonRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaSeasonRepository(mockPrisma as never);
  });

  it('findById devuelve null cuando no hay fila', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findById(SeasonId.fromString(makeRow().id));
    expect(result).toBeNull();
  });

  it('findById devuelve Season cuando hay fila', async () => {
    const row = makeRow();
    mockFindUnique.mockResolvedValue(row);
    const result = await repository.findById(SeasonId.fromString(row.id));
    expect(result).not.toBeNull();
    expect(result?.year).toBe(2025);
  });

  it('findAll devuelve lista', async () => {
    mockFindMany.mockResolvedValue([
      makeRow(),
      makeRow({ id: '323e4567-e89b-12d3-a456-426614174002', year: 2024 }),
    ]);
    const result = await repository.findAll();
    expect(result).toHaveLength(2);
  });

  it('findAll con paginación devuelve data + total y usa skip/take', async () => {
    const mockCount = vi.fn().mockResolvedValue(9);
    const prismaWithCount = {
      ...mockPrisma,
      season: { ...mockPrisma.season, count: mockCount },
    };
    const paginatedRepository = new PrismaSeasonRepository(prismaWithCount as never);
    mockFindMany.mockResolvedValue([makeRow()]);

    const result = await paginatedRepository.findAll({ page: 3, limit: 4 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 8,
        take: 4,
        orderBy: [{ year: 'asc' }, { id: 'asc' }],
      }),
    );
    expect(result).toEqual({
      data: expect.any(Array),
      total: 9,
    });
  });

  it('findByLeagueId filtra por liga', async () => {
    const leagueId = LeagueId.generate();
    mockFindMany.mockResolvedValue([makeRow({ leagueId: leagueId.value })]);
    const result = await repository.findByLeagueId(leagueId);
    expect(result).toHaveLength(1);
  });

  it('save con id existente hace upsert con campeon/subcampeon', async () => {
    const id = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const leagueId = LeagueId.fromString('223e4567-e89b-12d3-a456-426614174001');
    const championId = TeamId.fromString('323e4567-e89b-12d3-a456-426614174002');
    const secondId = TeamId.fromString('423e4567-e89b-12d3-a456-426614174003');
    const season = Season.create({
      id,
      year: 2027,
      leagueId,
      championId,
      secondId,
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.save(season);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: id.value },
        update: expect.objectContaining({
          year: 2027,
          leagueId: leagueId.value,
          championId: championId.value,
          secondId: secondId.value,
        }),
      }),
    );
  });

  it('save sin id genera uuid y admite null en campeon/subcampeon', async () => {
    const season = Season.create({
      year: 2028,
      leagueId: LeagueId.fromString('223e4567-e89b-12d3-a456-426614174001'),
      championId: null,
      secondId: null,
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.save(season);

    const call = mockUpsert.mock.calls[0][0];
    expect(call.where.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(call.create.championId).toBeNull();
    expect(call.create.secondId).toBeNull();
  });

  it('delete llama a deleteMany con el id', async () => {
    const id = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    mockDeleteMany.mockResolvedValue({ count: 1 });

    await repository.delete(id);

    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
  });
});
