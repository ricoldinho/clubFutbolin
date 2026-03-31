import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';

export class InMemoryRosterRepository implements IRosterRepository {
  private readonly rosters: TeamRoster[] = [];

  async findTeamSeasonByTeamAndSeason(
    teamId: TeamId,
    seasonId: SeasonId,
  ): Promise<TeamRoster | null> {
    return (
      this.rosters.find(
        (r) => r.teamId.equals(teamId) && r.seasonId.equals(seasonId),
      ) ?? null
    );
  }

  async findById(teamSeasonId: TeamSeasonId): Promise<TeamRoster | null> {
    return this.rosters.find((r) => r.teamSeasonId.equals(teamSeasonId)) ?? null;
  }

  async findBySeasonId(seasonId: SeasonId): Promise<TeamRoster[]> {
    return this.rosters.filter((r) => r.seasonId.equals(seasonId));
  }

  async saveTeamSeason(roster: TeamRoster): Promise<void> {
    const existing = this.rosters.find((r) =>
      r.teamSeasonId.equals(roster.teamSeasonId),
    );
    if (!existing) {
      this.rosters.push(roster);
    }
  }

  async saveRoster(roster: TeamRoster): Promise<void> {
    const idx = this.rosters.findIndex((r) =>
      r.teamSeasonId.equals(roster.teamSeasonId),
    );
    if (idx >= 0) {
      this.rosters[idx] = roster;
    } else {
      this.rosters.push(roster);
    }
  }
}
