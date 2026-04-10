import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaTeamRepository } from '@/adapters/persistence/teams/PrismaTeamRepository';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Team } from '@/domain/teams/Team.entity';

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

  it('findAll con paginación devuelve data + total y usa skip/take', async () => {
    const mockCount = vi.fn().mockResolvedValue(5);
    const prismaWithCount = {
      ...mockPrisma,
      team: { ...mockPrisma.team, count: mockCount },
    };
    const paginatedRepository = new PrismaTeamRepository(prismaWithCount as never);
    mockFindMany.mockResolvedValue([makePrismaRow()]);

    const result = await paginatedRepository.findAll({ page: 2, limit: 2 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 2,
        take: 2,
        orderBy: { createdAt: 'asc' },
      }),
    );
    expect(mockCount).toHaveBeenCalledWith({ where: {} });
    expect(result).toEqual({
      data: expect.any(Array),
      total: 5,
    });
  });

  it('findAll con búsqueda pasa contains insensible a mayúsculas en name', async () => {
    const mockCount = vi.fn().mockResolvedValue(1);
    const prismaWithCount = {
      ...mockPrisma,
      team: { ...mockPrisma.team, count: mockCount },
    };
    const paginatedRepository = new PrismaTeamRepository(prismaWithCount as never);
    mockFindMany.mockResolvedValue([makePrismaRow({ name: 'Beta FC' })]);

    await paginatedRepository.findAll(
      { page: 1, limit: 10 },
      { searchQuery: '  beta  ' },
    );

    const expectedWhere = { name: { contains: 'beta', mode: 'insensitive' } };
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('save con id existente hace upsert con where/update correctos', async () => {
    const id = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const team = Team.create({
      id,
      name: 'Equipo Save',
      createdAt: new Date('2024-01-01'),
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.save(team);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: id.value },
        update: { name: 'Equipo Save' },
        create: expect.objectContaining({
          id: id.value,
          name: 'Equipo Save',
        }),
      }),
    );
  });

  it('save sin id genera uuid para create', async () => {
    const team = Team.create({
      name: 'Equipo Nuevo',
      createdAt: new Date('2024-02-01'),
    });
    mockUpsert.mockResolvedValue(undefined);

    await repository.save(team);

    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.where.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payload.create.name).toBe('Equipo Nuevo');
  });

  it('delete llama a deleteMany con id', async () => {
    const id = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    mockDeleteMany.mockResolvedValue({ count: 1 });

    await repository.delete(id);

    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: id.value } });
  });
});
