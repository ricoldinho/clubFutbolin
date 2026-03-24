import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaLeagueRepository } from '@/adapters/persistence/leagues/PrismaLeagueRepository';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { League } from '@/domain/leagues/League.entity';

function makePrismaRow(overrides: Partial<{ id: string; name: string; leagueCategory: string }> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Liga Provincial',
    leagueCategory: 'PRIMERA',
    ...overrides,
  };
}

describe('PrismaLeagueRepository', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpsert = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockCount = vi.fn();

  const mockPrisma = {
    league: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
    },
    season: { count: mockCount },
  };

  let repository: PrismaLeagueRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLeagueRepository(mockPrisma as never);
  });

  it('findById devuelve null cuando no hay fila', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findById(LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000'));
    expect(result).toBeNull();
  });

  it('findById devuelve League cuando hay fila', async () => {
    const row = makePrismaRow();
    mockFindUnique.mockResolvedValue(row);
    const result = await repository.findById(LeagueId.fromString(row.id));
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Liga Provincial');
    expect(result?.leagueCategory).toBe('PRIMERA');
  });

  it('findAll devuelve lista de leagues', async () => {
    const rows = [
      makePrismaRow(),
      makePrismaRow({ id: '223e4567-e89b-12d3-a456-426614174001', name: 'Liga B', leagueCategory: 'ELITE' }),
    ];
    mockFindMany.mockResolvedValue(rows);
    const result = await repository.findAll();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Liga Provincial');
    expect(result[1].name).toBe('Liga B');
  });

  it('save con league que tiene id llama upsert con update', async () => {
    const leagueId = LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const league = League.create({
      id: leagueId,
      name: 'Liga X',
      leagueCategory: 'PRIMERA',
    });
    mockUpsert.mockResolvedValue({ id: leagueId.value, name: 'Liga X', leagueCategory: 'PRIMERA' });
    await repository.save(league);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: leagueId.value },
        update: { name: 'Liga X', leagueCategory: 'PRIMERA' },
      }),
    );
  });

  it('save con league sin id usa generate para create', async () => {
    const league = League.create({
      name: 'Liga Nueva',
      leagueCategory: 'ELITE',
    });
    mockUpsert.mockResolvedValue({});
    await repository.save(league);
    expect(mockUpsert).toHaveBeenCalled();
    const call = mockUpsert.mock.calls[0][0];
    expect(call.create.name).toBe('Liga Nueva');
    expect(call.where.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('delete llama a deleteMany', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    const id = LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
    await repository.delete(id);
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
  });

  it('countSeasonsByLeagueId devuelve el conteo', async () => {
    mockCount.mockResolvedValue(3);
    const id = LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const result = await repository.countSeasonsByLeagueId(id);
    expect(result).toBe(3);
  });
});
