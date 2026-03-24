import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaTeamRepository } from '@/adapters/persistence/teams/PrismaTeamRepository';
import { TeamId } from '@/domain/teams/TeamId.value-object';

function makePrismaRow(overrides: Partial<{ id: string; name: string; createdAt: Date }> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Equipo Alpha',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('PrismaTeamRepository', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpsert = vi.fn();
  const mockDeleteMany = vi.fn();

  const mockPrisma = {
    team: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
    },
  };

  let repository: PrismaTeamRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaTeamRepository(mockPrisma as never);
  });

  it('findById devuelve null cuando no hay fila', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findById(TeamId.fromString('123e4567-e89b-12d3-a456-426614174000'));
    expect(result).toBeNull();
  });

  it('findById devuelve Team cuando hay fila', async () => {
    const row = makePrismaRow();
    mockFindUnique.mockResolvedValue(row);
    const result = await repository.findById(TeamId.fromString(row.id));
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Equipo Alpha');
  });

  it('findByName devuelve Team cuando existe', async () => {
    const row = makePrismaRow();
    mockFindUnique.mockResolvedValue(row);
    const result = await repository.findByName('Equipo Alpha');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Equipo Alpha');
  });

  it('findByName devuelve null cuando no existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await repository.findByName('NoExiste');
    expect(result).toBeNull();
  });

  it('findAll devuelve lista de teams', async () => {
    const rows = [
      makePrismaRow(),
      makePrismaRow({ id: '223e4567-e89b-12d3-a456-426614174001', name: 'Equipo Beta' }),
    ];
    mockFindMany.mockResolvedValue(rows);
    const result = await repository.findAll();
    expect(result).toHaveLength(2);
  });
});
