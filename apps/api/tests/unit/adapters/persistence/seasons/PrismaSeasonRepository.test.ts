import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaSeasonRepository } from '@/adapters/persistence/seasons/PrismaSeasonRepository';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

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

  it('findByLeagueId filtra por liga', async () => {
    const leagueId = LeagueId.generate();
    mockFindMany.mockResolvedValue([makeRow({ leagueId: leagueId.value })]);
    const result = await repository.findByLeagueId(leagueId);
    expect(result).toHaveLength(1);
  });
});
