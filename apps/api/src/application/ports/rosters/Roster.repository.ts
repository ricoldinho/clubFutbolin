import type { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';

export interface IRosterRepository {
  findTeamSeasonByTeamAndSeason(teamId: TeamId, seasonId: SeasonId): Promise<TeamRoster | null>;
  findById(teamSeasonId: TeamSeasonId): Promise<TeamRoster | null>;
  saveTeamSeason(roster: TeamRoster): Promise<void>;
  saveRoster(roster: TeamRoster): Promise<void>;
}
