export const MATCH_STATUSES = ['SCHEDULED', 'FINISHED', 'POSTPONED', 'CANCELLED'] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export interface MatchDto {
  id: string;
  seasonId: string;
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  round: number;
  status: MatchStatus;
}

export interface PaginatedResponseMeta {
  total: number;
  page: number;
  lastPage: number;
}

export interface SeasonMatchesResponseDto {
  data: MatchDto[];
  meta: PaginatedResponseMeta;
}

export interface SeasonMatchesFilters {
  page: number;
  limit: number;
  round?: number;
}

export interface GenerateSeasonCalendarInput {
  seasonId: string;
  startDate?: string;
}

export interface GenerateSeasonCalendarResponseDto {
  matchesCount: number;
}

export interface UpdateMatchScoreInput {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface UpdateMatchStatusInput {
  matchId: string;
  status: Extract<MatchStatus, 'POSTPONED' | 'CANCELLED'>;
}

export interface MatchMutationResponseDto {
  matchId: string;
}
