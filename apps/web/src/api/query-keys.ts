/**
 * Fábricas de query keys (convención TanStack Query: arrays estables y jerárquicos).
 */
export const queryKeys = {
  leagues: {
    all: ['leagues'] as const,
    detail: (id: string) => ['leagues', 'detail', id] as const,
  },
} as const;
