/**
 * Fábricas de query keys (convención TanStack Query: arrays estables y jerárquicos).
 */
export const queryKeys = {
  leagues: {
    all: ['leagues'] as const,
    detail: (id: string) => ['leagues', 'detail', id] as const,
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
