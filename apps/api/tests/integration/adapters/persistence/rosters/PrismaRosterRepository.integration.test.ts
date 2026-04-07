import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaRosterRepository } from '@/adapters/persistence/rosters/PrismaRosterRepository';
import { PrismaLeagueRepository } from '@/adapters/persistence/leagues/PrismaLeagueRepository';
import { PrismaTeamRepository } from '@/adapters/persistence/teams/PrismaTeamRepository';
import { PrismaSeasonRepository } from '@/adapters/persistence/seasons/PrismaSeasonRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaRosterRepository(prisma);
const leagueRepository = new PrismaLeagueRepository(prisma);
const teamRepository = new PrismaTeamRepository(prisma);
const seasonRepository = new PrismaSeasonRepository(prisma);

async function clearAll(): Promise<void> {
  await prisma.match.deleteMany({});
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.league.deleteMany({});
  await prisma.player.deleteMany({});
}

describe('PrismaRosterRepository (integración)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('saveTeamSeason + findById + findTeamSeasonByTeamAndSeason: plantilla vacía', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'Liga R', leagueCategory: 'PRIMERA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'Equipo R' }));
    const seasonId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonId, year: 2027, leagueId }));

    const teamSeasonId = TeamSeasonId.generate();
    const roster = TeamRoster.create({
      teamSeasonId,
      teamId,
      seasonId,
      members: [],
    });

    await repository.saveTeamSeason(roster);

    const byId = await repository.findById(teamSeasonId);
    expect(byId).not.toBeNull();
    expect(byId!.members).toHaveLength(0);
    expect(byId!.teamId.value).toBe(teamId.value);
    expect(byId!.seasonId.value).toBe(seasonId.value);

    const byPair = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);
    expect(byPair).not.toBeNull();
    expect(byPair!.teamSeasonId.value).toBe(teamSeasonId.value);
  });

  it('findById: devuelve null si no existe el TeamSeason', async () => {
    expect(await repository.findById(TeamSeasonId.generate())).toBeNull();
  });

  it('findTeamSeasonByTeamAndSeason: devuelve null si no hay inscripción', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L', leagueCategory: 'SEGUNDA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'T' }));
    const seasonId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonId, year: 2028, leagueId }));

    const found = await repository.findTeamSeasonByTeamAndSeason(teamId, seasonId);
    expect(found).toBeNull();
  });

  it('saveRoster: persiste miembros y findById los reconstruye', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L2', leagueCategory: 'TERCERA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'T2' }));
    const seasonId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonId, year: 2029, leagueId }));

    const teamSeasonId = TeamSeasonId.generate();
    let roster = TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] });
    await repository.saveTeamSeason(roster);

    const playerId = PlayerId.generate();
    await prisma.player.create({
      data: {
        id: playerId.value,
        email: `roster-${playerId.value}@example.com`,
        name: 'Jugador',
        lastname: 'Test',
        nickname: null,
        phoneNumber: '611111111',
        birthdate: new Date('1991-02-02'),
        category: 'PRIMERA',
        role: 'USER',
        passwordHash: '$2b$10$testhashrosterintegration',
      },
    });

    roster = (await repository.findById(teamSeasonId))!;
    const withPlayer = roster.addPlayer(playerId, 'PORTERO');
    await repository.saveRoster(withPlayer);

    const loaded = await repository.findById(teamSeasonId);
    expect(loaded!.members).toHaveLength(1);
    expect(loaded!.members[0].playerId.value).toBe(playerId.value);
    expect(loaded!.members[0].position).toBe('PORTERO');
  });

  it('saveRoster: sustituye la lista completa de jugadores', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'L3', leagueCategory: 'CUARTA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'T3' }));
    const seasonId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonId, year: 2030, leagueId }));

    const teamSeasonId = TeamSeasonId.generate();
    await repository.saveTeamSeason(
      TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] }),
    );

    const p1 = PlayerId.generate();
    const p2 = PlayerId.generate();
    for (const [pid, email] of [
      [p1, `r1-${p1.value}@example.com`],
      [p2, `r2-${p2.value}@example.com`],
    ] as const) {
      await prisma.player.create({
        data: {
          id: pid.value,
          email,
          name: 'N',
          lastname: 'A',
          nickname: null,
          phoneNumber: '622222222',
          birthdate: new Date('1992-03-03'),
          category: 'SEGUNDA',
          role: 'USER',
          passwordHash: '$2b$10$hash',
        },
      });
    }

    let roster = (await repository.findById(teamSeasonId))!;
    roster = roster.addPlayer(p1, 'PORTERO').addPlayer(p2, 'DELANTERO');
    await repository.saveRoster(roster);

    roster = (await repository.findById(teamSeasonId))!;
    const onlyP1 = roster.removePlayer(p2);
    await repository.saveRoster(onlyP1);

    const loaded = await repository.findById(teamSeasonId);
    expect(loaded!.members).toHaveLength(1);
    expect(loaded!.members[0].playerId.value).toBe(p1.value);
  });

  it('findMembershipsByPlayerId: devuelve equipos, temporada y liga del jugador', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'Liga Membresias', leagueCategory: 'PRIMERA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'Equipo Membresias' }));
    const seasonId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonId, year: 2031, leagueId }));

    const teamSeasonId = TeamSeasonId.generate();
    await repository.saveTeamSeason(
      TeamRoster.create({ teamSeasonId, teamId, seasonId, members: [] }),
    );

    const playerId = PlayerId.generate();
    await prisma.player.create({
      data: {
        id: playerId.value,
        email: `membership-${playerId.value}@example.com`,
        name: 'Jugador',
        lastname: 'Membership',
        nickname: null,
        phoneNumber: '633333333',
        birthdate: new Date('1995-05-05'),
        category: 'PRIMERA',
        role: 'USER',
        passwordHash: '$2b$10$hashmembership',
      },
    });

    const roster = (await repository.findById(teamSeasonId))!;
    await repository.saveRoster(roster.addPlayer(playerId, 'DELANTERO'));

    const memberships = await repository.findMembershipsByPlayerId(playerId);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      teamName: 'Equipo Membresias',
      seasonYear: 2031,
      leagueName: 'Liga Membresias',
      leagueId: leagueId.value,
    });
    expect(memberships[0].teamId.value).toBe(teamId.value);
    expect(memberships[0].seasonId.value).toBe(seasonId.value);
  });

  it('findPlayersByTeamId: marca isCurrent en la temporada de año máximo', async () => {
    const leagueId = LeagueId.generate();
    await leagueRepository.save(
      League.create({ id: leagueId, name: 'Liga Current', leagueCategory: 'PRIMERA' }),
    );
    const teamId = TeamId.generate();
    await teamRepository.save(Team.create({ id: teamId, name: 'Equipo Current' }));

    const seasonOldId = SeasonId.generate();
    const seasonNewId = SeasonId.generate();
    await seasonRepository.save(Season.create({ id: seasonOldId, year: 2020, leagueId }));
    await seasonRepository.save(Season.create({ id: seasonNewId, year: 2035, leagueId }));

    const tsOld = TeamSeasonId.generate();
    const tsNew = TeamSeasonId.generate();
    await repository.saveTeamSeason(
      TeamRoster.create({ teamSeasonId: tsOld, teamId, seasonId: seasonOldId, members: [] }),
    );
    await repository.saveTeamSeason(
      TeamRoster.create({ teamSeasonId: tsNew, teamId, seasonId: seasonNewId, members: [] }),
    );

    const pOld = PlayerId.generate();
    const pNew = PlayerId.generate();
    for (const [pid, email] of [
      [pOld, `old-${pOld.value}@example.com`],
      [pNew, `new-${pNew.value}@example.com`],
    ] as const) {
      await prisma.player.create({
        data: {
          id: pid.value,
          email,
          name: 'N',
          lastname: 'A',
          nickname: null,
          phoneNumber: '644444444',
          birthdate: new Date('1990-01-01'),
          category: 'PRIMERA',
          role: 'USER',
          passwordHash: '$2b$10$hashcurrent',
        },
      });
    }

    let rOld = (await repository.findById(tsOld))!;
    await repository.saveRoster(rOld.addPlayer(pOld, 'PORTERO'));
    let rNew = (await repository.findById(tsNew))!;
    await repository.saveRoster(rNew.addPlayer(pNew, 'DELANTERO'));

    const players = await repository.findPlayersByTeamId(teamId);
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    expect(byId[pOld.value].isCurrent).toBe(false);
    expect(byId[pNew.value].isCurrent).toBe(true);
  });
});
