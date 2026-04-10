import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PaginatedResponse } from '@/api/types';
import type { TeamListItemDto } from './types';

function listQuery(page: number, limit: number, q?: string): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set('q', trimmed);
  }
  return `/teams?${params}`;
}

export const useTeams = (page: number, limit: number, q?: string) =>
  useQuery({
    queryKey: queryKeys.teams.list({
      page,
      limit,
      q: q?.trim() ? q.trim() : undefined,
    }),
    queryFn: () => apiJson<PaginatedResponse<TeamListItemDto>>(listQuery(page, limit, q)),
  });
