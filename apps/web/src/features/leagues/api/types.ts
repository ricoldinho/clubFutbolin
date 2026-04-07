export interface LeagueSeasonDto {
  id: string;
  year: number;
  leagueId: string;
  championId: string | null;
  secondId: string | null;
}

export interface LeagueSeasonsResponseDto {
  data: LeagueSeasonDto[];
}

export interface SeasonTeamsByCategoryResponseDto {
  seasonId: string;
  categories: Array<{
    category: string;
    teams: Array<{ id: string; name: string }>;
  }>;
}
