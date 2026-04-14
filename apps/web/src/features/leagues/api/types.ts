export const LEAGUE_CATEGORIES = [
  'ELITE',
  'PRO',
  'AVANZADO',
  'MASTER',
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'CUARTA',
] as const;
export type LeagueCategory = (typeof LEAGUE_CATEGORIES)[number];

export interface LeagueDto {
  id: string | null;
  name: string;
  leagueCategory: LeagueCategory;
}

export interface SeasonDto {
  id: string | null;
  year: number;
  leagueId: string;
  championId: string | null;
  secondId: string | null;
}

export interface CreatedLeagueDto extends LeagueDto {
  initialSeason: SeasonDto;
}

export interface CreateLeagueInput {
  name: string;
  leagueCategory: LeagueCategory;
}

export interface CreateSeasonInput {
  leagueId: string;
  year: number;
}

export interface RegisterTeamToSeasonInput {
  leagueId: string;
  teamId: string;
  seasonId: string;
}

export interface RegisterTeamToSeasonResponseDto {
  teamSeasonId: string;
  teamId: string;
  seasonId: string;
  membersCount: number;
}

export interface UpdateLeagueInput {
  leagueId: string;
  name?: string;
  leagueCategory?: LeagueCategory;
}

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
