import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildServer } from '@/main';
import { BcryptPasswordHasher } from '@/adapters/auth/BcryptPasswordHasher';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';

const PLAYER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PLAYER_EMAIL = 'security-session@example.com';
const PLAYER_PASSWORD = 'Password123!';

async function clearDb(prisma: PrismaClient): Promise<void> {
  await prisma.refreshTokenSession.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.league.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.player.deleteMany({});
}

async function seedPlayer(prisma: PrismaClient): Promise<void> {
  const passwordHasher = new BcryptPasswordHasher();
  const passwordHash = await passwordHasher.hash(PLAYER_PASSWORD);
  await prisma.player.create({
    data: {
      id: PLAYER_ID,
      email: PLAYER_EMAIL,
      name: 'Security',
      lastname: 'Session',
      nickname: null,
      phoneNumber: '611222333',
      birthdate: new Date('1995-01-01'),
      category: PlayerCategory.CUARTA,
      role: PlayerRole.USER,
      passwordHash,
    },
  });
}

describe('Auth session security (integración)', () => {
  let server: FastifyInstance | undefined;
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida.');
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    server = await buildServer();
    await server.ready();
  });

  beforeEach(async () => {
    if (!prisma) throw new Error('prisma no inicializado');
    await clearDb(prisma);
    await seedPlayer(prisma);
  });

  afterAll(async () => {
    if (server) await server.close();
    if (prisma) await prisma.$disconnect();
  });

  it('detecta reuse de refresh token y revoca la familia completa', async () => {
    if (!server) throw new Error('server no inicializado');

    const login = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: PLAYER_EMAIL, password: PLAYER_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    const refreshCookie = login.cookies.find((cookie) => cookie.name === 'clubfutbolin_rt');
    const csrfCookie = login.cookies.find((cookie) => cookie.name === 'clubfutbolin_csrf');

    const firstRefresh = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        clubfutbolin_rt: refreshCookie?.value ?? '',
        clubfutbolin_csrf: csrfCookie?.value ?? '',
      },
      headers: {
        'x-csrf-token': csrfCookie?.value ?? '',
      },
    });
    expect(firstRefresh.statusCode).toBe(200);
    const rotatedRefreshCookie = firstRefresh.cookies.find((cookie) => cookie.name === 'clubfutbolin_rt');
    const rotatedCsrfCookie = firstRefresh.cookies.find((cookie) => cookie.name === 'clubfutbolin_csrf');

    const reusedOldRefresh = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        clubfutbolin_rt: refreshCookie?.value ?? '',
        clubfutbolin_csrf: csrfCookie?.value ?? '',
      },
      headers: {
        'x-csrf-token': csrfCookie?.value ?? '',
      },
    });
    expect(reusedOldRefresh.statusCode).toBe(401);

    const familyShouldBeRevoked = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: {
        clubfutbolin_rt: rotatedRefreshCookie?.value ?? '',
        clubfutbolin_csrf: rotatedCsrfCookie?.value ?? '',
      },
      headers: {
        'x-csrf-token': rotatedCsrfCookie?.value ?? '',
      },
    });
    expect(familyShouldBeRevoked.statusCode).toBe(401);
  });
});
