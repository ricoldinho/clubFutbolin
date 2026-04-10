import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaPlayerRepository } from '@/adapters/persistence/players/PrismaPlayerRepository';
import { Player } from '@/domain/players/Player.entity';
import {
  Email,
  PhoneNumber,
  Birthdate,
  PlayerId,
} from '@/domain/players/value-objects';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { InfrastructureError } from '@/domain/shared/errors';

function makePrismaRow(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  lastname: string;
  nickname: string | null;
  phoneNumber: string;
  birthdate: Date;
  category: string;
  role: string;
}> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Manuel',
    lastname: 'Rico',
    nickname: null,
    phoneNumber: '600123123',
    birthdate: new Date('1990-01-01'),
    category: 'PRIMERA',
    role: 'USER',
    ...overrides,
  };
}

function makePlayer(overrides: Partial<{ id: PlayerId }> = {}) {
  return Player.create({
    id: overrides.id ?? PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000'),
    name: 'Manuel',
    lastname: 'Rico',
    nickname: null,
    email: Email.create('test@example.com'),
    phoneNumber: PhoneNumber.create('600123123'),
    birthdate: Birthdate.create(new Date('1990-01-01')),
    category: PlayerCategory.PRIMERA,
    role: PlayerRole.USER,
  });
}

describe('PrismaPlayerRepository', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();
  const mockUpsert = vi.fn();
  const mockDeleteMany = vi.fn();

  const mockPrisma = {
    player: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
    },
  };

  let repository: PrismaPlayerRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaPlayerRepository(mockPrisma as never);
  });

  describe('findByEmail', () => {
    it('devuelve null cuando no hay fila', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await repository.findByEmail(Email.create('other@example.com'));

      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'other@example.com' },
        select: expect.any(Object),
      });
    });

    it('devuelve Player de dominio cuando hay fila', async () => {
      const row = makePrismaRow({ email: 'a@b.com' });
      mockFindUnique.mockResolvedValue(row);

      const result = await repository.findByEmail(Email.create('a@b.com'));

      expect(result).not.toBeNull();
      expect(result?.email.value).toBe('a@b.com');
      expect(result?.name).toBe('Manuel');
    });
  });

  describe('findById', () => {
    it('devuelve null cuando no hay fila', async () => {
      mockFindUnique.mockResolvedValue(null);

      const id = PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000');
      const result = await repository.findById(id);

      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: id.value },
        select: expect.any(Object),
      });
    });

    it('devuelve Player de dominio cuando hay fila', async () => {
      const row = makePrismaRow();
      mockFindUnique.mockResolvedValue(row);

      const id = PlayerId.fromString(row.id);
      const result = await repository.findById(id);

      expect(result).not.toBeNull();
      expect(result?.id?.value).toBe(row.id);
      expect(result?.email.value).toBe(row.email);
    });
  });

  describe('findAll', () => {
    it('devuelve lista vacía cuando no hay filas', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('devuelve lista de Players cuando hay filas', async () => {
      const id1 = '123e4567-e89b-12d3-a456-426614174001';
      const id2 = '123e4567-e89b-12d3-a456-426614174002';
      const rows = [
        makePrismaRow({ id: id1 }),
        makePrismaRow({ id: id2, email: 'b@b.com' }),
      ];
      mockFindMany.mockResolvedValue(rows);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id?.value).toBe(id1);
      expect(result[1].email.value).toBe('b@b.com');
    });

    it('con paginación pasa skip, take, where y orderBy a findMany', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await repository.findAll({ page: 2, limit: 5 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: 'asc' },
          skip: 5,
          take: 5,
        }),
      );
      expect(mockCount).toHaveBeenCalledWith({ where: {} });
    });

    it('con búsqueda pasa OR insensible a mayúsculas en name, lastname y nickname', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await repository.findAll(
        { page: 1, limit: 10 },
        { searchQuery: '  ana  ' },
      );

      const expectedWhere = {
        OR: [
          { name: { contains: 'ana', mode: 'insensitive' } },
          { lastname: { contains: 'ana', mode: 'insensitive' } },
          { nickname: { contains: 'ana', mode: 'insensitive' } },
        ],
      };
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
    });
  });

  describe('save', () => {
    it('llama a upsert con datos del Player (con id)', async () => {
      mockFindUnique.mockResolvedValue({ id: makePlayer().id!.value });
      mockUpsert.mockResolvedValue(undefined);

      const player = makePlayer();
      await repository.save(player);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { id: player.id!.value },
        update: expect.objectContaining({
          email: player.email.value,
          name: player.name,
          lastname: player.lastname,
          nickname: player.nickname,
          phoneNumber: player.phoneNumber.value,
          birthdate: player.birthdate.value,
          category: player.category,
          role: player.role,
        }),
        create: expect.objectContaining({
          id: player.id!.value,
          email: player.email.value,
          name: player.name,
          role: player.role,
        }),
      });
    });

    it('lanza InfrastructureError si se crea un Player sin passwordHash', async () => {
      mockFindUnique.mockResolvedValue(null);

      const playerWithoutId = Player.create({
        name: 'Nuevo',
        lastname: 'Jugador',
        nickname: null,
        email: Email.create('nologin@example.com'),
        phoneNumber: PhoneNumber.create('600000001'),
        birthdate: Birthdate.create(new Date('2000-01-01')),
        category: PlayerCategory.PRIMERA,
        role: PlayerRole.USER,
      });

      try {
        await repository.save(playerWithoutId);
        expect.fail('debería haber lanzado');
      } catch (err) {
        expect(err).toBeInstanceOf(InfrastructureError);
        expect((err as Error).message).toBe(
          'Password hash is required when creating a new player',
        );
      }
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('genera id cuando el Player no tiene id (creación)', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockUpsert.mockResolvedValue(undefined);

      const playerWithoutId = Player.create({
        name: 'Nuevo',
        lastname: 'Jugador',
        nickname: null,
        email: Email.create('nuevo@example.com'),
        phoneNumber: PhoneNumber.create('600000000'),
        birthdate: Birthdate.create(new Date('2000-01-01')),
        category: PlayerCategory.PRIMERA,
        role: PlayerRole.USER,
      });

      await repository.save(playerWithoutId, 'fakePasswordHash');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            email: 'nuevo@example.com',
            name: 'Nuevo',
          }),
        }),
      );
      const createPayload = mockUpsert.mock.calls[0][0].create;
      expect(createPayload.id).toBeDefined();
      expect(typeof createPayload.id).toBe('string');
    });
  });

  describe('delete', () => {
    it('llama a deleteMany con el id', async () => {
      mockDeleteMany.mockResolvedValue({ count: 1 });

      const id = PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000');
      await repository.delete(id);

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: id.value },
      });
    });
  });
});
