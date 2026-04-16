"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PrismaPlayerRepository_1 = require("@/adapters/persistence/players/PrismaPlayerRepository");
const Player_entity_1 = require("@/domain/players/Player.entity");
const value_objects_1 = require("@/domain/players/value-objects");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
// Prisma 7 exige un adapter en el constructor; el setup de integración ya ha asignado DATABASE_URL.
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const repository = new PrismaPlayerRepository_1.PrismaPlayerRepository(prisma);
function makePlayer(overrides = {}) {
    const defaults = {
        name: 'Juan',
        lastname: 'García',
        nickname: 'Juani',
        email: 'juan.garcia@example.com',
        phoneNumber: '612345678',
        birthdate: new Date('1995-05-15'),
        category: PlayerCategory_1.PlayerCategory.TERCERA,
        role: PlayerRole_1.PlayerRole.USER,
    };
    const opts = { ...defaults, ...overrides };
    const props = {
        ...(opts.id && { id: opts.id }),
        name: opts.name,
        lastname: opts.lastname,
        nickname: opts.nickname,
        email: value_objects_1.Email.create(opts.email),
        phoneNumber: value_objects_1.PhoneNumber.create(opts.phoneNumber),
        birthdate: value_objects_1.Birthdate.create(opts.birthdate),
        category: opts.category,
        role: opts.role,
    };
    return Player_entity_1.Player.create(props);
}
(0, vitest_1.describe)('PrismaPlayerRepository (integración)', () => {
    (0, vitest_1.beforeEach)(async () => {
        await prisma.player.deleteMany({});
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('save: persiste un jugador nuevo y findById lo recupera', async () => {
        const id = value_objects_1.PlayerId.generate();
        const player = makePlayer({
            id,
            email: 'save-findbyid@example.com',
            name: 'Ana',
            lastname: 'López',
        });
        await repository.save(player, 'testPasswordHash');
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.email.value).toBe('save-findbyid@example.com');
        (0, vitest_1.expect)(found.name).toBe('Ana');
        (0, vitest_1.expect)(found.lastname).toBe('López');
        (0, vitest_1.expect)(found.nickname).toBe('Juani');
        (0, vitest_1.expect)(found.phoneNumber.value).toBe('612345678');
        (0, vitest_1.expect)(found.category).toBe(PlayerCategory_1.PlayerCategory.TERCERA);
    });
    (0, vitest_1.it)('findById: devuelve null si el jugador no existe', async () => {
        const id = value_objects_1.PlayerId.generate();
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('findAll: devuelve lista vacía cuando no hay jugadores', async () => {
        const list = await repository.findAll();
        (0, vitest_1.expect)(list).toEqual([]);
    });
    (0, vitest_1.it)('findAll: devuelve todos los jugadores guardados', async () => {
        const p1 = makePlayer({ email: 'all1@example.com', name: 'One' });
        const p2 = makePlayer({ email: 'all2@example.com', name: 'Two' });
        await repository.save(p1, 'hash1');
        await repository.save(p2, 'hash2');
        const list = await repository.findAll();
        (0, vitest_1.expect)(list).toHaveLength(2);
        const emails = list.map((p) => p.email.value).sort();
        (0, vitest_1.expect)(emails).toEqual(['all1@example.com', 'all2@example.com']);
    });
    (0, vitest_1.it)('findAll con paginación devuelve ventanas según createdAt', async () => {
        const p1 = makePlayer({ email: 'pag1@example.com', name: 'P1' });
        const p2 = makePlayer({ email: 'pag2@example.com', name: 'P2' });
        const p3 = makePlayer({ email: 'pag3@example.com', name: 'P3' });
        await repository.save(p1, 'h1');
        await repository.save(p2, 'h2');
        await repository.save(p3, 'h3');
        const firstPage = await repository.findAll({ page: 1, limit: 2 });
        (0, vitest_1.expect)(firstPage.data).toHaveLength(2);
        (0, vitest_1.expect)(firstPage.total).toBe(3);
        const secondPage = await repository.findAll({ page: 2, limit: 2 });
        (0, vitest_1.expect)(secondPage.data).toHaveLength(1);
    });
    (0, vitest_1.it)('findAll con paginación y searchQuery filtra por nombre, apellidos o alias', async () => {
        const pMatch = makePlayer({
            email: 'search-hit@example.com',
            name: 'Carmen',
            lastname: 'Vega',
            nickname: 'carmela',
        });
        const pOther = makePlayer({
            email: 'search-miss@example.com',
            name: 'Luis',
            lastname: 'Nada',
            nickname: null,
        });
        await repository.save(pMatch, 'h1');
        await repository.save(pOther, 'h2');
        const byName = await repository.findAll({ page: 1, limit: 10 }, { searchQuery: 'Car' });
        (0, vitest_1.expect)(byName.total).toBe(1);
        (0, vitest_1.expect)(byName.data[0].name).toBe('Carmen');
        const byNickname = await repository.findAll({ page: 1, limit: 10 }, { searchQuery: 'mel' });
        (0, vitest_1.expect)(byNickname.total).toBe(1);
        (0, vitest_1.expect)(byNickname.data[0].nickname).toBe('carmela');
    });
    (0, vitest_1.it)('findByEmail: recupera por email', async () => {
        const player = makePlayer({ email: 'byemail@example.com' });
        await repository.save(player, 'hash');
        const found = await repository.findByEmail(value_objects_1.Email.create('byemail@example.com'));
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found.email.value).toBe('byemail@example.com');
    });
    (0, vitest_1.it)('findByEmail: devuelve null si el email no existe', async () => {
        const found = await repository.findByEmail(value_objects_1.Email.create('noexiste@example.com'));
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('findLoginDataByEmail: devuelve playerId, role y passwordHash cuando el email existe', async () => {
        const id = value_objects_1.PlayerId.generate();
        const player = makePlayer({
            id,
            email: 'login@example.com',
        });
        const storedHash = '$2b$10$storedHashForLoginTest';
        await repository.save(player, storedHash);
        const loginData = await repository.findLoginDataByEmail(value_objects_1.Email.create('login@example.com'));
        (0, vitest_1.expect)(loginData).not.toBeNull();
        (0, vitest_1.expect)(loginData.playerId.value).toBe(id.value);
        (0, vitest_1.expect)(loginData.role).toBe(PlayerRole_1.PlayerRole.USER);
        (0, vitest_1.expect)(loginData.passwordHash).toBe(storedHash);
    });
    (0, vitest_1.it)('findLoginDataByEmail: devuelve role ADMIN cuando el jugador tiene role ADMIN', async () => {
        const id = value_objects_1.PlayerId.generate();
        const player = makePlayer({
            id,
            email: 'admin-login@example.com',
            role: PlayerRole_1.PlayerRole.ADMIN,
        });
        await repository.save(player, 'adminHash');
        const loginData = await repository.findLoginDataByEmail(value_objects_1.Email.create('admin-login@example.com'));
        (0, vitest_1.expect)(loginData).not.toBeNull();
        (0, vitest_1.expect)(loginData.role).toBe(PlayerRole_1.PlayerRole.ADMIN);
        (0, vitest_1.expect)(loginData.passwordHash).toBe('adminHash');
    });
    (0, vitest_1.it)('findLoginDataByEmail: devuelve null cuando el email no existe', async () => {
        const loginData = await repository.findLoginDataByEmail(value_objects_1.Email.create('noexiste-login@example.com'));
        (0, vitest_1.expect)(loginData).toBeNull();
    });
    (0, vitest_1.it)('delete: elimina el jugador y findById ya no lo encuentra', async () => {
        const id = value_objects_1.PlayerId.generate();
        const player = makePlayer({ id, email: 'todelete@example.com' });
        await repository.save(player, 'hash');
        await repository.delete(id);
        const found = await repository.findById(id);
        (0, vitest_1.expect)(found).toBeNull();
    });
});
