import { PrismaClient, Position as PrismaPosition } from '@prisma/client';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { RosterMember } from '@/domain/rosters/RosterMember';
import { parsePosition } from '@/domain/rosters/Position';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';

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
