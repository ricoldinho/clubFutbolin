import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { MatchStatus, PrismaClient } from '@prisma/client';
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
const USER_PLAYER_ID = '019d66e3-1d5b-730d-b5de-72a010eb62b5';
const ADMIN_PLAYER_EMAIL = 'admin@seed.local';
const USER_PLAYER_EMAIL = 'user@seed.local';

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

const ALLOWED_SCORES: ReadonlyArray<readonly [number, number]> = [
  [4, 0],
  [0, 4],
  [2, 2],
  [1, 3],
  [3, 1],
];

/**
 * Genera una fecha UTC para una jornada concreta repartiendo el calendario
 * a lo largo del año de seed (evita depender del día del mes = round).
 */
function buildSeedMatchDateUtc(seedYear: number, round: number, totalRounds: number): Date {
  const normalizedRound = Math.max(1, round);
  const normalizedTotalRounds = Math.max(1, totalRounds);

  // Distribuye rounds en el rango [0..364] para mantenerse en el mismo año.
  const dayOffset =
    normalizedTotalRounds === 1
      ? 0
      : Math.floor(((normalizedRound - 1) * 364) / (normalizedTotalRounds - 1));

  return new Date(Date.UTC(seedYear, 0, 1 + dayOffset, 20, 0, 0));
}

function buildRoundRobinPairings(teamSeasonIds: string[]): Array<{
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  round: number;
}> {
  if (teamSeasonIds.length < 2) return [];
  if (teamSeasonIds.length % 2 !== 0) {
    throw new Error('Se necesitan equipos pares para generar calendario round-robin completo.');
  }

  const rotation = [...teamSeasonIds];
  const rounds = rotation.length - 1;
  const matchesPerRound = rotation.length / 2;
  const pairings: Array<{ homeTeamSeasonId: string; awayTeamSeasonId: string; round: number }> = [];

  for (let round = 1; round <= rounds; round += 1) {
    for (let i = 0; i < matchesPerRound; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      pairings.push({
        homeTeamSeasonId: round % 2 === 0 ? away : home,
        awayTeamSeasonId: round % 2 === 0 ? home : away,
        round,
      });
    }

    const fixed = rotation[0];
    const tail = rotation.slice(1);
    const moved = tail.pop();
    if (!moved) continue;
    rotation.splice(0, rotation.length, fixed, moved, ...tail);
  }

  return pairings;
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

  // 4) Seasons (2025 para las dos ligas solicitadas)
  const seedYear = 2025;
  const seasons = await Promise.all(
    leagues.map((league, i) => {
      const champion = teams[i % teams.length];
      const second = teams[(i + 1) % teams.length];
      return prisma.season.create({
        data: {
          year: seedYear,
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
      const isDefaultUser = i === 1;
      const role = isAdmin ? PlayerRole.ADMIN : PlayerRole.USER;
      const passwordHash = isAdmin ? adminPasswordHash : userPasswordHash;

      const birthdate = faker.date.birthdate({ min: 18, max: 38, mode: 'age' });

      return prisma.player.create({
        data: {
          id: isAdmin
            ? ADMIN_PLAYER_ID
            : isDefaultUser
              ? USER_PLAYER_ID
              : PlayerId.generate().value,
          email: isAdmin
            ? ADMIN_PLAYER_EMAIL
            : isDefaultUser
              ? USER_PLAYER_EMAIL
              : `player${i + 1}@seed.local`,
          name: isDefaultUser ? 'Usuario' : faker.person.firstName(),
          lastname: isDefaultUser ? 'Seed' : faker.person.lastName(),
          nickname: isDefaultUser ? 'user-seed' : faker.person.firstName(),
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

  // El admin debe pertenecer a más de un equipo en ligas distintas:
  // forzamos una membresía por cada liga/temporada creada.
  const adminPlayer = players.find((player) => player.id === ADMIN_PLAYER_ID);
  if (!adminPlayer) {
    throw new Error('No se pudo encontrar el player admin en seed');
  }

  const forcedAdminTeamSeasonIds = new Set<string>();
  seasons.forEach((season, seasonIndex) => {
    const targetTeam = teams[(seasonIndex + 1) % teams.length];
    const targetTeamSeason = teamSeasons.find(
      (teamSeason) => teamSeason.seasonId === season.id && teamSeason.teamId === targetTeam.id,
    );

    if (!targetTeamSeason) {
      throw new Error(`No se encontró TeamSeason para season=${season.id} team=${targetTeam.id}`);
    }

    forcedAdminTeamSeasonIds.add(targetTeamSeason.id);
  });

  const playersWithoutAdmin = players.filter((player) => player.id !== ADMIN_PLAYER_ID);

  for (const teamSeason of teamSeasons) {
    const pool = forcedAdminTeamSeasonIds.has(teamSeason.id) ? playersWithoutAdmin : players;
    const rosterPlayers = pickN(pool, 4);
    rosterPlayers.forEach((player) => {
      rosterPlayersData.push({
        teamSeasonId: teamSeason.id,
        playerId: player.id,
        position: positions[faker.number.int({ min: 0, max: positions.length - 1 })],
      });
    });
  }

  forcedAdminTeamSeasonIds.forEach((teamSeasonId) => {
    rosterPlayersData.push({
      teamSeasonId,
      playerId: adminPlayer.id,
      position: 'DELANTERO',
    });
  });

  await prisma.rosterPlayer.createMany({
    data: rosterPlayersData,
    skipDuplicates: true,
  });

  // 8) Matches completos por temporada (todos contra todos, una vuelta)
  const matchesData: Array<{
    seasonId: string;
    homeTeamSeasonId: string;
    awayTeamSeasonId: string;
    homeScore: number;
    awayScore: number;
    date: Date;
    round: number;
    status: MatchStatus;
  }> = [];

  for (const season of seasons) {
    const seasonTeamSeasons = teamSeasons
      .filter((teamSeason) => teamSeason.seasonId === season.id)
      .map((teamSeason) => teamSeason.id);

    const pairings = buildRoundRobinPairings(seasonTeamSeasons);
    const totalRounds = pairings.reduce((max, pairing) => Math.max(max, pairing.round), 1);
    pairings.forEach((pairing) => {
      const [homeScore, awayScore] =
        ALLOWED_SCORES[faker.number.int({ min: 0, max: ALLOWED_SCORES.length - 1 })];

      matchesData.push({
        seasonId: season.id,
        homeTeamSeasonId: pairing.homeTeamSeasonId,
        awayTeamSeasonId: pairing.awayTeamSeasonId,
        homeScore,
        awayScore,
        date: buildSeedMatchDateUtc(seedYear, pairing.round, totalRounds),
        round: pairing.round,
        status: MatchStatus.FINISHED,
      });
    });
  }

  await prisma.match.createMany({
    data: matchesData,
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

