import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaMatchRepository } from '@/adapters/persistence/matches/PrismaMatchRepository';
import { PrismaLeagueRepository } from '@/adapters/persistence/leagues/PrismaLeagueRepository';
import { PrismaTeamRepository } from '@/adapters/persistence/teams/PrismaTeamRepository';
import { PrismaSeasonRepository } from '@/adapters/persistence/seasons/PrismaSeasonRepository';
import { PrismaRosterRepository } from '@/adapters/persistence/rosters/PrismaRosterRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const repository = new PrismaMatchRepository(prisma);
const leagueRepository = new PrismaLeagueRepository(prisma);
const teamRepository = new PrismaTeamRepository(prisma);
const seasonRepository = new PrismaSeasonRepository(prisma);
const rosterRepository = new PrismaRosterRepository(prisma);

async function clearAll(): Promise<void> {
  await prisma.match.deleteMany({});
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.league.deleteMany({});
}

describe('PrismaMatchRepository (integración)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('saveMany + findBySeasonId persiste y lista partidos', async () => {
    const { seasonId, homeTeamSeasonId, awayTeamSeasonId } = await seedSeasonAndRoster();
    const match = Match.create({
      id: MatchId.generate(),
      seasonId,
      homeTeamSeasonId,
      awayTeamSeasonId,
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });

    await repository.saveMany([match]);

    const listed = await repository.findBySeasonId(seasonId, { page: 1, limit: 20 });
    expect(listed.total).toBe(1);
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0].id?.value).toBe(match.id?.value);
  });

  it('save actualiza marcador y findById lo reconstruye', async () => {
    const { seasonId, homeTeamSeasonId, awayTeamSeasonId } = await seedSeasonAndRoster();
    const match = Match.create({
      id: MatchId.generate(),
      seasonId,
      homeTeamSeasonId,
      awayTeamSeasonId,
      date: new Date('2026-04-01T10:00:00.000Z'),
      round: 1,
    });
    await repository.save(match);

    await repository.save(match.updateScore(2, 1));

    const loaded = await repository.findById(match.id!);
    expect(loaded).not.toBeNull();
    expect(loaded?.score.home).toBe(2);
    expect(loaded?.score.away).toBe(1);
    expect(loaded?.status).toBe('FINISHED');
  });
});

async function seedSeasonAndRoster(): Promise<{
  seasonId: SeasonId;
  homeTeamSeasonId: TeamSeasonId;
  awayTeamSeasonId: TeamSeasonId;
}> {
  const leagueId = LeagueId.generate();
  await leagueRepository.save(
    League.create({ id: leagueId, name: 'Liga Match Integration', leagueCategory: 'PRIMERA' }),
  );

  const homeTeamId = TeamId.generate();
  const awayTeamId = TeamId.generate();
  await teamRepository.save(Team.create({ id: homeTeamId, name: 'Home Team Match Integration' }));
  await teamRepository.save(Team.create({ id: awayTeamId, name: 'Away Team Match Integration' }));

  const seasonId = SeasonId.generate();
  await seasonRepository.save(
    Season.create({
      id: seasonId,
      year: 2032,
      leagueId,
    }),
  );

  const homeTeamSeasonId = TeamSeasonId.generate();
  const awayTeamSeasonId = TeamSeasonId.generate();
  await rosterRepository.saveTeamSeason(
    TeamRoster.create({
      teamSeasonId: homeTeamSeasonId,
      teamId: homeTeamId,
      seasonId,
    }),
  );
  await rosterRepository.saveTeamSeason(
    TeamRoster.create({
      teamSeasonId: awayTeamSeasonId,
      teamId: awayTeamId,
      seasonId,
    }),
  );

  return { seasonId, homeTeamSeasonId, awayTeamSeasonId };
}
