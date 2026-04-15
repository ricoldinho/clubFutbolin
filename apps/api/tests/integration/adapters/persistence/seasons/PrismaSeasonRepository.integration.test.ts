import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaSeasonRepository } from '@/adapters/persistence/seasons/PrismaSeasonRepository';
import { PrismaLeagueRepository } from '@/adapters/persistence/leagues/PrismaLeagueRepository';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { League } from '@/domain/leagues/League.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaSeasonRepository(prisma);
const leagueRepository = new PrismaLeagueRepository(prisma);

async function clearSeasonRelated(): Promise<void> {
  await prisma.match.deleteMany({});
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.league.deleteMany({});
}

describe('PrismaSeasonRepository (integración)', () => {
  beforeEach(async () => {
    await clearSeasonRelated();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('save: persiste temporada y findById la recupera', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'Liga S', leagueCategory: 'PRIMERA' }),
    );

    const seasonId = SeasonId.generate();
    const season = Season.create({
      id: seasonId,
      year: 2026,
      leagueId,
      championId: null,
      secondId: null,
    });

    await repository.save(season);

    const found = await repository.findById(seasonId);
    expect(found).not.toBeNull();
    expect(found!.year).toBe(2026);
    expect(found!.leagueId.value).toBe(leagueId.value);
  });

  it('findById: devuelve null si no existe', async () => {
    expect(await repository.findById(SeasonId.generate())).toBeNull();
  });

  it('findByLeagueId: filtra por liga', async () => {
    const l1 = LeagueId.generate();
    const l2 = LeagueId.generate();
    await leagueRepository.save(League.create({ id: l1, name: 'L1', leagueCategory: 'SEGUNDA' }));
    await leagueRepository.save(League.create({ id: l2, name: 'L2', leagueCategory: 'SEGUNDA' }));

    await repository.save(Season.create({ year: 2020, leagueId: l1 }));
    await repository.save(Season.create({ year: 2021, leagueId: l1 }));
    await repository.save(Season.create({ year: 2020, leagueId: l2 }));

    const forL1 = await repository.findByLeagueId(l1);
    expect(forL1).toHaveLength(2);
    const years = forL1.map((s) => s.year).sort();
    expect(years).toEqual([2020, 2021]);
  });

  it('findAll: devuelve todas las temporadas', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L', leagueCategory: 'TERCERA' }),
    );
    await repository.save(Season.create({ year: 2019, leagueId: leagueId }));
    await repository.save(Season.create({ year: 2020, leagueId: leagueId }));

    const all = await repository.findAll();
    expect(all).toHaveLength(2);
  });

  it('save: actualiza año y ganadores', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L', leagueCategory: 'ELITE' }),
    );
    const t1 = await prisma.team.create({ data: { name: 'Campeón' } });
    const t2 = await prisma.team.create({ data: { name: 'Sub' } });

    const seasonId = SeasonId.generate();
    await repository.save(
      Season.create({
        id: seasonId,
        year: 2022,
        leagueId,
      }),
    );

    const updated = (await repository.findById(seasonId))!.setWinners(
      TeamId.fromString(t1.id),
      TeamId.fromString(t2.id),
    );
    await repository.save(updated);

    const found = await repository.findById(seasonId);
    expect(found!.championId!.value).toBe(t1.id);
    expect(found!.secondId!.value).toBe(t2.id);
  });

  it('delete: elimina la temporada', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L', leagueCategory: 'CUARTA' }),
    );
    const seasonId = SeasonId.generate();
    await repository.save(Season.create({ id: seasonId, year: 2030, leagueId }));

    await repository.delete(seasonId);

    expect(await repository.findById(seasonId)).toBeNull();
  });
});
