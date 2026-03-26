import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

// Prisma 7 exige un adapter en el constructor; el setup de integración ya ha asignado DATABASE_URL.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaPlayerRepository(prisma);

function makePlayer(overrides: Partial<{
  id: PlayerId;
  email: string;
  name: string;
  lastname: string;
  nickname: string | null;
  phoneNumber: string;
  birthdate: Date | string;
  category: PlayerCategory;
  role: PlayerRole;
}> = {}): Player {
  const defaults = {
    name: 'Juan',
    lastname: 'García',
    nickname: 'Juani' as string | null,
    email: 'juan.garcia@example.com',
    phoneNumber: '612345678',
    birthdate: new Date('1995-05-15'),
    category: PlayerCategory.TERCERA,
    role: PlayerRole.USER,
  };
  const opts = { ...defaults, ...overrides };
  const props = {
    ...(opts.id && { id: opts.id }),
    name: opts.name,
    lastname: opts.lastname,
    nickname: opts.nickname,
    email: Email.create(opts.email),
    phoneNumber: PhoneNumber.create(opts.phoneNumber),
    birthdate: Birthdate.create(opts.birthdate),
    category: opts.category,
    role: opts.role,
  };
  return Player.create(props as Parameters<typeof Player.create>[0]);
}

describe('PrismaPlayerRepository (integración)', () => {
  beforeEach(async () => {
    await prisma.player.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('save: persiste un jugador nuevo y findById lo recupera', async () => {
    const id = PlayerId.generate();
    const player = makePlayer({
      id,
      email: 'save-findbyid@example.com',
      name: 'Ana',
      lastname: 'López',
    });

    await repository.save(player, 'testPasswordHash');

    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found!.email.value).toBe('save-findbyid@example.com');
    expect(found!.name).toBe('Ana');
    expect(found!.lastname).toBe('López');
    expect(found!.nickname).toBe('Juani');
    expect(found!.phoneNumber.value).toBe('612345678');
    expect(found!.category).toBe(PlayerCategory.TERCERA);
  });

  it('findById: devuelve null si el jugador no existe', async () => {
    const id = PlayerId.generate();
    const found = await repository.findById(id);
    expect(found).toBeNull();
  });

  it('findAll: devuelve lista vacía cuando no hay jugadores', async () => {
    const list = await repository.findAll();
    expect(list).toEqual([]);
  });

  it('findAll: devuelve todos los jugadores guardados', async () => {
    const p1 = makePlayer({ email: 'all1@example.com', name: 'One' });
    const p2 = makePlayer({ email: 'all2@example.com', name: 'Two' });
    await repository.save(p1, 'hash1');
    await repository.save(p2, 'hash2');

    const list = await repository.findAll();
    expect(list).toHaveLength(2);
    const emails = list.map((p) => p.email.value).sort();
    expect(emails).toEqual(['all1@example.com', 'all2@example.com']);
  });

  it('findAll con paginación devuelve ventanas según createdAt', async () => {
    const p1 = makePlayer({ email: 'pag1@example.com', name: 'P1' });
    const p2 = makePlayer({ email: 'pag2@example.com', name: 'P2' });
    const p3 = makePlayer({ email: 'pag3@example.com', name: 'P3' });
    await repository.save(p1, 'h1');
    await repository.save(p2, 'h2');
    await repository.save(p3, 'h3');

    const firstPage = await repository.findAll({ page: 1, limit: 2 });
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.total).toBe(3);
    const secondPage = await repository.findAll({ page: 2, limit: 2 });
    expect(secondPage.data).toHaveLength(1);
  });

  it('findByEmail: recupera por email', async () => {
    const player = makePlayer({ email: 'byemail@example.com' });
    await repository.save(player, 'hash');

    const found = await repository.findByEmail(Email.create('byemail@example.com'));
    expect(found).not.toBeNull();
    expect(found!.email.value).toBe('byemail@example.com');
  });

  it('findByEmail: devuelve null si el email no existe', async () => {
    const found = await repository.findByEmail(Email.create('noexiste@example.com'));
    expect(found).toBeNull();
  });

  it('findLoginDataByEmail: devuelve playerId, role y passwordHash cuando el email existe', async () => {
    const id = PlayerId.generate();
    const player = makePlayer({
      id,
      email: 'login@example.com',
    });
    const storedHash = '$2b$10$storedHashForLoginTest';
    await repository.save(player, storedHash);

    const loginData = await repository.findLoginDataByEmail(Email.create('login@example.com'));

    expect(loginData).not.toBeNull();
    expect(loginData!.playerId.value).toBe(id.value);
    expect(loginData!.role).toBe(PlayerRole.USER);
    expect(loginData!.passwordHash).toBe(storedHash);
  });

  it('findLoginDataByEmail: devuelve role ADMIN cuando el jugador tiene role ADMIN', async () => {
    const id = PlayerId.generate();
    const player = makePlayer({
      id,
      email: 'admin-login@example.com',
      role: PlayerRole.ADMIN,
    });
    await repository.save(player, 'adminHash');

    const loginData = await repository.findLoginDataByEmail(Email.create('admin-login@example.com'));

    expect(loginData).not.toBeNull();
    expect(loginData!.role).toBe(PlayerRole.ADMIN);
    expect(loginData!.passwordHash).toBe('adminHash');
  });

  it('findLoginDataByEmail: devuelve null cuando el email no existe', async () => {
    const loginData = await repository.findLoginDataByEmail(Email.create('noexiste-login@example.com'));
    expect(loginData).toBeNull();
  });

  it('delete: elimina el jugador y findById ya no lo encuentra', async () => {
    const id = PlayerId.generate();
    const player = makePlayer({ id, email: 'todelete@example.com' });
    await repository.save(player, 'hash');

    await repository.delete(id);

    const found = await repository.findById(id);
    expect(found).toBeNull();
  });
});
