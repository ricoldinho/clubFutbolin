"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PrismaPlayerRepository_1 = require("@/adapters/persistence/players/PrismaPlayerRepository");
const Player_entity_1 = require("@/domain/players/Player.entity");
const value_objects_1 = require("@/domain/players/value-objects");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const errors_1 = require("@/domain/shared/errors");
function makePrismaRow(overrides = {}) {
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
function makePlayer(overrides = {}) {
    return Player_entity_1.Player.create({
        id: overrides.id ?? value_objects_1.PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000'),
        name: 'Manuel',
        lastname: 'Rico',
        nickname: null,
        email: value_objects_1.Email.create('test@example.com'),
        phoneNumber: value_objects_1.PhoneNumber.create('600123123'),
        birthdate: value_objects_1.Birthdate.create(new Date('1990-01-01')),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    });
}
(0, vitest_1.describe)('PrismaPlayerRepository', () => {
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockCount = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    const mockDeleteMany = vitest_1.vi.fn();
    const mockPrisma = {
        player: {
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            count: mockCount,
            upsert: mockUpsert,
            deleteMany: mockDeleteMany,
        },
    };
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new PrismaPlayerRepository_1.PrismaPlayerRepository(mockPrisma);
    });
    (0, vitest_1.describe)('findByEmail', () => {
        (0, vitest_1.it)('devuelve null cuando no hay fila', async () => {
            mockFindUnique.mockResolvedValue(null);
            const result = await repository.findByEmail(value_objects_1.Email.create('other@example.com'));
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(mockFindUnique).toHaveBeenCalledWith({
                where: { email: 'other@example.com' },
                select: vitest_1.expect.any(Object),
            });
        });
        (0, vitest_1.it)('devuelve Player de dominio cuando hay fila', async () => {
            const row = makePrismaRow({ email: 'a@b.com' });
            mockFindUnique.mockResolvedValue(row);
            const result = await repository.findByEmail(value_objects_1.Email.create('a@b.com'));
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result?.email.value).toBe('a@b.com');
            (0, vitest_1.expect)(result?.name).toBe('Manuel');
        });
    });
    (0, vitest_1.describe)('findById', () => {
        (0, vitest_1.it)('devuelve null cuando no hay fila', async () => {
            mockFindUnique.mockResolvedValue(null);
            const id = value_objects_1.PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000');
            const result = await repository.findById(id);
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(mockFindUnique).toHaveBeenCalledWith({
                where: { id: id.value },
                select: vitest_1.expect.any(Object),
            });
        });
        (0, vitest_1.it)('devuelve Player de dominio cuando hay fila', async () => {
            const row = makePrismaRow();
            mockFindUnique.mockResolvedValue(row);
            const id = value_objects_1.PlayerId.fromString(row.id);
            const result = await repository.findById(id);
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result?.id?.value).toBe(row.id);
            (0, vitest_1.expect)(result?.email.value).toBe(row.email);
        });
    });
    (0, vitest_1.describe)('findAll', () => {
        (0, vitest_1.it)('devuelve lista vacía cuando no hay filas', async () => {
            mockFindMany.mockResolvedValue([]);
            const result = await repository.findAll();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('devuelve lista de Players cuando hay filas', async () => {
            const id1 = '123e4567-e89b-12d3-a456-426614174001';
            const id2 = '123e4567-e89b-12d3-a456-426614174002';
            const rows = [
                makePrismaRow({ id: id1 }),
                makePrismaRow({ id: id2, email: 'b@b.com' }),
            ];
            mockFindMany.mockResolvedValue(rows);
            const result = await repository.findAll();
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].id?.value).toBe(id1);
            (0, vitest_1.expect)(result[1].email.value).toBe('b@b.com');
        });
        (0, vitest_1.it)('con paginación pasa skip, take, where y orderBy a findMany', async () => {
            mockFindMany.mockResolvedValue([]);
            mockCount.mockResolvedValue(0);
            await repository.findAll({ page: 2, limit: 5 });
            (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: {},
                orderBy: { createdAt: 'asc' },
                skip: 5,
                take: 5,
            }));
            (0, vitest_1.expect)(mockCount).toHaveBeenCalledWith({ where: {} });
        });
        (0, vitest_1.it)('con búsqueda pasa OR insensible a mayúsculas en name, lastname y nickname', async () => {
            mockFindMany.mockResolvedValue([]);
            mockCount.mockResolvedValue(0);
            await repository.findAll({ page: 1, limit: 10 }, { searchQuery: '  ana  ' });
            const expectedWhere = {
                OR: [
                    { name: { contains: 'ana', mode: 'insensitive' } },
                    { lastname: { contains: 'ana', mode: 'insensitive' } },
                    { nickname: { contains: 'ana', mode: 'insensitive' } },
                ],
            };
            (0, vitest_1.expect)(mockFindMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: expectedWhere,
            }));
            (0, vitest_1.expect)(mockCount).toHaveBeenCalledWith({ where: expectedWhere });
        });
    });
    (0, vitest_1.describe)('save', () => {
        (0, vitest_1.it)('llama a upsert con datos del Player (con id)', async () => {
            mockFindUnique.mockResolvedValue({ id: makePlayer().id.value });
            mockUpsert.mockResolvedValue(undefined);
            const player = makePlayer();
            await repository.save(player);
            (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith({
                where: { id: player.id.value },
                update: vitest_1.expect.objectContaining({
                    email: player.email.value,
                    name: player.name,
                    lastname: player.lastname,
                    nickname: player.nickname,
                    phoneNumber: player.phoneNumber.value,
                    birthdate: player.birthdate.value,
                    category: player.category,
                    role: player.role,
                }),
                create: vitest_1.expect.objectContaining({
                    id: player.id.value,
                    email: player.email.value,
                    name: player.name,
                    role: player.role,
                }),
            });
        });
        (0, vitest_1.it)('lanza InfrastructureError si se crea un Player sin passwordHash', async () => {
            mockFindUnique.mockResolvedValue(null);
            const playerWithoutId = Player_entity_1.Player.create({
                name: 'Nuevo',
                lastname: 'Jugador',
                nickname: null,
                email: value_objects_1.Email.create('nologin@example.com'),
                phoneNumber: value_objects_1.PhoneNumber.create('600000001'),
                birthdate: value_objects_1.Birthdate.create(new Date('2000-01-01')),
                category: PlayerCategory_1.PlayerCategory.PRIMERA,
                role: PlayerRole_1.PlayerRole.USER,
            });
            try {
                await repository.save(playerWithoutId);
                vitest_1.expect.fail('debería haber lanzado');
            }
            catch (err) {
                (0, vitest_1.expect)(err).toBeInstanceOf(errors_1.InfrastructureError);
                (0, vitest_1.expect)(err.message).toBe('Password hash is required when creating a new player');
            }
            (0, vitest_1.expect)(mockUpsert).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('genera id cuando el Player no tiene id (creación)', async () => {
            mockFindUnique.mockResolvedValue(null);
            mockUpsert.mockResolvedValue(undefined);
            const playerWithoutId = Player_entity_1.Player.create({
                name: 'Nuevo',
                lastname: 'Jugador',
                nickname: null,
                email: value_objects_1.Email.create('nuevo@example.com'),
                phoneNumber: value_objects_1.PhoneNumber.create('600000000'),
                birthdate: value_objects_1.Birthdate.create(new Date('2000-01-01')),
                category: PlayerCategory_1.PlayerCategory.PRIMERA,
                role: PlayerRole_1.PlayerRole.USER,
            });
            await repository.save(playerWithoutId, 'fakePasswordHash');
            (0, vitest_1.expect)(mockUpsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                create: vitest_1.expect.objectContaining({
                    email: 'nuevo@example.com',
                    name: 'Nuevo',
                }),
            }));
            const createPayload = mockUpsert.mock.calls[0][0].create;
            (0, vitest_1.expect)(createPayload.id).toBeDefined();
            (0, vitest_1.expect)(typeof createPayload.id).toBe('string');
        });
    });
    (0, vitest_1.describe)('delete', () => {
        (0, vitest_1.it)('llama a deleteMany con el id', async () => {
            mockDeleteMany.mockResolvedValue({ count: 1 });
            const id = value_objects_1.PlayerId.fromString('123e4567-e89b-12d3-a456-426614174000');
            await repository.delete(id);
            (0, vitest_1.expect)(mockDeleteMany).toHaveBeenCalledWith({
                where: { id: id.value },
            });
        });
    });
});
