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

export interface CreateLeagueInput {
  name: string;
  leagueCategory: LeagueCategory;
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
