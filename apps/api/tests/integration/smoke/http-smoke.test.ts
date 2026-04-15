import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildServer } from '@/main';
import { BcryptPasswordHasher } from '@/adapters/auth/BcryptPasswordHasher';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_EMAIL = 'admin@seed.local';
const ADMIN_PASSWORD = process.env.PRISMA_SEED_ADMIN_PASSWORD ?? 'admin123456';

async function clearDb(prisma: PrismaClient): Promise<void> {
  // Orden para respetar FK:
  // RosterPlayer -> TeamSeason -> Season -> League -> Team -> Player
  await prisma.match.deleteMany({});
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.league.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.player.deleteMany({});
}

async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const passwordHasher = new BcryptPasswordHasher();
  const passwordHash = await passwordHasher.hash(ADMIN_PASSWORD);

  await prisma.player.create({
    data: {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      name: 'Admin',
      lastname: 'Smoke',
      nickname: null,
      phoneNumber: '612345678',
      birthdate: new Date('1990-01-01'),
      category: PlayerCategory.CUARTA,
      role: PlayerRole.ADMIN,
      passwordHash,
    },
  });
}

type LoginResponse = {
  playerId: string;
  role: string;
  expiresIn: string;
};

describe('HTTP smoke (integración)', () => {
  let server: FastifyInstance | undefined;
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida (¿estás ejecutando con test de integración?).');
    }

    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });

    const builtServer = await buildServer();
    server = builtServer;
    await builtServer.ready();
  });

  beforeEach(async () => {
    if (!prisma) throw new Error('prisma no inicializado');
    await clearDb(prisma);
    await seedAdmin(prisma);
  });

  afterAll(async () => {
    if (server) await server.close();
    if (prisma) await prisma.$disconnect();
  });

  it('flujo end-to-end: auth + listados paginados + flujo protegido', async () => {
    if (!server) throw new Error('server no inicializado');

    // 1) Protegido sin token: GET /players => 401
    const noAuthPlayers = await server.inject({
      method: 'GET',
      url: '/players?page=1&limit=20',
    });
    expect(noAuthPlayers.statusCode).toBe(401);

    // 2) Login admin
    const loginRes = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(200);
    const loginBody = loginRes.json() as LoginResponse;
    expect(loginBody.playerId.length).toBeGreaterThan(0);
    expect(loginBody.role).toBe('ADMIN');
    expect(loginBody.expiresIn.length).toBeGreaterThan(0);

    const accessCookie = loginRes.cookies.find((cookie) => cookie.name === 'clubfutbolin_at');
    const authCookies = { clubfutbolin_at: accessCookie?.value ?? '' };

    // 3) Listado paginado (público): GET /leagues
    const leaguesRes = await server.inject({
      method: 'GET',
      url: '/leagues?page=1&limit=20',
    });
    expect(leaguesRes.statusCode).toBe(200);
    const leaguesBody = leaguesRes.json() as {
      data: Array<{ id: string | null; name: string; leagueCategory: string }>;
      meta: { total: number; page: number; lastPage: number };
    };
    expect(leaguesBody.meta).toMatchObject({ page: 1, lastPage: 0, total: 0 });

    // 4) Crear liga (ADMIN)
    const createLeagueRes = await server.inject({
      method: 'POST',
      url: '/leagues',
      cookies: authCookies,
      payload: { name: 'Liga Smoke', leagueCategory: 'PRIMERA' },
    });
    expect(createLeagueRes.statusCode).toBe(201);
    const createdLeague = createLeagueRes.json() as { id: string };

    // 5) Crear temporada (ADMIN)
    const createSeasonRes = await server.inject({
      method: 'POST',
      url: '/seasons',
      cookies: authCookies,
      payload: { year: 2027, leagueId: createdLeague.id },
    });
    expect(createSeasonRes.statusCode).toBe(201);
    createSeasonRes.json() as { id: string };

    // 6) Crear dos jugadores (público) — hacen falta para crear equipo con plantilla
    const createPlayer1Res = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Jugador Smoke',
        lastname: 'Uno',
        nickname: null,
        email: 'player-smoke-uno@example.com',
        phoneNumber: '612345679',
        birthdate: '1995-05-15',
        category: 'CUARTA',
        password: 'user123456',
      },
    });
    expect(createPlayer1Res.statusCode).toBe(201);
    const createdPlayer1 = createPlayer1Res.json() as { id: string };

    const createPlayer2Res = await server.inject({
      method: 'POST',
      url: '/players',
      payload: {
        name: 'Jugador Smoke',
        lastname: 'Dos',
        nickname: null,
        email: 'player-smoke-dos@example.com',
        phoneNumber: '612345680',
        birthdate: '1996-06-16',
        category: 'CUARTA',
        password: 'user123456',
      },
    });
    expect(createPlayer2Res.statusCode).toBe(201);
    const createdPlayer2 = createPlayer2Res.json() as { id: string };

    // 7) Crear equipo con plantilla en la temporada más reciente (2027) — ADMIN
    const createTeamRes = await server.inject({
      method: 'POST',
      url: '/teams',
      cookies: authCookies,
      payload: {
        name: 'Equipo Smoke',
        playerIds: [createdPlayer1.id, createdPlayer2.id],
      },
    });
    expect(createTeamRes.statusCode).toBe(201);
    const createTeamBody = createTeamRes.json() as { id: string; name: string };
    expect(createTeamBody.name).toBe('Equipo Smoke');

    // 8) Listado paginado (ADMIN token): GET /players
    const listPlayersRes = await server.inject({
      method: 'GET',
      url: '/players?page=1&limit=20',
      cookies: authCookies,
    });
    expect(listPlayersRes.statusCode).toBe(200);
    const listPlayersBody = listPlayersRes.json() as {
      data: Array<{ id: string | null; email: string; role: string }>;
      meta: { total: number; page: number; lastPage: number };
    };
    expect(listPlayersBody.meta).toMatchObject({ page: 1, lastPage: 1, total: 3 });
    expect(listPlayersBody.data.some((p) => p.email === 'player-smoke-uno@example.com')).toBe(true);
    expect(listPlayersBody.data.some((p) => p.email === 'player-smoke-dos@example.com')).toBe(true);
  });

  it('OpenAPI: /documentation/json incluye listados paginados', async () => {
    if (!server) throw new Error('server no inicializado');

    const res = await server.inject({
      method: 'GET',
      url: '/documentation/json',
    });
    expect(res.statusCode).toBe(200);

    const doc = JSON.parse(res.payload) as {
      openapi?: string;
      paths?: Record<
        string,
        {
          get?: {
            parameters?: Array<{ name?: string }>;
          };
        }
      >;
    };

    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.paths).toBeDefined();
    expect(doc.paths?.['/leagues']).toBeDefined();

    const leaguesGet = doc.paths?.['/leagues']?.get;
    const parameters = leaguesGet?.parameters ?? [];
    const parameterNames = parameters
      .map((p) => p.name)
      .filter((n): n is string => typeof n === 'string');

    expect(parameterNames).toContain('page');
    expect(parameterNames).toContain('limit');
  });
});

