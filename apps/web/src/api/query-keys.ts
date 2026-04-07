/**
 * Fábricas de query keys (convención TanStack Query: arrays estables y jerárquicos).
 */
export const queryKeys = {
  players: {
    all: ['players'] as const,
    detail: (playerId: string) => ['players', 'detail', playerId] as const,
    memberships: (playerId: string) => ['players', 'memberships', playerId] as const,
  },
  leagues: {
    all: ['leagues'] as const,
    detail: (id: string) => ['leagues', 'detail', id] as const,
    seasons: (leagueId: string) => ['leagues', 'seasons', leagueId] as const,
    seasonTeamsByCategory: (leagueId: string, seasonId: string) =>
      ['leagues', 'seasons', leagueId, 'teams-by-category', seasonId] as const,
  },
  teams: {
    all: ['teams'] as const,
    profile: (teamId: string) => ['teams', 'profile', teamId] as const,
  },
  matches: {
    all: ['matches'] as const,
    season: (seasonId: string) => ['matches', 'season', seasonId] as const,
    seasonList: (
      seasonId: string,
      filters: { page: number; limit: number; round?: number },
    ) => ['matches', 'season', seasonId, 'list', filters] as const,
    detail: (matchId: string) => ['matches', 'detail', matchId] as const,
  },
} as const;
