import { PrismaClient, Position as PrismaPosition } from '@prisma/client';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { RosterMember } from '@/domain/rosters/RosterMember';
import { parsePosition } from '@/domain/rosters/Position';
import type {
  IRosterRepository,
  PlayerMembership,
  TeamProfileMembership,
  TeamProfilePlayer,
} from '@/application/ports/rosters/Roster.repository';

export class PrismaRosterRepository implements IRosterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTeamSeasonByTeamAndSeason(
    teamId: TeamId,
    seasonId: SeasonId,
  ): Promise<TeamRoster | null> {
    const row = await this.prisma.teamSeason.findFirst({
      where: { teamId: teamId.value, seasonId: seasonId.value },
      include: {
        rosterPlayers: true,
      },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findById(teamSeasonId: TeamSeasonId): Promise<TeamRoster | null> {
    const row = await this.prisma.teamSeason.findUnique({
      where: { id: teamSeasonId.value },
      include: {
        rosterPlayers: true,
      },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findBySeasonId(seasonId: SeasonId): Promise<TeamRoster[]> {
    const rows = await this.prisma.teamSeason.findMany({
      where: { seasonId: seasonId.value },
      include: {
        rosterPlayers: true,
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findMembershipsByPlayerId(playerId: PlayerId): Promise<PlayerMembership[]> {
    const rows = await this.prisma.rosterPlayer.findMany({
      where: { playerId: playerId.value },
      select: {
        teamSeason: {
          select: {
            id: true,
            teamId: true,
            seasonId: true,
            team: {
              select: {
                name: true,
              },
            },
            season: {
              select: {
                year: true,
                leagueId: true,
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        teamSeason: {
          season: {
            year: 'desc',
          },
        },
      },
    });

    return rows.map(({ teamSeason }) => ({
      teamSeasonId: TeamSeasonId.fromString(teamSeason.id),
      teamId: TeamId.fromString(teamSeason.teamId),
      teamName: teamSeason.team.name,
      seasonId: SeasonId.fromString(teamSeason.seasonId),
      seasonYear: teamSeason.season.year,
      leagueId: teamSeason.season.leagueId,
      leagueName: teamSeason.season.league.name,
    }));
  }

  async findMembershipsByTeamId(teamId: TeamId): Promise<TeamProfileMembership[]> {
    const rows = await this.prisma.teamSeason.findMany({
      where: { teamId: teamId.value },
      select: {
        seasonId: true,
        season: {
          select: {
            year: true,
            leagueId: true,
            league: {
              select: {
                name: true,
                leagueCategory: true,
              },
            },
          },
        },
      },
      orderBy: {
        season: { year: 'desc' },
      },
    });

    return rows.map((row) => ({
      seasonId: SeasonId.fromString(row.seasonId),
      seasonYear: row.season.year,
      leagueId: row.season.leagueId,
      leagueName: row.season.league.name,
      leagueCategory: row.season.league.leagueCategory,
    }));
  }

  async findPlayersByTeamId(teamId: TeamId): Promise<TeamProfilePlayer[]> {
    const rows = await this.prisma.rosterPlayer.findMany({
      where: {
        teamSeason: {
          teamId: teamId.value,
        },
      },
      select: {
        player: {
          select: {
            id: true,
            name: true,
            lastname: true,
            nickname: true,
            category: true,
          },
        },
      },
    });

    const dedup = new Map<string, TeamProfilePlayer>();
    rows.forEach(({ player }) => {
      dedup.set(player.id, {
        id: player.id,
        name: player.name,
        lastname: player.lastname,
        nickname: player.nickname,
        category: player.category,
      });
    });

    return Array.from(dedup.values());
  }

  private toDomain(row: {
    id: string;
    teamId: string;
    seasonId: string;
    rosterPlayers: { playerId: string; position: PrismaPosition }[];
  }): TeamRoster {
    const members = row.rosterPlayers.map((rp) =>
      RosterMember.create({
        playerId: PlayerId.fromString(rp.playerId),
        position: parsePosition(rp.position),
      }),
    );
    return TeamRoster.create({
      teamSeasonId: TeamSeasonId.fromString(row.id),
      teamId: TeamId.fromString(row.teamId),
      seasonId: SeasonId.fromString(row.seasonId),
      members,
    });
  }

  async saveTeamSeason(roster: TeamRoster): Promise<void> {
    const id = roster.teamSeasonId.value;
    await this.prisma.teamSeason.upsert({
      where: { id },
      update: {},
      create: {
        id,
        teamId: roster.teamId.value,
        seasonId: roster.seasonId.value,
      },
    });
  }

  async saveRoster(roster: TeamRoster): Promise<void> {
    const teamSeasonId = roster.teamSeasonId.value;
    await this.prisma.rosterPlayer.deleteMany({
      where: { teamSeasonId },
    });
    for (const m of roster.members) {
      await this.prisma.rosterPlayer.create({
        data: {
          teamSeasonId,
          playerId: m.playerId.value,
          position: m.position as PrismaPosition,
        },
      });
    }
  }
}
