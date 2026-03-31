import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaMatchRepository } from '@/adapters/persistence/matches/PrismaMatchRepository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

describe('PrismaMatchRepository', () => {
  const mockCount = vi.fn();
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpsert = vi.fn();
  const mockCreateMany = vi.fn();

  const mockPrisma = {
    match: {
      count: mockCount,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      upsert: mockUpsert,
      createMany: mockCreateMany,
    },
  };

  let repository: PrismaMatchRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaMatchRepository(mockPrisma as never);
  });

  it('existsBySeasonId devuelve true si hay partidos', async () => {
    mockCount.mockResolvedValue(1);
    const exists = await repository.existsBySeasonId(SeasonId.generate());
    expect(exists).toBe(true);
  });

  it('findById devuelve null cuando no existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findById(MatchId.generate());
    expect(result).toBeNull();
  });

  it('findBySeasonId devuelve data y total', async () => {
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

    const result = await repository.findBySeasonId(SeasonId.fromString(row.seasonId), {
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id?.value).toBe(row.id);
  });

  it('saveMany hace createMany', async () => {
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });
    mockCreateMany.mockResolvedValue({ count: 1 });

    await repository.saveMany([match]);

    expect(mockCreateMany).toHaveBeenCalledTimes(1);
  });

  it('save usa upsert', async () => {
    const match = Match.create({
      id: MatchId.generate(),
      seasonId: SeasonId.generate(),
      homeTeamSeasonId: TeamSeasonId.generate(),
      awayTeamSeasonId: TeamSeasonId.generate(),
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.save(match);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
