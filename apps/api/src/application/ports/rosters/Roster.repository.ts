import type { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

export interface PlayerMembership {
  teamSeasonId: TeamSeasonId;
  teamId: TeamId;
  teamName: string;
  seasonId: SeasonId;
  seasonYear: number;
  leagueId: string;
  leagueName: string;
}

export interface TeamProfileMembership {
  seasonId: SeasonId;
  seasonYear: number;
  leagueId: string;
  leagueName: string;
  leagueCategory: string;
}

export interface TeamProfilePlayer {
  id: string;
  name: string;
  lastname: string;
  nickname: string | null;
  category: string;
}

export interface IRosterRepository {
  findTeamSeasonByTeamAndSeason(teamId: TeamId, seasonId: SeasonId): Promise<TeamRoster | null>;
  findById(teamSeasonId: TeamSeasonId): Promise<TeamRoster | null>;
  findBySeasonId(seasonId: SeasonId): Promise<TeamRoster[]>;
  findMembershipsByPlayerId(playerId: PlayerId): Promise<PlayerMembership[]>;
  findMembershipsByTeamId(teamId: TeamId): Promise<TeamProfileMembership[]>;
  findPlayersByTeamId(teamId: TeamId): Promise<TeamProfilePlayer[]>;
  saveTeamSeason(roster: TeamRoster): Promise<void>;
  saveRoster(roster: TeamRoster): Promise<void>;
}
