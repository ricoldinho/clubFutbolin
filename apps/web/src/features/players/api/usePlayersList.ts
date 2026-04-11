import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PaginatedResponse } from '@/api/types';
import type { PlayerDto } from '@/features/players/api/types';

function listQuery(page: number, limit: number, q?: string): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set('q', trimmed);
  }
  return `/players?${params}`;
}

export const usePlayersList = (
  page: number,
  limit: number,
  q?: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.players.list({
      page,
      limit,
      q: q?.trim() ? q.trim() : undefined,
    }),
    queryFn: () => apiJson<PaginatedResponse<PlayerDto>>(listQuery(page, limit, q)),
    enabled: options?.enabled !== false,
  });
