import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaRefreshTokenSessionRepository } from '@/adapters/persistence/auth/PrismaRefreshTokenSessionRepository';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaRefreshTokenSessionRepository(prisma);

const playerId = '11111111-1111-4111-8111-111111111111';

describe('PrismaRefreshTokenSessionRepository (integración)', () => {
  beforeEach(async () => {
    await prisma.refreshTokenSession.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.player.create({
      data: {
        id: playerId,
        email: 'refresh-session@example.com',
        name: 'Refresh',
        lastname: 'Tester',
        nickname: null,
        phoneNumber: '600999888',
        birthdate: new Date('1990-01-01T00:00:00.000Z'),
        category: 'CUARTA',
        role: 'USER',
        passwordHash: 'hash',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('create y findByJti persisten y recuperan una sesión', async () => {
    const jti = '22222222-2222-4222-8222-222222222222';
    const family = '33333333-3333-4333-8333-333333333333';
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');

    await repository.create({ jti, family, playerId, expiresAt });

    const stored = await repository.findByJti(jti);
    expect(stored).not.toBeNull();
    expect(stored?.family).toBe(family);
    expect(stored?.playerId).toBe(playerId);
  });

  it('rotate marca sesión antigua y crea una nueva', async () => {
    const currentJti = '44444444-4444-4444-8444-444444444444';
    const nextJti = '55555555-5555-4555-8555-555555555555';
    const family = '66666666-6666-4666-8666-666666666666';

    await repository.create({
      jti: currentJti,
      family,
      playerId,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    await repository.rotate(currentJti, nextJti, new Date('2030-01-02T00:00:00.000Z'));

    const current = await repository.findByJti(currentJti);
    const next = await repository.findByJti(nextJti);
    expect(current?.revokedAt).not.toBeNull();
    expect(current?.replacedByJti).toBe(nextJti);
    expect(next?.family).toBe(family);
  });

  it('revokeFamily revoca todas las sesiones activas de la misma familia', async () => {
    const family = '77777777-7777-4777-8777-777777777777';
    await repository.create({
      jti: '88888888-8888-4888-8888-888888888888',
      family,
      playerId,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });
    await repository.create({
      jti: '99999999-9999-4999-8999-999999999999',
      family,
      playerId,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    await repository.revokeFamily(family);

    const first = await repository.findByJti('88888888-8888-4888-8888-888888888888');
    const second = await repository.findByJti('99999999-9999-4999-8999-999999999999');
    expect(first?.revokedAt).not.toBeNull();
    expect(second?.revokedAt).not.toBeNull();
  });
});
