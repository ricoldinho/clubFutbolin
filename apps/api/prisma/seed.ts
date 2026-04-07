import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';

import { BcryptPasswordHasher } from '@/adapters/auth/BcryptPasswordHasher';
import { LEAGUE_CATEGORIES } from '@/domain/leagues/LeagueCategory';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { POSITIONS } from '@/domain/rosters/Position';

// En monorepo, los scripts npm suelen ejecutarse con cwd en `apps/api`.
// Cargamos `.env` del root y, por si acaso, el de `apps/api`.
loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv({ path: resolve(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL no está definida. Define DATABASE_URL (o copia .env.example a .env y asegúrate de que incluya DATABASE_URL).',
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ADMIN_PLAYER_ID = '019d66e3-1d5b-730d-b5de-72a010eb62b4';

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += faker.number.int({ min: 0, max: 9 });
  return out;
}

function pickN<T>(arr: T[], n: number): T[] {
  if (n < 0) {
    throw new Error(`pickN(): n must be >= 0. Received: ${n}`);
  }
  if (n > arr.length) {
    throw new Error(
      `pickN(): cannot pick ${n} unique items from array of length ${arr.length}`,
    );
  }

  const result: T[] = [];
  const used = new Set<number>();

  while (result.length < n) {
    const idx = faker.number.int({ min: 0, max: arr.length - 1 });
    if (used.has(idx)) continue;
    used.add(idx);
    result.push(arr[idx]);
  }

  return result;
}

async function main() {
  const seed =
    process.env.PRISMA_SEED_RANDOM_SEED !== undefined
      ? Number(process.env.PRISMA_SEED_RANDOM_SEED)
      : 42;
  faker.seed(seed);

  const adminPlainPassword = process.env.PRISMA_SEED_ADMIN_PASSWORD ?? 'admin123456';
  const userPlainPassword = process.env.PRISMA_SEED_USER_PASSWORD ?? 'user123456';

  const passwordHasher = new BcryptPasswordHasher();
  const adminPasswordHash = await passwordHasher.hash(adminPlainPassword);
  const userPasswordHash = await passwordHasher.hash(userPlainPassword);

  // 1) Limpieza completa del "mundo" (en orden para respetar FKs).
  // Match -> RosterPlayer -> TeamSeason -> Season -> Team -> League
  await prisma.match.deleteMany();
  await prisma.rosterPlayer.deleteMany();
  await prisma.teamSeason.deleteMany();
  await prisma.season.deleteMany();
  await prisma.team.deleteMany();
  await prisma.league.deleteMany();
  await prisma.player.deleteMany();

  // 2) Leagues (mínimo 2 para garantizar membresías del admin en ligas distintas)
  const leagues = await Promise.all(
    [1, 2].map((leagueIdx) =>
      prisma.league.create({
        data: {
          name: `Liga Seed ${seed} - ${leagueIdx}`,
          leagueCategory:
            LEAGUE_CATEGORIES[faker.number.int({ min: 0, max: LEAGUE_CATEGORIES.length - 1 })],
        },
      }),
    ),
  );

  // 3) Teams
  const teamCount = 8;
  const teams = await Promise.all(
    Array.from({ length: teamCount }).map((_, i) =>
      prisma.team.create({
        data: {
          name: `Equipo ${i + 1}`,
        },
      }),
    ),
  );

  // 4) Seasons (una por cada liga)
  const nowYear = new Date().getFullYear();
  const seasons = await Promise.all(
    leagues.map((league, i) => {
      const champion = teams[i % teams.length];
      const second = teams[(i + 1) % teams.length];
      return prisma.season.create({
        data: {
          year: nowYear - i,
          leagueId: league.id,
          championId: champion.id,
          secondId: second.id,
        },
      });
    }),
  );

  // 5) TeamSeasons (todos los equipos en todas las temporadas)
  const teamSeasons = await Promise.all(
    teams.flatMap((team) =>
      seasons.map((season) =>
        prisma.teamSeason.create({
          data: {
            teamId: team.id,
            seasonId: season.id,
          },
        }),
      ),
    ),
  );

  // 6) Players
  const playerCount = 20;
  const playerCategories = Object.values(PlayerCategory);
  const positions = POSITIONS;

  const players = await Promise.all(
    Array.from({ length: playerCount }).map(async (_, i) => {
      const isAdmin = i === 0;
      const role = isAdmin ? PlayerRole.ADMIN : PlayerRole.USER;
      const passwordHash = isAdmin ? adminPasswordHash : userPasswordHash;

      const birthdate = faker.date.birthdate({ min: 18, max: 38, mode: 'age' });

      return prisma.player.create({
        data: {
          id: isAdmin ? ADMIN_PLAYER_ID : PlayerId.generate().value,
          email: isAdmin ? 'admin@seed.local' : `player${i + 1}@seed.local`,
          name: faker.person.firstName(),
          lastname: faker.person.lastName(),
          nickname: faker.person.firstName(),
          phoneNumber: randomDigits(faker.number.int({ min: 9, max: 15 })),
          birthdate: birthdate,
          category:
            playerCategories[faker.number.int({ min: 0, max: playerCategories.length - 1 })] as PlayerCategory,
          role,
          passwordHash,
        },
      });
    }),
  );

  // 7) RosterPlayers (4 por TeamSeason)
  const rosterPlayersData: Array<{
    teamSeasonId: string;
    playerId: string;
    position: (typeof positions)[number];
  }> = [];

  for (const teamSeason of teamSeasons) {
    const rosterPlayers = pickN(players, 4);
    rosterPlayers.forEach((player) => {
      rosterPlayersData.push({
        teamSeasonId: teamSeason.id,
        playerId: player.id,
        position: positions[faker.number.int({ min: 0, max: positions.length - 1 })],
      });
    });
  }

  // El admin debe pertenecer a más de un equipo en ligas distintas:
  // forzamos una membresía por cada liga/temporada creada.
  const adminPlayer = players.find((player) => player.id === ADMIN_PLAYER_ID);
  if (!adminPlayer) {
    throw new Error('No se pudo encontrar el player admin en seed');
  }

  seasons.forEach((season, seasonIndex) => {
    const targetTeam = teams[(seasonIndex + 1) % teams.length];
    const targetTeamSeason = teamSeasons.find(
      (teamSeason) => teamSeason.seasonId === season.id && teamSeason.teamId === targetTeam.id,
    );

    if (!targetTeamSeason) {
      throw new Error(`No se encontró TeamSeason para season=${season.id} team=${targetTeam.id}`);
    }

    rosterPlayersData.push({
      teamSeasonId: targetTeamSeason.id,
      playerId: adminPlayer.id,
      position: 'DELANTERO',
    });
  });

  await prisma.rosterPlayer.createMany({
    data: rosterPlayersData,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Error en prisma seed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });

